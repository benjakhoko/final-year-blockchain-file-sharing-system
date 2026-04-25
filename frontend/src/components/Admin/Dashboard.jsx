import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import {
  UsersIcon,
  DocumentIcon,
  ShieldExclamationIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSystemStats();
      setStats(response.stats);
      setRecentActivities(response.stats.recentActivities || []);
    } catch (error) {
      toast.error('Failed to fetch system stats');
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats ? [
    {
      name: 'Total Users',
      value: stats.users.total,
      icon: UsersIcon,
      color: 'bg-blue-500',
      change: `${stats.users.active} active`,
    },
    {
      name: 'Total Files',
      value: stats.files.total,
      icon: DocumentIcon,
      color: 'bg-green-500',
      change: `${stats.files.active} active`,
    },
    {
      name: 'Tampered Files',
      value: stats.files.tampered,
      icon: ShieldExclamationIcon,
      color: 'bg-red-500',
      change: 'needs attention',
    },
    {
      name: 'Total Downloads',
      value: stats.downloads,
      icon: ArrowDownTrayIcon,
      color: 'bg-purple-500',
      change: 'all time',
    },
  ] : [];

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
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Stats Grid */}
        <div className="mt-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((item) => (
              <div
                key={item.name}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 rounded-md p-3 ${item.color}`}>
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {item.name}
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {item.value}
                        </dd>
                        <dd className="text-sm text-gray-500">{item.change}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Stats */}
        <div className="mt-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                User Statistics
              </h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Total Users</dt>
                  <dd className="mt-1 text-sm text-gray-900">{stats.users.total}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Active Users</dt>
                  <dd className="mt-1 text-sm text-gray-900">{stats.users.active}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Inactive Users</dt>
                  <dd className="mt-1 text-sm text-gray-900">{stats.users.inactive}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Active Rate</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {Math.round((stats.users.active / stats.users.total) * 100)}%
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* File Stats */}
        <div className="mt-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                File Statistics
              </h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Total Files</dt>
                  <dd className="mt-1 text-sm text-gray-900">{stats.files.total}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Active Files</dt>
                  <dd className="mt-1 text-sm text-gray-900">{stats.files.active}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Tampered Files</dt>
                  <dd className="mt-1 text-sm text-gray-900">{stats.files.tampered}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Total Downloads</dt>
                  <dd className="mt-1 text-sm text-gray-900">{stats.downloads}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="mt-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Activities
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => (
                    <li key={index} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {activity.user?.name || 'System'}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {activity.action}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            {activity.details?.message || 'No details'}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                    No recent activities
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;