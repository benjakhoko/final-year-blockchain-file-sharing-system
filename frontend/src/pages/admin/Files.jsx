import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import {
  DocumentIcon,
  UserIcon,
  CalendarIcon,
  TrashIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AdminFiles = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, [page]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllFiles(page);
      setFiles(response.files);
      setTotalPages(response.pages);
    } catch (error) {
      toast.error('Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }

    try {
      await adminService.deleteFile(fileId);
      toast.success('File deleted successfully');
      fetchFiles();
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const viewFileDetails = (file) => {
    setSelectedFile(file);
    setShowDetails(true);
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
        <h1 className="text-2xl font-semibold text-gray-900">File Management</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        File Name
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Owner
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Size
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Uploaded
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {files.map((file) => (
                      <tr key={file._id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="flex items-center">
                            <DocumentIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <div className="font-medium text-gray-900">{file.fileName}</div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
                            {file.owner?.name || 'Unknown'}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatFileSize(file.fileSize)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            file.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : file.status === 'compromised'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {file.status === 'active' && 'Active'}
                            {file.status === 'compromised' && 'Tampered'}
                            {file.status === 'deleted' && 'Deleted'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                            {new Date(file.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => viewFileDetails(file)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-100"
                              title="View Details"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteFile(file._id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-100"
                              title="Delete"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{page}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* File Details Modal */}
      {showDetails && selectedFile && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">File Details</h3>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">File Name</dt>
                <dd className="text-sm text-gray-900">{selectedFile.fileName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Original Name</dt>
                <dd className="text-sm text-gray-900">{selectedFile.originalName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Owner</dt>
                <dd className="text-sm text-gray-900">{selectedFile.owner?.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Owner Email</dt>
                <dd className="text-sm text-gray-900">{selectedFile.owner?.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">File Hash</dt>
                <dd className="text-sm font-mono text-gray-900 break-all">{selectedFile.fileHash}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Blockchain ID</dt>
                <dd className="text-sm text-gray-900">{selectedFile.blockchainFileId || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Downloads</dt>
                <dd className="text-sm text-gray-900">{selectedFile.downloads}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Integrity</dt>
                <dd className="text-sm">
                  {selectedFile.integrityVerified ? (
                    <span className="text-green-600 flex items-center">
                      <ShieldCheckIcon className="h-4 w-4 mr-1" /> Verified
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center">
                      <ShieldExclamationIcon className="h-4 w-4 mr-1" /> Compromised
                    </span>
                  )}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFiles;