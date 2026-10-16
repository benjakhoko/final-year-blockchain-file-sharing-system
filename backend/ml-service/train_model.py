import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib
import os

# ============================================
# 1. Generate synthetic dataset for file classification
# ============================================
def generate_file_data(n_samples=2000):
    np.random.seed(42)
    
    # Features: file_size (KB), entropy, extension_encoded, is_executable, is_archive, is_doc
    file_types = ['exe', 'dll', 'docx', 'pdf', 'xlsx', 'zip', 'rar', 'jpg', 'png', 'txt', 'py', 'js', 'jar']
    malicious_types = ['exe', 'dll', 'jar', 'js', 'vbs']
    
    data = []
    for _ in range(n_samples):
        ext = np.random.choice(file_types)
        size = np.random.uniform(10, 50000)  # KB
        entropy = np.random.uniform(4.5, 8.0) if ext in ['exe', 'dll', 'jar'] else np.random.uniform(2.0, 6.0)
        is_executable = 1 if ext in ['exe', 'dll', 'jar'] else 0
        is_archive = 1 if ext in ['zip', 'rar'] else 0
        is_doc = 1 if ext in ['docx', 'pdf', 'xlsx', 'txt'] else 0
        
        # Malicious label: if ext in malicious_types and some randomness
        malicious = 1 if (ext in malicious_types and np.random.rand() > 0.3) else 0
        # add some noise
        if np.random.rand() < 0.05:
            malicious = 1 - malicious  # flip 5% of labels
        
        data.append([size, entropy, is_executable, is_archive, is_doc, ext, malicious])
    
    columns = ['size', 'entropy', 'is_executable', 'is_archive', 'is_doc', 'extension', 'malicious']
    df = pd.DataFrame(data, columns=columns)
    
    # Encode extension
    le = LabelEncoder()
    df['extension_encoded'] = le.fit_transform(df['extension'])
    df.drop('extension', axis=1, inplace=True)
    
    return df, le

# ============================================
# 2. Generate synthetic dataset for sharing anomaly detection
# ============================================
def generate_sharing_data(n_samples=1500):
    np.random.seed(42)
    
    # Features: num_files_shared_last_hour, num_recipients, avg_file_size_kb, sensitive_file_count, device_new, time_anomaly
    data = []
    for _ in range(n_samples):
        files_shared = np.random.poisson(2)
        recipients = np.random.poisson(1.5) + 1
        avg_size = np.random.gamma(2, 500)
        sensitive = np.random.binomial(1, 0.2)
        device_new = np.random.binomial(1, 0.1)
        time_anomaly = np.random.binomial(1, 0.05)  # sharing at unusual hour
        
        # Label: 1 if abnormal sharing
        abnormal = 0
        if files_shared > 10: abnormal = 1
        if recipients > 5: abnormal = 1
        if sensitive == 1 and files_shared > 3: abnormal = 1
        if device_new == 1 and files_shared > 2: abnormal = 1
        if time_anomaly == 1: abnormal = 1
        
        # add noise
        if np.random.rand() < 0.1:
            abnormal = 1 - abnormal
        
        data.append([files_shared, recipients, avg_size, sensitive, device_new, time_anomaly, abnormal])
    
    columns = ['files_shared', 'recipients', 'avg_size', 'sensitive', 'device_new', 'time_anomaly', 'abnormal']
    df = pd.DataFrame(data, columns=columns)
    return df

# ============================================
# 3. Train and save models
# ============================================
def train_and_save():
    print("🔄 Generating file classification data...")
    file_df, ext_encoder = generate_file_data(3000)
    X_file = file_df.drop('malicious', axis=1)
    y_file = file_df['malicious']
    X_train, X_test, y_train, y_test = train_test_split(X_file, y_file, test_size=0.2, random_state=42)
    
    print("🔄 Training file classifier...")
    clf_file = RandomForestClassifier(n_estimators=100, random_state=42)
    clf_file.fit(X_train, y_train)
    accuracy = clf_file.score(X_test, y_test)
    print(f"✅ File classifier accuracy: {accuracy:.2f}")
    
    # Save model and encoder
    joblib.dump(clf_file, 'models/file_classifier.pkl')
    joblib.dump(ext_encoder, 'models/extension_encoder.pkl')
    print("✅ File classifier saved to models/file_classifier.pkl")
    
    # ========== Sharing anomaly model ==========
    print("🔄 Generating sharing anomaly data...")
    share_df = generate_sharing_data(2000)
    X_share = share_df.drop('abnormal', axis=1)
    y_share = share_df['abnormal']
    X_train_s, X_test_s, y_train_s, y_test_s = train_test_split(X_share, y_share, test_size=0.2, random_state=42)
    
    print("🔄 Training sharing anomaly detector...")
    clf_share = RandomForestClassifier(n_estimators=100, random_state=42)
    clf_share.fit(X_train_s, y_train_s)
    acc_s = clf_share.score(X_test_s, y_test_s)
    print(f"✅ Sharing anomaly accuracy: {acc_s:.2f}")
    
    joblib.dump(clf_share, 'models/sharing_anomaly.pkl')
    print("✅ Sharing anomaly model saved to models/sharing_anomaly.pkl")

if __name__ == "__main__":
    os.makedirs('models', exist_ok=True)
    train_and_save()