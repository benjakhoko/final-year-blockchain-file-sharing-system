import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import fileService from '../../services/fileService';
import toast from 'react-hot-toast';

const FileUpload = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 10MB
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const response = await fileService.uploadFile(selectedFile, (progressEvent) => {
        const total = progressEvent.total || selectedFile.size || 1;
        const progress = Math.round((progressEvent.loaded * 100) / total);
        setUploadProgress(progress);
      });

      toast.success('File uploaded successfully!');
      setSelectedFile(null);
      setUploadProgress(0);
      if (onUploadSuccess) {
        onUploadSuccess(response.file);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  return (
    <div id="upload-section" className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Upload File</h3>
        
        {!selectedFile ? (
          <div
            {...getRootProps()}
            className={`mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
              isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <div className="space-y-1 text-center">
              <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <input {...getInputProps()} />
                <p className="pl-1">
                  {isDragActive
                    ? 'Drop the file here'
                    : 'Drag and drop a file here, or click to select'}
                </p>
              </div>
              <p className="text-xs text-gray-500">Maximum file size: 10MB</p>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-md">
              <div className="flex items-center space-x-3">
                <DocumentArrowUpIcon className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={cancelUpload}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {uploading && (
              <div className="mt-4">
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                        Uploading
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-blue-600">
                        {uploadProgress}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                    <div
                      style={{ width: `${uploadProgress}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-300"
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelUpload}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
