import React, { useState, useEffect } from 'react';
import aiService from '../../services/aiService';
import {
  CpuChipIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  BellAlertIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const AdminAIDashboard = () => {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: 'active', severity: '', type: '' });
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolution, setResolution] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchAlerts();
  }, [filter]);

  const fetchStats = async () => {
    try {
      const response = await aiService.getAIStats();
      // Admin stats endpoint
      const adminStatsResponse = await fetch('http://localhost:5000/api/ai/admin/stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const adminData = await adminStatsResponse.json();
      setStats(adminData.stats);
    } catch (error) {
      console.error('Failed to load stats');
    }
  };

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await aiService.getAllAlerts(filter);
      setAlerts(response.alerts || []);
    } catch (error) {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!resolution.trim()) {
      toast.error('Please provide a resolution');
      return;
    }
    try {
      await aiService.resolveAlert(selectedAlert._id, resolution);
      toast.success('Alert resolved');
      setShowResolveModal(false);
      setResolution('');
      fetchAlerts();
      fetchStats();
    } catch (error) {
      toast.error('Failed to resolve alert');
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[severity] || colors.low;
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <CpuChipIcon className="h-7 w-7 text-purple-600 mr-2" />
              AI Security Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              AI-powered threat detection and monitoring
            </p>
          </div>
          <button
            onClick={() => { fetchStats(); fetchAlerts(); }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-6">
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center">
                <BellAlertIcon className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Active</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center">
                <ShieldExclamationIcon className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Critical</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.bySeverity?.find(s => s._id === 'critical')?.count || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select
              value={filter.status}
              onChange={(e) => setFilter({...filter, status: e.target.value})}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <select
              value={filter.severity}
              onChange={(e) => setFilter({...filter, severity: e.target.value})}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={filter.type}
              onChange={(e) => setFilter({...filter, type: e.target.value})}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Types</option>
              <option value="malicious_file">Malicious File</option>
              <option value="abnormal_sharing">Abnormal Sharing</option>
              <option value="risk_access">Risk Access</option>
            </select>
          </div>
        </div>

        {/* Alerts List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Alerts</h3>
            <p className="mt-2 text-sm text-gray-500">No alerts match your filters</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {alerts.map((alert) => (
                <li key={alert._id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">{alert.type.replace('_', ' ')}</span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-gray-900">{alert.title}</p>
                      <p className="text-sm text-gray-500">{alert.message}</p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-400">
                        <span>User: {alert.user?.name || 'Unknown'}</span>
                        {alert.file && <span>File: {alert.file.fileName}</span>}
                        <span>{formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                    {alert.status === 'active' && (
                      <button
                        onClick={() => {
                          setSelectedAlert(alert);
                          setShowResolveModal(true);
                        }}
                        className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      {showResolveModal && selectedAlert && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Resolve Alert</h3>
              <button
                onClick={() => setShowResolveModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">{selectedAlert.title}</p>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows="4"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Describe the resolution..."
            />
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowResolveModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Resolve Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAIDashboard;