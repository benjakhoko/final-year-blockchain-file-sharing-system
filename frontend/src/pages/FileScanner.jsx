import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import aiService from '../services/aiService';
import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  CpuChipIcon,
  DocumentIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const FileScanner = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileAnalysis, setFileAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [mlHealth, setMlHealth] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    checkMLHealth();
    loadUserFiles();
  }, []);

  const checkMLHealth = async () => {
    try {
      const response = await aiService.checkHealth();
      setMlHealth(response.mlService);
    } catch (error) {
      setMlHealth({ status: 'unavailable' });
    }
  };

  const loadUserFiles = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/files', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const scanAllFiles = async () => {
    if (files.length === 0) {
      toast.error('No files to scan. Upload some files first.');
      return;
    }

    setScanning(true);
    try {
      const response = await aiService.analyzeAllFiles();
      setScanResults(response);
      toast.success(`Scanned ${response.summary.totalAnalyzed} files`);
    } catch (error) {
      toast.error('Failed to scan files');
      console.error(error);
    } finally {
      setScanning(false);
    }
  };

  const analyzeSingleFile = async (fileId) => {
    setAnalyzing(true);
    setSelectedFile(fileId);
    try {
      const response = await aiService.analyzeFile(fileId);
      setFileAnalysis(response);
      
      if (response.analysis.malicious) {
        toast.error(`⚠️ Suspicious file detected: ${response.analysis.recommendation}`);
      } else {
        toast.success('File appears safe');
      }
    } catch (error) {
      toast.error('Failed to analyze file');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getRiskBadge = (level) => {
    const styles = {
      safe: 'bg-green-100 text-green-800 border-green-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200'
    };
    return styles[level] || styles.safe;
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'safe':
      case 'low':
        return <ShieldCheckIcon className="h-5 w-5" />;
      case 'medium':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'high':
      case 'critical':
        return <ShieldExclamationIcon className="h-5 w-5" />;
      default:
        return <ShieldCheckIcon className="h-5 w-5" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredResults = scanResults?.results.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'threats') return r.malicious;
    if (filter === 'safe') return !r.malicious;
    return true;
  }) || [];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <CpuChipIcon className="h-8 w-8 text-blue-600 mr-3" />
                  AI File Scanner
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  Scan your files for potential security threats using machine learning
                </p>
              </div>
              
              {/* ML Service Status */}
              <div className={`flex items-center px-4 py-2 rounded-full ${
                mlHealth?.models_loaded 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`h-2 w-2 rounded-full mr-2 ${
                  mlHealth?.models_loaded ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium">
                  ML Service: {mlHealth?.models_loaded ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              {/* Scan All Button */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BeakerIcon className="h-10 w-10 text-blue-600 mr-4" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Full File Scan</h3>
                      <p className="text-sm text-gray-500">
                        Analyze all your files with AI to detect potential threats
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={scanAllFiles}
                    disabled={scanning}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {scanning ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                        Scan All Files
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Scan Results Summary */}
              {scanResults && (
                <>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-5">
                      <div className="flex items-center">
                        <DocumentIcon className="h-8 w-8 text-blue-500" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Total Analyzed</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {scanResults.summary.totalAnalyzed}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-5">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-8 w-8 text-green-500" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Safe Files</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {scanResults.summary.safe}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-5">
                      <div className="flex items-center">
                        <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Suspicious</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {scanResults.summary.suspicious}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-5">
                      <div className="flex items-center">
                        <ShieldExclamationIcon className="h-8 w-8 text-red-500" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Critical</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {scanResults.summary.critical}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="bg-white rounded-lg shadow mb-4">
                    <div className="border-b border-gray-200">
                      <nav className="-mb-px flex">
                        {[
                          { key: 'all', label: 'All Files', count: scanResults.results.length },
                          { key: 'threats', label: 'Threats', count: scanResults.summary.critical + scanResults.summary.suspicious },
                          { key: 'safe', label: 'Safe', count: scanResults.summary.safe }
                        ].map((tab) => (
                          <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`py-4 px-6 text-sm font-medium border-b-2 transition ${
                              filter === tab.key
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            {tab.label} ({tab.count})
                          </button>
                        ))}
                      </nav>
                    </div>
                  </div>
                </>
              )}

              {/* Scan Results List */}
              {scanResults && (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {filteredResults.map((result) => (
                      <li key={result.id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center min-w-0 flex-1">
                            <div className={`p-2 rounded-full mr-3 ${getRiskBadge(result.riskLevel)}`}>
                              {getRiskIcon(result.riskLevel)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {result.fileName}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                <span>{formatFileSize(result.fileSize)}</span>
                                <span>.{result.extension}</span>
                                <span>Entropy: {result.entropy}</span>
                                <span className={`font-medium ${
                                  result.malicious ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {(result.probability * 100).toFixed(1)}% malicious
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRiskBadge(result.riskLevel)}`}>
                              {result.riskLevel.toUpperCase()}
                            </span>
                            <button
                              onClick={() => analyzeSingleFile(result.id)}
                              disabled={analyzing && selectedFile === result.id}
                              className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
                              title="Re-analyze"
                            >
                              <ArrowPathIcon className={`h-5 w-5 ${analyzing && selectedFile === result.id ? 'animate-spin' : ''}`} />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Empty State */}
              {!scanResults && (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <CpuChipIcon className="mx-auto h-16 w-16 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    No scan results yet
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Click "Scan All Files" to analyze your files with AI
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Detailed Analysis Modal */}
      {fileAnalysis && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className={`p-6 ${
              fileAnalysis.analysis.malicious 
                ? 'bg-gradient-to-r from-red-500 to-red-600' 
                : 'bg-gradient-to-r from-green-500 to-green-600'
            } text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {fileAnalysis.analysis.malicious ? (
                    <ShieldExclamationIcon className="h-10 w-10 mr-3" />
                  ) : (
                    <ShieldCheckIcon className="h-10 w-10 mr-3" />
                  )}
                  <div>
                    <h3 className="text-xl font-bold">
                      {fileAnalysis.analysis.malicious ? '⚠️ Threat Detected' : '✓ File Safe'}
                    </h3>
                    <p className="text-sm opacity-90">{fileAnalysis.file.fileName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setFileAnalysis(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Risk Score */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Threat Probability</h4>
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${
                        fileAnalysis.analysis.malicious 
                          ? 'text-red-600 bg-red-200' 
                          : 'text-green-600 bg-green-200'
                      }`}>
                        {fileAnalysis.analysis.riskLevel}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-semibold inline-block ${
                        fileAnalysis.analysis.malicious ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {(fileAnalysis.analysis.probability * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-gray-200">
                    <div
                      style={{ width: `${fileAnalysis.analysis.probability * 100}%` }}
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
                        fileAnalysis.analysis.malicious ? 'bg-red-500' : 'bg-green-500'
                      }`}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className={`p-4 rounded-lg border-l-4 ${
                fileAnalysis.analysis.malicious 
                  ? 'bg-red-50 border-red-500' 
                  : 'bg-green-50 border-green-500'
              }`}>
                <p className={`text-sm font-medium ${
                  fileAnalysis.analysis.malicious ? 'text-red-800' : 'text-green-800'
                }`}>
                  {fileAnalysis.analysis.recommendation}
                </p>
              </div>

              {/* Feature Analysis */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Analysis Details</h4>
                <dl className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                  <div>
                    <dt className="text-xs text-gray-500">File Size</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {formatFileSize(fileAnalysis.file.fileSize)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Extension</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      .{fileAnalysis.analysis.features.extension}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Entropy (Shannon)</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {fileAnalysis.analysis.features.entropy}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Executable</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {fileAnalysis.analysis.features.is_executable ? 'Yes' : 'No'}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setFileAnalysis(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileScanner;