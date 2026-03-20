import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Search, User, Star, Send, Check, Clock, Users as UsersIcon } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const BrowseUsersModal = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sendingRequest, setSendingRequest] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen, searchQuery]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/users/browse?search=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
    setLoading(false);
  };

  const sendConnectionRequest = async (userId) => {
    setSendingRequest({ ...sendingRequest, [userId]: true });
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/users/connections/send-request/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state to show pending
      setUsers(users.map(u => 
        u.id === userId ? { ...u, connection_status: 'pending' } : u
      ));
      
      alert('Connection request sent!');
    } catch (error) {
      console.error('Error sending connection request:', error);
      alert(error.response?.data?.detail || 'Failed to send connection request');
    }
    setSendingRequest({ ...sendingRequest, [userId]: false });
  };

  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UsersIcon className="w-6 h-6 text-indigo-600" />
              Browse Users
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or username..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Users List */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No users found</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {users.map((user) => (
                <div key={user.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                      {user.profile_photo ? (
                        <img src={user.profile_photo} alt={user.username} className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        user.username?.charAt(0).toUpperCase()
                      )}
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {user.full_name || user.username}
                        </h3>
                        {user.average_rating > 0 && (
                          <span className="flex items-center gap-1 text-xs text-yellow-600">
                            <Star className="w-3 h-3 fill-current" />
                            {user.average_rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">@{user.username}</p>
                      
                      {user.bio && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{user.bio}</p>
                      )}
                      
                      {/* Skills */}
                      {user.top_skills && user.top_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {user.top_skills.map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs rounded-lg">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Connection Button */}
                      <div>
                        {user.connection_status === 'accepted' ? (
                          <button
                            disabled
                            className="w-full px-3 py-2 bg-green-100 text-green-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Connected
                          </button>
                        ) : user.connection_status === 'pending' ? (
                          <button
                            disabled
                            className="w-full px-3 py-2 bg-yellow-100 text-yellow-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <Clock className="w-4 h-4" />
                            Pending
                          </button>
                        ) : (
                          <button
                            onClick={() => sendConnectionRequest(user.id)}
                            disabled={sendingRequest[user.id]}
                            className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <Send className="w-4 h-4" />
                            {sendingRequest[user.id] ? 'Sending...' : 'Connect'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseUsersModal;
