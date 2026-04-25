import React, { useEffect, useState } from 'react';
import {
  DocumentIcon,
  ArrowDownTrayIcon,
  UserCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import fileService from '../../services/fileService';
import toast from 'react-hot-toast';

const SharedFileList = ({ refreshTrigger }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSharedFiles();
  }, [refreshTrigger]);

  const fetchSharedFiles = async () => {
    try {
      setLoading(true);
      const response = await fileService.getSharedFiles();
      setFiles(response.files || []);
    } catch {
      toast.error('Failed to fetch shared files');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file) => {
    try {
      const fileId = file.id || file._id;
      const fileName = file.fileName || file.originalName || 'shared-file';
      const response = await fileService.downloadFile(fileId);
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Download started');
    } catch {
      toast.error('Failed to download shared file');
    }
  };

  const formatFileSize = (sizeInBytes) => {
    if (typeof sizeInBytes === 'string') return sizeInBytes;
    const size = Number(sizeInBytes);
    if (!Number.isFinite(size) || size <= 0) return '0 Bytes';
    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const unitIndex = Math.floor(Math.log(size) / Math.log(1024));
    const converted = size / Math.pow(1024, unitIndex);
    return `${converted.toFixed(2)} ${units[unitIndex]}`;
  };

  if (loading) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Shared With Me</h3>
        </div>
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Shared With Me</h3>
        <p className="mt-1 text-sm text-gray-500">
          Files shared by other users: {files.length}
        </p>
      </div>

      {files.length === 0 ? (
        <div className="text-center py-12">
          <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No shared files</h3>
          <p className="mt-1 text-sm text-gray-500">
            Files shared with you will appear here
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {files.map((file) => (
            <li key={file._id || file.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0">
                  <DocumentIcon className="h-8 w-8 text-gray-400 mr-3" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-blue-600 truncate">
                      {file.fileName || file.originalName}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{formatFileSize(file.fileSize)}</span>
                      <span className="flex items-center">
                        <UserCircleIcon className="h-3 w-3 mr-1" />
                        {file.owner?.name || file.owner?.email || 'Unknown owner'}
                      </span>
                      <span className="flex items-center">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(file)}
                  className="p-2 text-gray-400 hover:text-green-600"
                  title="Download"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SharedFileList;
