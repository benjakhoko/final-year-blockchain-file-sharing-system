import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import {
  ShieldExclamationIcon,
  DocumentIcon,
  UserIcon,
  CalendarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const TamperedFiles = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTamperedFiles();
  }, []);

  const fetchTamperedFiles = async () => {
    try {
      setLoading(true);
      const response = await adminService.getTamperedFiles();
      setFiles(response?.files || []);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch tampered files';
      console.error('Failed to fetch tampered files:', error);
      setFiles([]);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center">
          <ShieldExclamationIcon className="h-8 w-8 text-red-500 mr-3" />
          <h1 className="text-2xl font-semibold text-gray-900">Tampered Files</h1>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Files that have been detected as tampered or modified
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {files.length === 0 ? (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <ShieldExclamationIcon className="mx-auto h-12 w-12 text-green-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No Tampered Files</h3>
            <p className="mt-1 text-sm text-gray-500">
              All files are currently secure and have valid integrity.
            </p>
          </div>
        ) : (
          <div className="mt-8">
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    <span className="font-bold">{files.length} file(s)</span> detected as tampered. These files have been modified and their integrity cannot be verified.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {files.map((file) => (
                  <li key={file._id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center min-w-0">
                        <DocumentIcon className="h-8 w-8 text-red-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-red-600 truncate">
                            {file.fileName}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                            <span className="flex items-center">
                              <UserIcon className="h-3 w-3 mr-1" />
                              {file.owner?.name || 'Unknown'}
                            </span>
                            <span>{formatFileSize(file.fileSize)}</span>
                            <span className="flex items-center">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {new Date(file.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Integrity Failed
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 ml-11">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">File Hash:</span> {file.fileHash}
                      </p>
                      {file.blockchainFileId && (
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">Blockchain ID:</span> {file.blockchainFileId}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TamperedFiles;
