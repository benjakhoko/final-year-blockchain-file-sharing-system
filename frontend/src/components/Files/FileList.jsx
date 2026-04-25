import React, { useCallback, useEffect, useState } from 'react';
import {
  DocumentIcon,
  TrashIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import fileService from '../../services/fileService';
import ShareModal from './ShareModal';
import toast from 'react-hot-toast';
import { useWeb3 } from '../../context/Web3Context';

const FileList = ({ refreshTrigger }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [verifying, setVerifying] = useState({});
  const [blockchainVerifying, setBlockchainVerifying] = useState({});
  const [blockchainStatus, setBlockchainStatus] = useState({});
  const { account, verifyFileOnBlockchain } = useWeb3();

  useEffect(() => {
    fetchFiles();
  }, [refreshTrigger]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fileService.getFiles();
      setFiles(response.files || []);
    } catch {
      toast.error('Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  const verifyOnBlockchain = useCallback(async (file, notifyOnError = true) => {
    if (!account || !file.blockchainFileId || !file.fileHash) return null;

    setBlockchainVerifying((prev) => ({ ...prev, [file.id]: true }));
    try {
      const result = await verifyFileOnBlockchain(
        file.blockchainFileId,
        file.fileHash,
        { notifyOnError }
      );

      const verified = !!result?.isValid;
      setBlockchainStatus((prev) => ({
        ...prev,
        [file.id]: {
          checked: !!result,
          verified,
          error: result ? null : 'Verification failed'
        }
      }));

      return result;
    } catch {
      setBlockchainStatus((prev) => ({
        ...prev,
        [file.id]: {
          checked: true,
          verified: false,
          error: 'Verification failed'
        }
      }));
      if (notifyOnError) {
        toast.error('Failed to verify on blockchain');
      }
      return null;
    } finally {
      setBlockchainVerifying((prev) => ({ ...prev, [file.id]: false }));
    }
  }, [account, verifyFileOnBlockchain]);

  const autoVerifyFilesOnBlockchain = useCallback(async () => {
    const blockchainFiles = files.filter((file) => file.blockchainFileId && file.fileHash);
    for (const file of blockchainFiles) {
      await verifyOnBlockchain(file, false);
    }
  }, [files, verifyOnBlockchain]);

  useEffect(() => {
    if (!account || files.length === 0) return;
    autoVerifyFilesOnBlockchain();
  }, [account, files, autoVerifyFilesOnBlockchain]);

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      await fileService.deleteFile(fileId);
      toast.success('File deleted successfully');
      fetchFiles();
    } catch {
      toast.error('Failed to delete file');
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
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
      toast.error('Failed to download file');
    }
  };

  // Consolidated verification function that handles both server-side and blockchain verification
  const verifyFile = async (file, showBlockchainToast = true) => {
    setVerifying((prev) => ({ ...prev, [file.id]: true }));
    
    try {
      // 1. Server-side integrity verification
      const serverResponse = await fileService.verifyFile(file.id);
      
      let serverVerified = false;
      if (serverResponse.isIntact) {
        toast.success(serverResponse.message || 'File integrity verified');
        serverVerified = true;
      } else {
        toast.error(serverResponse.message || 'File has been tampered with');
      }

      // 2. Blockchain verification (if applicable)
      let blockchainVerified = false;
      if (account && file.blockchainFileId && file.fileHash) {
        const blockchainResult = await verifyOnBlockchain(file, showBlockchainToast);
        if (blockchainResult?.isValid) {
          toast.success('Blockchain verification successful');
          blockchainVerified = true;
        } else if (blockchainResult) {
          toast.error('Blockchain verification mismatch');
        }
      }

      // Refresh file list to update status
      fetchFiles();
      
      return { serverVerified, blockchainVerified };
    } catch {
      toast.error('Failed to verify file');
      return { serverVerified: false, blockchainVerified: false };
    } finally {
      setVerifying((prev) => ({ ...prev, [file.id]: false }));
    }
  };

  // Standalone blockchain verification (for when you only want to check blockchain)
  const verifyBlockchainOnly = async (file) => {
    const result = await verifyOnBlockchain(file, true);
    if (!result) return;

    if (result.isValid) {
      toast.success('File matches blockchain record');
    } else {
      toast.error('File does not match blockchain record');
    }
  };

  const handleShare = (file) => {
    setSelectedFile(file);
    setShareModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">My Files</h3>
          <p className="mt-1 text-sm text-gray-500">
            Total files: {files.length}
          </p>
        </div>

        {files.length === 0 ? (
          <div className="text-center py-12">
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by uploading a file
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {files.map((file) => {
              const chainState = blockchainStatus[file.id];
              const chainChecked = !!chainState?.checked;
              const chainVerified = !!chainState?.verified;

              return (
                <li key={file.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0">
                      <DocumentIcon className="h-8 w-8 text-gray-400 mr-3" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            {file.fileName}
                          </p>
                          {/* Encryption Badge */}
                          {file.isEncrypted && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6-4h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2zm10-4V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              AES-256 Encrypted
                            </span>
                          )}
                          {/* Blockchain Badge */}
                          {file.blockchainFileId && (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                chainChecked
                                  ? (chainVerified ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800')
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              <ShieldCheckIcon className="h-3 w-3 mr-1" />
                              {chainChecked ? (chainVerified ? 'Blockchain Verified' : 'Blockchain Mismatch') : 'Blockchain'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          <span>{file.fileSize}</span>
                          <span className="flex items-center">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {new Date(file.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <ShieldCheckIcon className={`h-3 w-3 mr-1 ${
                              file.integrityVerified ? 'text-green-500' : 'text-yellow-500'
                            }`} />
                            {file.integrityVerified ? 'Verified' : 'Not Verified'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => verifyFile(file, true)}
                        disabled={verifying[file.id]}
                        className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-50"
                        title="Verify Integrity"
                      >
                        <ShieldCheckIcon className="h-5 w-5" />
                      </button>

                      {file.blockchainFileId && (
                        <button
                          onClick={() => verifyBlockchainOnly(file)}
                          disabled={blockchainVerifying[file.id]}
                          className={`p-2 disabled:opacity-50 ${
                            chainVerified ? 'text-blue-600' : 'text-gray-400 hover:text-purple-600'
                          }`}
                          title={chainVerified ? 'Blockchain verified' : 'Verify on Blockchain'}
                        >
                          {blockchainVerifying[file.id] ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          ) : (
                            <ShieldCheckIcon className="h-5 w-5" />
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => handleDownload(file.id, file.fileName)}
                        className="p-2 text-gray-400 hover:text-green-600"
                        title="Download"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleShare(file)}
                        className="p-2 text-gray-400 hover:text-purple-600"
                        title="Share"
                      >
                        <ShareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {file.blockchainFileId && (
                    <div className="mt-2 ml-11 text-xs text-gray-500">
                      <span className="font-medium">Blockchain ID:</span> {file.blockchainFileId}
                    </div>
                  )}

                  {file.sharedWith > 0 && (
                    <div className="mt-2 ml-11">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Shared with {file.sharedWith} user{file.sharedWith > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        file={selectedFile}
        onShareSuccess={fetchFiles}
      />
    </>
  );
};

export default FileList;