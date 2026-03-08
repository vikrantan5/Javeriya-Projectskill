import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    phone: user?.phone || '',
  });

  const handleSave = () => {
    alert('Profile update feature coming soon!');
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50" data-testid="profile-page">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8" data-testid="profile-card">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center">
              <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-white text-4xl font-bold mr-6">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{user?.full_name || user?.username}</h2>
                <p className="text-gray-600">@{user?.username}</p>
                <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
              data-testid="edit-profile-button"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mb-6 p-6 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600">{user?.total_sessions || 0}</p>
              <p className="text-gray-600 text-sm">Sessions</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{user?.total_tasks_completed || 0}</p>
              <p className="text-gray-600 text-sm">Tasks Completed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">
                {user?.average_rating?.toFixed(1) || '0.0'} ⭐
              </p>
              <p className="text-gray-600 text-sm">Rating</p>
            </div>
          </div>

          {/* Profile Info */}
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  data-testid="fullname-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows="3"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  data-testid="bio-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  value={profileData.location}
                  onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                  data-testid="location-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  data-testid="phone-input"
                />
              </div>
              <button
                onClick={handleSave}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                data-testid="save-profile-button"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Bio</p>
                <p className="text-gray-900">{user?.bio || 'No bio added yet'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="text-gray-900">{user?.location || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-gray-900">{user?.phone || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="text-gray-900">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Account Status */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Account Status</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                user?.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {user?.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Verification Status</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                user?.is_verified ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {user?.is_verified ? 'Verified' : 'Not Verified'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Role</span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-600">
                {user?.role || 'Student'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
