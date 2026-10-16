import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen w-full bg-gray-100">
      <AdminSidebar />
      <div className="md:pl-64 flex w-full flex-col flex-1">
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;