from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
import os
import json
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = 'ml-service-secret-key-change-in-production'
CORS(app)

# ============================================
# Feature order must match training
# ============================================
FILE_FEATURES = ['size', 'entropy', 'is_executable', 'is_archive', 'is_doc', 'extension_encoded']
SHARE_FEATURES = ['files_shared', 'recipients', 'avg_size', 'sensitive', 'device_new', 'time_anomaly']

# ============================================
# Load models
# ============================================
file_clf = None
extension_encoder = None
sharing_clf = None

try:
    file_clf = joblib.load('models/file_classifier.pkl')
    extension_encoder = joblib.load('models/extension_encoder.pkl')
    sharing_clf = joblib.load('models/sharing_anomaly.pkl')
    logger.info("✅ Models loaded successfully")
    if hasattr(file_clf, "feature_names_in_"):
        logger.info(f"file_clf expects: {list(file_clf.feature_names_in_)}")
    if hasattr(sharing_clf, "feature_names_in_"):
        logger.info(f"sharing_clf expects: {list(sharing_clf.feature_names_in_)}")
except Exception as e:
    logger.error(f"❌ Error loading models: {e}")
    file_clf = None
    extension_encoder = None
    sharing_clf = None


# ============================================
# History storage (JSON file)
# ============================================
HISTORY_FILE = 'data/history.json'

def load_history():
    if not os.path.exists(HISTORY_FILE):
        os.makedirs('data', exist_ok=True)
        with open(HISTORY_FILE, 'w') as f:
            json.dump([], f)
        return []
    try:
        with open(HISTORY_FILE, 'r') as f:
            return json.load(f)
    except Exception:
        return []

def save_history(history):
    os.makedirs('data', exist_ok=True)
    with open(HISTORY_FILE, 'w') as f:
        json.dump(history, f, indent=2, default=str)

def add_to_history(entry):
    history = load_history()
    entry['id'] = len(history) + 1
    entry['timestamp'] = datetime.now().isoformat()
    history.insert(0, entry)
    history = history[:100]
    save_history(history)
    return entry


# ============================================
# File type helpers (for UI convenience)
# ============================================
EXECUTABLE_EXTS = ['exe', 'dll', 'jar', 'js', 'vbs', 'bat', 'sh', 'ps1', 'msi']
ARCHIVE_EXTS = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2']
DOC_EXTS = ['docx', 'pdf', 'xlsx', 'txt', 'csv', 'doc', 'pptx']


# ============================================
# UI ROUTES
# ============================================

@app.route('/')
def index():
    """Dashboard - shows stats and overview"""
    history = load_history()

    total_analyses = len(history)
    malicious_count = sum(1 for h in history if h.get('malicious') == 1)
    safe_count = sum(1 for h in history if h.get('malicious') == 0)
    recent = history[:10]

    stats = {
        'total_analyses': total_analyses,
        'malicious': malicious_count,
        'safe': safe_count,
        'models_loaded': file_clf is not None and sharing_clf is not None
    }

    return render_template('index.html', stats=stats, recent=recent)


@app.route('/classify', methods=['GET', 'POST'])
def classify():
    """Single file classification page"""
    result = None
    if request.method == 'POST':
        try:
            size = float(request.form.get('file_size', 100))
            entropy = float(request.form.get('entropy', 5.0))
            extension = request.form.get('extension', 'txt').lower().strip('.')

            is_executable = 1 if extension in EXECUTABLE_EXTS else 0
            is_archive = 1 if extension in ARCHIVE_EXTS else 0
            is_doc = 1 if extension in DOC_EXTS else 0

            try:
                if extension_encoder is None:
                    raise ValueError("Extension encoder not loaded")
                ext_encoded = int(extension_encoder.transform([extension])[0])
            except Exception:
                ext_encoded = 0

            features = pd.DataFrame([{
                'size': size,
                'entropy': entropy,
                'is_executable': is_executable,
                'is_archive': is_archive,
                'is_doc': is_doc,
                'extension_encoded': ext_encoded,
            }])[FILE_FEATURES]

            prob = float(file_clf.predict_proba(features)[0][1])
            pred = int(prob > 0.5)

            risk_level = 'low'
            if prob > 0.7:
                risk_level = 'high'
            elif prob > 0.4:
                risk_level = 'medium'

            result = {
                'file_size': size,
                'entropy': entropy,
                'extension': extension,
                'is_executable': is_executable,
                'is_archive': is_archive,
                'is_doc': is_doc,
                'malicious': pred,
                'probability': round(prob, 4),
                'risk_level': risk_level
            }

            add_to_history({
                'type': 'file_classification',
                **result
            })

        except Exception as e:
            logger.error(f"Classification error: {e}")
            result = {'error': str(e)}

    return render_template('classify.html', result=result)


@app.route('/sharing', methods=['GET', 'POST'])
def sharing():
    """Sharing anomaly detection page"""
    result = None
    if request.method == 'POST':
        try:
            files_shared = int(request.form.get('files_shared', 1))
            recipients = int(request.form.get('recipients', 1))
            avg_size = float(request.form.get('avg_size', 100))
            sensitive = 1 if request.form.get('sensitive') else 0
            device_new = 1 if request.form.get('device_new') else 0
            time_anomaly = 1 if request.form.get('time_anomaly') else 0

            features = pd.DataFrame([{
                'files_shared': files_shared,
                'recipients': recipients,
                'avg_size': avg_size,
                'sensitive': sensitive,
                'device_new': device_new,
                'time_anomaly': time_anomaly,
            }])[SHARE_FEATURES]

            prob = float(sharing_clf.predict_proba(features)[0][1])
            pred = int(prob > 0.5)

            risk = 'low'
            if prob > 0.7:
                risk = 'high'
            elif prob > 0.4:
                risk = 'medium'

            result = {
                'files_shared': files_shared,
                'recipients': recipients,
                'avg_size': avg_size,
                'sensitive': sensitive,
                'device_new': device_new,
                'time_anomaly': time_anomaly,
                'abnormal': pred,
                'probability': round(prob, 4),
                'risk': risk
            }

            add_to_history({
                'type': 'sharing_anomaly',
                **result
            })

        except Exception as e:
            logger.error(f"Sharing anomaly error: {e}")
            result = {'error': str(e)}

    return render_template('sharing.html', result=result)


@app.route('/history')
def history_page():
    """View all past analyses"""
    history = load_history()
    return render_template('history.html', history=history)


@app.route('/history/clear', methods=['POST'])
def clear_history():
    save_history([])
    flash('History cleared successfully', 'success')
    return redirect(url_for('history_page'))


# ============================================
# API ENDPOINTS (for Node.js backend integration)
# ============================================

@app.route('/classify-file', methods=['POST'])
def classify_file():
    if file_clf is None:
        return jsonify({"error": "Model not loaded"}), 500

    data = request.json or {}
    try:
        size = data.get('file_size_kb', 100)
        entropy = data.get('entropy', 5.0)
        is_executable = data.get('is_executable', 0)
        is_archive = data.get('is_archive', 0)
        is_doc = data.get('is_doc', 0)
        extension = data.get('extension', 'txt')

        try:
            if extension_encoder is None:
                raise ValueError("Extension encoder not loaded")
            ext_encoded = int(extension_encoder.transform([extension])[0])
        except Exception:
            ext_encoded = 0

        features = pd.DataFrame([{
            'size': size,
            'entropy': entropy,
            'is_executable': is_executable,
            'is_archive': is_archive,
            'is_doc': is_doc,
            'extension_encoded': ext_encoded,
        }])[FILE_FEATURES]

        prob = float(file_clf.predict_proba(features)[0][1])
        pred = int(prob > 0.5)

        risk_level = 'low'
        if prob > 0.7:
            risk_level = 'high'
        elif prob > 0.4:
            risk_level = 'medium'

        return jsonify({
            "malicious": pred,
            "probability": round(prob, 4),
            "risk_level": risk_level
        })
    except Exception as e:
        logger.error(f"Classification error: {e}")
        return jsonify({"error": str(e)}), 400


@app.route('/detect-abnormal-sharing', methods=['POST'])
def detect_abnormal_sharing():
    if sharing_clf is None:
        return jsonify({"error": "Model not loaded"}), 500

    data = request.json or {}
    try:#
        features = pd.DataFrame([{
            'files_shared': data.get('files_shared', 0),
            'recipients': data.get('recipients', 0),
            'avg_size': data.get('avg_size_kb', 100),
            'sensitive': data.get('sensitive', 0),
            'device_new': data.get('device_new', 0),
            'time_anomaly': data.get('time_anomaly', 0),
        }])[SHARE_FEATURES]

        prob = float(sharing_clf.predict_proba(features)[0][1])
        pred = int(prob > 0.5)
        risk = "low"
        if prob > 0.7:
            risk = "high"
        elif prob > 0.4:
            risk = "medium"

        return jsonify({"abnormal": pred, "probability": round(prob, 4), "risk": risk})
    except Exception as e:
        logger.error(f"Sharing anomaly error: {e}")
        return jsonify({"error": str(e)}), 400


@app.route('/assess-access-risk', methods=['POST'])
def assess_access_risk():
    """
    Combined risk assessment for file access attempts.
    Combines file classification probability with abnormal sharing probability
    to produce a composite risk score.
    """
    if file_clf is None or sharing_clf is None:
        return jsonify({"error": "Models not loaded"}), 500

    data = request.json or {}
    try:
        file_risk = data.get('file_classification_probability', 0)
        if file_risk > 1.0:
            file_risk = file_risk / 100

        sharing_risk = data.get('sharing_anomaly_probability', 0)
        if sharing_risk > 1.0:
            sharing_risk = sharing_risk / 100

        ml_component = (file_risk * 0.6) + (sharing_risk * 0.4)

        access_pattern_risk = data.get('access_pattern_risk', 0)
        if access_pattern_risk > 1.0:
            access_pattern_risk = access_pattern_risk / 100

        device_risk = data.get('device_risk', 0)
        if device_risk > 1.0:
            device_risk = device_risk / 100

        composite = (ml_component * 0.4) + (device_risk * 0.3) + (access_pattern_risk * 0.3)
        risk_score = round(min(100, composite * 100), 2)

        if risk_score > 66:
            risk_level = "high"
        elif risk_score > 33:
            risk_level = "medium"
        else:
            risk_level = "low"

        return jsonify({
            "risk_score": risk_score,
            "risk_level": risk_level,
            "breakdown": {
                "ml": round(ml_component * 100, 2),
                "device": round(device_risk * 100, 2),
                "access_pattern": round(access_pattern_risk * 100, 2)
            },
            "recommendation": get_risk_recommendation(risk_level)
        })
    except Exception as e:
        logger.error(f"Access risk assessment error: {e}")
        return jsonify({"error": str(e)}), 400

     
def get_risk_recommendation(risk_level):
    recommendations = {
        "low": "Access granted normally",
        "medium": "Access granted with enhanced monitoring; consider additional verification",
        "high": "Access blocked; mandatory admin review required"
    }
    return recommendations.get(risk_level, "Access granted normally")


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "models_loaded": file_clf is not None and sharing_clf is not None,
        "timestamp": datetime.now().isoformat()
    })


if __name__ == '__main__':
    os.makedirs('data', exist_ok=True)
    app.run(host='0.0.0.0', port=5001, debug=True)