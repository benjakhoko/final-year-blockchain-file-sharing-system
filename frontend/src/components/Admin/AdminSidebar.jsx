import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  UsersIcon,
  DocumentIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: ChartBarIcon },
  { name: 'Users', href: '/admin/users', icon: UsersIcon },
  { name: 'Files', href: '/admin/files', icon: DocumentIcon },
  { name: 'Tampered Files', href: '/admin/tampered', icon: ShieldExclamationIcon },
  { name: 'Activity Logs', href: '/admin/logs', icon: ClipboardDocumentListIcon },
  { name: 'Feedback', href: '/admin/feedback', icon: ChatBubbleLeftRightIcon },
];

const AdminSidebar = () => {
  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 bg-gray-800">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <span className="text-white text-lg font-bold">Admin Panel</span>
          </div>
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
                <item.icon
                  className="mr-3 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-gray-300"
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;