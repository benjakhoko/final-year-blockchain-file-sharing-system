import React, { useState, useEffect } from 'react';
import aiService from '../services/aiService';
import {
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BellAlertIcon,
  ClockIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const AIAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchAlerts();
    fetchStats();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await aiService.getMyAlerts();
      setAlerts(response.alerts || []);
    } catch (error) {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await aiService.getAIStats();
      setStats(response.stats);
    } catch (error) {
      console.error('Failed to load stats');
    }
  };

  const getSeverityStyle = (severity) => {
    const styles = {
      low: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-800', icon: 'text-blue-500' },
      medium: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-800', icon: 'text-yellow-500' },
      high: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-800', icon: 'text-orange-500' },
      critical: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-800', icon: 'text-red-500' }
    };
    return styles[severity] || styles.low;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'malicious_file':
        return <ShieldExclamationIcon className="h-6 w-6" />;
      case 'abnormal_sharing':
        return <ExclamationTriangleIcon className="h-6 w-6" />;
      case 'risk_access':
        return <BellAlertIcon className="h-6 w-6" />;
      default:
        return <BellAlertIcon className="h-6 w-6" />;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'active') return alert.status === 'active';
    if (filter === 'resolved') return alert.status === 'resolved';
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BellAlertIcon className="h-8 w-8 text-blue-600 mr-3" />
              AI Security Alerts
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              AI-powered security alerts for your files and activities
            </p>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              {/* Stats Cards */}
              {stats && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-6">
                  <div className="bg-white rounded-lg shadow p-5">
                    <div className="flex items-center">
                      <BellAlertIcon className="h-8 w-8 text-blue-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Alerts</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalAlerts}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-5">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Active Alerts</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.activeAlerts}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-5">
                    <div className="flex items-center">
                      <ShieldExclamationIcon className="h-8 w-8 text-red-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Critical</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.bySeverity?.find(s => s._id === 'critical')?.count || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Filter Tabs */}
              <div className="border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'active', label: 'Active' },
                    { key: 'resolved', label: 'Resolved' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setFilter(tab.key)}
                      className={`pb-2 px-1 border-b-2 text-sm font-medium ${
                        filter === tab.key
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Alerts List */}
              {filteredAlerts.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <CheckCircleIcon className="mx-auto h-16 w-16 text-green-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">All Clear</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    No alerts matching your current filter
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAlerts.map((alert) => {
                    const style = getSeverityStyle(alert.severity);
                    return (
                      <div
                        key={alert._id}
                        className={`bg-white rounded-lg shadow border-l-4 ${style.border} overflow-hidden`}
                      >
                        <div className="p-5">
                          <div className="flex items-start">
                            <div className={`flex-shrink-0 p-2 rounded-full ${style.bg} ${style.icon}`}>
                              {getTypeIcon(alert.type)}
                            </div>
                            <div className="ml-4 flex-1">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">
                                  {alert.title}
                                </h3>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
                                    {alert.severity.toUpperCase()}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    alert.status === 'active'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {alert.status}
                                  </span>
                                </div>
                              </div>
                              <p className="mt-2 text-sm text-gray-600">{alert.message}</p>
                              
                              {alert.file && (
                                <p className="mt-2 text-sm text-gray-500">
                                  <span className="font-medium">File:</span> {alert.file.fileName}
                                </p>
                              )}

                              <div className="mt-3 flex items-center text-xs text-gray-400">
                                <ClockIcon className="h-4 w-4 mr-1" />
                                {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                              </div>

                              {alert.resolution && (
                                <div className="mt-3 p-3 bg-green-50 rounded-md border border-green-200">
                                  <p className="text-xs font-medium text-green-800">Resolution:</p>
                                  <p className="text-sm text-green-700 mt-1">{alert.resolution}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AIAlerts;