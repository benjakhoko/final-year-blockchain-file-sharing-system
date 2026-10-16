import React, { useState } from 'react';
import { useWeb3 } from '../../context/Web3Context';
import { ShieldCheckIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const FileVerification = ({ file }) => {
  const { account, verifyFileOnBlockchain, logAccess } = useWeb3();
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const handleVerify = async () => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    setVerifying(true);
    try {
      const result = await verifyFileOnBlockchain(file.blockchainFileId, file.fileHash);
      setVerificationResult(result);
      
      if (result) {
        if (result.exists !== false) {
          await logAccess(file.blockchainFileId, 'VERIFY');
        }
        
        if (result.exists === false) {
          toast.error(result.message || 'File not found on current blockchain contract');
        } else if (result.isValid) {
          toast.success('File integrity verified on blockchain!');
        } else {
          toast.error('File has been tampered with!');
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Failed to verify file');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Blockchain Verification
        </h3>
        
        {!account ? (
          <p className="mt-2 text-sm text-gray-500">
            Connect your wallet to verify file integrity on the blockchain
          </p>
        ) : (
          <>
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="h-5 w-5 mr-2" />
                  Verify on Blockchain
                </>
              )}
            </button>

            {verificationResult && (
              <div className="mt-4 border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Verification Result</h4>
                
                <div className="bg-gray-50 rounded-md p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Status</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      verificationResult.exists === false
                        ? 'bg-yellow-100 text-yellow-800'
                        : verificationResult.isValid
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {verificationResult.exists === false ? (
                        <>
                          <ShieldExclamationIcon className="h-3 w-3 mr-1" />
                          Not Found
                        </>
                      ) : verificationResult.isValid ? (
                        <>
                          <ShieldCheckIcon className="h-3 w-3 mr-1" />
                          Verified
                        </>
                      ) : (
                        <>
                          <ShieldExclamationIcon className="h-3 w-3 mr-1" />
                          Tampered
                        </>
                      )}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Blockchain Hash</p>
                    <p className="text-xs font-mono break-all">{verificationResult.blockchainHash}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Owner</p>
                    <p className="text-xs font-mono">{verificationResult.owner}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Timestamp</p>
                    <p className="text-xs">{verificationResult.timestamp}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FileVerification;
