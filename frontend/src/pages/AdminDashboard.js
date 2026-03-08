import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { adminService } from '../services/apiService';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [usersData, analyticsData] = await Promise.all([
         adminService.getAllUsers().catch(() => []),
        adminService.getAnalytics().catch(() => null),
      ]);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
    setLoading(false);
  };

  const handleBanUser = async (userId, username) => {
    const reason = prompt(`Enter reason to ban ${username}:`);
    if (reason) {
      try {
        await adminService.banUser(userId, reason);
        alert('User banned successfully');
        loadAdminData();
      } catch (error) {
        alert('Failed to ban user: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-dashboard-page">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Analytics */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm" data-testid="total-users-stat">
              <p className="text-gray-500 text-sm mb-1">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.total_users || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm" data-testid="total-sessions-stat">
              <p className="text-gray-500 text-sm mb-1">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.total_sessions || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm" data-testid="total-tasks-stat">
              <p className="text-gray-500 text-sm mb-1">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.total_tasks || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm" data-testid="revenue-stat">
              <p className="text-gray-500 text-sm mb-1">Revenue</p>
              <p className="text-3xl font-bold text-gray-900">₹{analytics.revenue || 0}</p>
            </div>
          </div>
        )}

        {/* User Management */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">User Management</h2>
          
          {users.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="users-table">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Role</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-gray-500">{user.full_name}</div>
                      </td>
                      <td className="py-3 px-4 text-sm">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-600">
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.is_banned ? 'bg-red-100 text-red-600' :
                          user.is_active ? 'bg-green-100 text-green-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {user.is_banned ? 'Banned' : user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {!user.is_banned && (
                          <button
                            onClick={() => handleBanUser(user.id, user.username)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                            data-testid="ban-user-button"
                          >
                            Ban User
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
