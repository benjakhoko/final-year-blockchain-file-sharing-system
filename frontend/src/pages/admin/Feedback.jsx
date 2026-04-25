import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import {
  ChatBubbleLeftRightIcon,
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AdminFeedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    type: ''
  });

  useEffect(() => {
    fetchFeedback();
  }, [filters]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await adminService.getFeedback(filters);
      setFeedback(response.feedback);
    } catch (error) {
      toast.error('Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (feedbackId) => {
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    try {
      await adminService.respondToFeedback(feedbackId, responseText);
      toast.success('Response sent successfully');
      setShowResponseModal(false);
      setResponseText('');
      fetchFeedback();
    } catch (error) {
      toast.error('Failed to send response');
    }
  };

  const handleDelete = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) {
      return;
    }

    try {
      await adminService.deleteFeedback(feedbackId);
      toast.success('Feedback deleted');
      fetchFeedback();
    } catch (error) {
      toast.error('Failed to delete feedback');
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      bug: 'bg-red-100 text-red-800',
      feature: 'bg-green-100 text-green-800',
      improvement: 'bg-blue-100 text-blue-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      'in-review': 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-purple-500 mr-3" />
            <h1 className="text-2xl font-semibold text-gray-900">User Feedback</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Filters */}
        <div className="mt-4 bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-review">In Review</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">All Types</option>
                <option value="bug">Bug</option>
                <option value="feature">Feature</option>
                <option value="improvement">Improvement</option>
                <option value="general">General</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: '', type: '' })}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Feedback List */}
        <div className="mt-8 space-y-4">
          {feedback.length > 0 ? (
            feedback.map((item) => (
              <div key={item._id} className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getTypeColor(item.type)}`}>
                        {item.type}
                      </span>
                      <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                      {item.rating && (
                        <span className="text-yellow-500">
                          {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedFeedback(item);
                            setShowResponseModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-100"
                          title="Respond"
                        >
                          <PaperAirplaneIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-100"
                        title="Delete"
                      >
                        <XCircleIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-lg font-medium text-gray-900">{item.subject}</h4>
                    <p className="mt-1 text-sm text-gray-600">{item.message}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        {item.user?.name}
                      </span>
                      <span className="flex items-center">
                        <EnvelopeIcon className="h-4 w-4 mr-1" />
                        {item.user?.email}
                      </span>
                    </div>
                    <span className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {item.adminResponse && (
                    <div className="mt-4 bg-gray-50 p-3 rounded-md">
                      <p className="text-sm font-medium text-gray-700">Admin Response:</p>
                      <p className="mt-1 text-sm text-gray-600">{item.adminResponse.message}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        Responded on {new Date(item.adminResponse.respondedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No feedback</h3>
              <p className="mt-1 text-sm text-gray-500">
                No feedback matches your filters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedFeedback && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Respond to Feedback</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-500">From: {selectedFeedback.user?.name} ({selectedFeedback.user?.email})</p>
              <p className="text-sm text-gray-500 mt-1">Subject: {selectedFeedback.subject}</p>
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">{selectedFeedback.message}</p>
              </div>
            </div>
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              rows="4"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Type your response here..."
            />
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowResponseModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRespond(selectedFeedback._id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Send Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;