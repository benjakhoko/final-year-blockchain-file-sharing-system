import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import fileService from '../services/fileService';
import {
  DocumentArrowUpIcon,
  FolderIcon,
  ShareIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalFiles: 0,
    sharedWithMe: 0,
    recentUploads: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    const [statsResult, sharedResult, activityResult] = await Promise.allSettled([
      fileService.getUserStats(),
      fileService.getSharedFiles(),
      fileService.getUserActivityLogs(1, 5)
    ]);

    const backendStats = statsResult.status === 'fulfilled'
      ? (statsResult.value?.stats || {})
      : {};

    const sharedWithMe = sharedResult.status === 'fulfilled'
      ? (sharedResult.value?.count || 0)
      : 0;

    let activities = [];
    if (activityResult.status === 'fulfilled') {
      activities = activityResult.value?.logs || [];
    } else if (Array.isArray(backendStats.recentActivities)) {
      activities = backendStats.recentActivities;
    }

    const recentUploads = activities.filter((activity) => activity.action === 'UPLOAD_FILE').length;

    setDashboardStats({
      totalFiles: backendStats.totalFiles || 0,
      sharedWithMe,
      recentUploads
    });
    setRecentActivities(activities);
    setLoading(false);

    if (
      statsResult.status === 'rejected' &&
      sharedResult.status === 'rejected' &&
      activityResult.status === 'rejected'
    ) {
      toast.error('Failed to load dashboard data');
    }
  };

  const statCards = [
    { name: 'Total Files', value: dashboardStats.totalFiles, icon: FolderIcon, color: 'bg-blue-500' },
    { name: 'Shared With Me', value: dashboardStats.sharedWithMe, icon: ShareIcon, color: 'bg-green-500' },
    { name: 'Recent Uploads', value: dashboardStats.recentUploads, icon: ClockIcon, color: 'bg-purple-500' },
  ];

  const actionLabels = {
    LOGIN: 'Logged in',
    LOGOUT: 'Logged out',
    REGISTER: 'Registered account',
    UPLOAD_FILE: 'Uploaded a file',
    DOWNLOAD_FILE: 'Downloaded a file',
    DELETE_FILE: 'Deleted a file',
    SHARE_FILE: 'Shared a file',
    REVOKE_ACCESS: 'Revoked file access',
    VERIFY_INTEGRITY: 'Verified file integrity',
    UPDATE_PROFILE: 'Updated profile',
    CHANGE_PASSWORD: 'Changed password',
    TAMPER_DETECTED: 'Tampering detected'
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.name}!
            </h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="mt-8">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Link
                  to="/files#upload"
                  className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Upload new file
                  </span>
                </Link>
                <Link
                  to="/files"
                  className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    View my files
                  </span>
                </Link>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
              <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {loading ? (
                    <li className="px-6 py-4">
                      <p className="text-sm text-gray-500">Loading activity...</p>
                    </li>
                  ) : recentActivities.length === 0 ? (
                    <li className="px-6 py-4">
                      <p className="text-sm text-gray-500">No recent activity</p>
                    </li>
                  ) : (
                    recentActivities.map((activity) => (
                      <li
                        key={activity._id || activity.id || `${activity.action}-${activity.createdAt}`}
                        className="px-6 py-4"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-900">
                            {actionLabels[activity.action] || activity.action}
                          </p>
                          <p className="text-xs text-gray-500">
                            {activity.createdAt ? new Date(activity.createdAt).toLocaleString() : '-'}
                          </p>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
