import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const getErrorMessage = (error, fallback) => {
  const validationMessage = error.response?.data?.errors?.[0]?.msg;
  return error.response?.data?.message || validationMessage || error.message || fallback;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Set axios default header
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/profile');
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('token');
      setToken(null);
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser(user);
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = getErrorMessage(error, 'Login failed');
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (name, email, password) => {
    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        name,
        email,
        password
      });
      
      toast.success('Registration successful! Please sign in.');
      return { success: true };
    } catch (error) {
      const message = getErrorMessage(error, 'Registration failed');
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await axios.get('http://localhost:5000/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setToken(null);
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('http://localhost:5000/api/auth/profile', profileData);
      setUser(response.data.user);
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      toast.error(getErrorMessage(error, 'Profile update failed'));
      return { success: false };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.post('http://localhost:5000/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      toast.success('Password changed successfully');
      return { success: true };
    } catch (error) {
      toast.error(getErrorMessage(error, 'Password change failed'));
      return { success: false };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
