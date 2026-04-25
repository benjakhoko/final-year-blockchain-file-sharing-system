import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { Web3Provider } from './context/Web3Context';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Navbar from './components/Layout/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Files from './pages/Files';
import Feedback from './pages/Feedback';

// Admin imports
import AdminLayout from './components/Admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminFiles from './pages/admin/Files';
import AdminTamperedFiles from './pages/admin/TamperedFiles';
import AdminLogs from './pages/admin/Logs';
import AdminFeedback from './pages/admin/Feedback';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Web3Provider>
          <Toaster position="top-right" />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected user routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <Dashboard />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/files"
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <Files />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/feedback"
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <Feedback />
                  </>
                </ProtectedRoute>
              }
            />
            
            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="files" element={<AdminFiles />} />
              <Route path="tampered" element={<AdminTamperedFiles />} />
              <Route path="logs" element={<AdminLogs />} />
              <Route path="feedback" element={<AdminFeedback />} />
            </Route>
            
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Web3Provider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;