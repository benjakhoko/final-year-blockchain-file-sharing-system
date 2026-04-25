import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import FileUpload from '../components/Files/FileUpload';
import FileList from '../components/Files/FileList';
import SharedFileList from '../components/Files/SharedFileList';

const Files = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const location = useLocation();

  useEffect(() => {
    if (location.hash !== '#upload') return;

    const uploadSection = document.getElementById('upload-section');
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">My Files</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              <div className="space-y-6">
                <FileUpload onUploadSuccess={handleUploadSuccess} />
                <FileList refreshTrigger={refreshTrigger} />
                <SharedFileList refreshTrigger={refreshTrigger} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Files;
