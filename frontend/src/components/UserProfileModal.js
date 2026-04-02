import React, { useState, useEffect } from 'react';
import { X, Star, Award, TrendingUp, Clock, CheckCircle, Users, Briefcase, MessageSquare, Loader2 } from 'lucide-react';
import api from '../services/api';

const UserProfileModal = ({ userId, isOpen, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && userId) {
      loadProfile();
    }
  }, [isOpen, userId]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/users/${userId}/full-profile`);
      setProfile(response.data);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err.response?.data?.detail || 'Failed to load profile');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      data-testid="user-profile-modal"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-r bg-gradient-to-br from-yellow-200 via-orange-200 to-teal-200">
          <div className="absolute inset-0 bg-black/20"></div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition-colors z-10"
            data-testid="close-profile-modal"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto ">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 px-6">
              <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <X className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Error Loading Profile
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
            </div>
          ) : profile ? (
            <div className="p-6 mt-10">
              {/* Profile Header */}
              <div className="flex items-start gap-4 mb-6 -mt-20">
                {profile.profile_data?.profile_photo ? (
                  <img
                    src={profile.profile_data.profile_photo}
                    alt={profile.profile_data.full_name || profile.profile_data.username}
                    className="w-24 h-24 rounded-2xl border-4 border-white dark:border-gray-800 object-cover shadow-xl"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-yellow-200 via-orange-200 to-teal-200 rounded-2xl border-4 border-white dark:border-gray-800 flex items-center justify-center text-white font-bold text-3xl shadow-xl">
                    {(profile.profile_data?.full_name || profile.profile_data?.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 pt-8">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {profile.profile_data?.full_name || profile.profile_data?.username}
                    </h2>
                    {profile.profile_data?.is_verified && (
                      <CheckCircle className="w-6 h-6 text-blue-500" />
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">@{profile.profile_data?.username}</p>
                  {profile.profile_data?.location && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">📍 {profile.profile_data.location}</p>
                  )}
                </div>
              </div>

              {/* Bio */}
              {profile.profile_data?.bio && (
                <div className="mb-6">
                  <p className="text-gray-700 dark:text-gray-300">{profile.profile_data.bio}</p>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Rating</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.avg_rating?.toFixed(1) || '0.0'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">{profile.total_reviews} reviews</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tasks</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.tasks_completed || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">completed</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Success</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.success_rate || 0}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">rate</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">On-Time</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.on_time_percentage || 0}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">delivery</p>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="flex items-center gap-4 mb-6 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>{profile.connection_count || 0} connections</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Award className="w-4 h-4" />
                  <span>{profile.sessions_completed || 0} sessions</span>
                </div>
              </div>

              {/* Skills Section */}
              {profile.skills && profile.skills.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                          skill.is_verified
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {skill.skill_name}
                        {skill.is_verified && ' ✓'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Reviews */}
              {profile.recent_reviews && profile.recent_reviews.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                    Recent Reviews
                  </h3>
                  <div className="space-y-3">
                    {profile.recent_reviews.map((review, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            by {review.giver?.full_name || review.giver?.username || 'Anonymous'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          "{review.review}"
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
