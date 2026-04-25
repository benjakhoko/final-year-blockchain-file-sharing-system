import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import {
  ClipboardDocumentListIcon,
  UserIcon,
  ClockIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    from: '',
    to: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSystemLogs(page);
      setLogs(response.logs);
      setTotalPages(response.pages);
    } catch (error) {
      toast.error('Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    const colors = {
      LOGIN: 'bg-green-100 text-green-800',
      LOGOUT: 'bg-gray-100 text-gray-800',
      UPLOAD_FILE: 'bg-blue-100 text-blue-800',
      DOWNLOAD_FILE: 'bg-purple-100 text-purple-800',
      DELETE_FILE: 'bg-red-100 text-red-800',
      SHARE_FILE: 'bg-yellow-100 text-yellow-800',
      REVOKE_ACCESS: 'bg-orange-100 text-orange-800',
      VERIFY_INTEGRITY: 'bg-indigo-100 text-indigo-800',
      TAMPER_DETECTED: 'bg-red-100 text-red-800 font-bold'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const resetFilters = () => {
    setFilters({
      action: '',
      userId: '',
      from: '',
      to: ''
    });
  };

  const formatDetailValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return 'N/A';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
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
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ClipboardDocumentListIcon className="h-8 w-8 text-blue-500 mr-3" />
            <h1 className="text-2xl font-semibold text-gray-900">Activity Logs</h1>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </button>
            <button
              onClick={fetchLogs}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Filters */}
        {showFilters && (
          <div className="mt-4 bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Action</label>
                <select
                  value={filters.action}
                  onChange={(e) => setFilters({...filters, action: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">All Actions</option>
                  <option value="LOGIN">Login</option>
                  <option value="UPLOAD_FILE">Upload</option>
                  <option value="DOWNLOAD_FILE">Download</option>
                  <option value="DELETE_FILE">Delete</option>
                  <option value="SHARE_FILE">Share</option>
                  <option value="TAMPER_DETECTED">Tamper</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">From Date</label>
                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) => setFilters({...filters, from: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">To Date</label>
                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) => setFilters({...filters, to: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Logs List */}
        <div className="mt-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <li key={log._id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <span className="text-sm text-gray-900">
                          {log.user?.name || 'System'}
                        </span>
                        {log.user?.email && (
                          <span className="text-sm text-gray-500">
                            ({log.user.email})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-2 ml-2 space-y-1 text-xs text-gray-500">
                        {Object.entries(log.details).map(([key, value]) => (
                          <div key={key} className="flex gap-2">
                            <span className="font-medium text-gray-700">{key}:</span>
                            <span className={`${key.toLowerCase().includes('hash') ? 'font-mono break-all' : ''}`}>
                              {formatDetailValue(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-1 text-xs text-gray-400">
                      IP: {log.ipAddress || 'N/A'} | User Agent: {log.userAgent?.substring(0, 50)}...
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-6 py-8 text-center text-gray-500">
                  No logs found
                </li>
              )}
            </ul>
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
    </div>
  );
};

export default AdminLogs;
