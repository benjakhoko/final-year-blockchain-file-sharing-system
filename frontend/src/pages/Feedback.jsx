import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  ChatBubbleLeftRightIcon, 
  StarIcon,
  PaperAirplaneIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

const Feedback = () => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'general',
    subject: '',
    message: '',
    rating: 0
  });
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    fetchUserFeedback();
  }, []);

  const fetchUserFeedback = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/feedback');
      setFeedback(response.data.feedback);
    } catch (error) {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('http://localhost:5000/api/feedback', formData);
      toast.success('Feedback submitted successfully!');
      setFormData({
        type: 'general',
        subject: '',
        message: '',
        rating: 0
      });
      fetchUserFeedback();
    } catch (error) {
      toast.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      'in-review': 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  const feedbackTypes = [
    { value: 'bug', label: 'Bug Report', icon: '🐛' },
    { value: 'feature', label: 'Feature Request', icon: '✨' },
    { value: 'improvement', label: 'Improvement', icon: '📈' },
    { value: 'general', label: 'General Feedback', icon: '💬' }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Feedback & Suggestions</h1>
            <p className="mt-2 text-sm text-gray-600">
              Help us improve the platform by sharing your thoughts
            </p>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Submit Feedback Form */}
                <div className="lg:col-span-1">
                  <div className="bg-white shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Feedback</h3>
                      
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Feedback Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Feedback Type
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {feedbackTypes.map((type) => (
                              <button
                                key={type.value}
                                type="button"
                                onClick={() => setFormData({...formData, type: type.value})}
                                className={`flex items-center justify-center px-3 py-2 border rounded-md text-sm ${
                                  formData.type === type.value
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <span className="mr-1">{type.icon}</span>
                                {type.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Rating */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rating (Optional)
                          </label>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setFormData({...formData, rating: star})}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="focus:outline-none"
                              >
                                {star <= (hoverRating || formData.rating) ? (
                                  <StarIconSolid className="h-6 w-6 text-yellow-400" />
                                ) : (
                                  <StarIcon className="h-6 w-6 text-gray-300" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Subject */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Subject
                          </label>
                          <input
                            type="text"
                            value={formData.subject}
                            onChange={(e) => setFormData({...formData, subject: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Brief summary of your feedback"
                            required
                          />
                        </div>

                        {/* Message */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Message
                          </label>
                          <textarea
                            rows="4"
                            value={formData.message}
                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Please provide detailed feedback..."
                            required
                          />
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {submitting ? (
                            'Submitting...'
                          ) : (
                            <>
                              <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                              Submit Feedback
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>

                {/* Previous Feedback */}
                <div className="lg:col-span-2">
                  <div className="bg-white shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Your Previous Feedback</h3>
                      
                      {loading ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : feedback.length === 0 ? (
                        <div className="text-center py-8">
                          <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No feedback yet</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            You haven't submitted any feedback. Share your thoughts above!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {feedback.map((item) => (
                            <div key={item._id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {item.subject}
                                  </span>
                                  {getStatusBadge(item.status)}
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                  <ClockIcon className="h-4 w-4 mr-1" />
                                  {new Date(item.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-2">{item.message}</p>
                              
                              {item.rating > 0 && (
                                <div className="flex items-center mb-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    star <= item.rating ? (
                                      <StarIconSolid key={star} className="h-4 w-4 text-yellow-400" />
                                    ) : (
                                      <StarIcon key={star} className="h-4 w-4 text-gray-300" />
                                    )
                                  ))}
                                </div>
                              )}
                              
                              {item.adminResponse && (
                                <div className="mt-2 bg-gray-50 p-3 rounded-md">
                                  <p className="text-xs font-medium text-gray-500">Admin Response:</p>
                                  <p className="text-sm text-gray-700 mt-1">{item.adminResponse.message}</p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {new Date(item.adminResponse.respondedAt).toLocaleString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Feedback;