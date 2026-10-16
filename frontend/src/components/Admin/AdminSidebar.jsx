import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ChartBarIcon,
  UsersIcon,
  DocumentIcon,
  ShieldExclamationIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: ChartBarIcon },
  { name: 'AI Security', href: '/admin/ai', icon: CpuChipIcon },  // ← ADD THIS
  { name: 'Users', href: '/admin/users', icon: UsersIcon },
  { name: 'Files', href: '/admin/files', icon: DocumentIcon },
  { name: 'Tampered Files', href: '/admin/tampered', icon: ShieldExclamationIcon },
  { name: 'Activity Logs', href: '/admin/logs', icon: ClipboardDocumentListIcon },
  { name: 'Feedback', href: '/admin/feedback', icon: ChatBubbleLeftRightIcon },
];

const AdminSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 bg-gray-800">
        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
          <span className="text-white text-lg font-bold">BlockShare Admin</span>
        </div>

        <div className="flex items-center px-4 py-3 bg-gray-700">
          <UserCircleIcon className="h-8 w-8 text-gray-300" />
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-gray-300">{user?.email}</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
                end={item.href === '/admin'}
              >
                <item.icon className="mr-3 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-300" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex-shrink-0 flex border-t border-gray-700 p-4">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <ArrowRightOnRectangleIcon className="mr-3 h-6 w-6 text-gray-400" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;