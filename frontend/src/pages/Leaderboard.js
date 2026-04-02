import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import UserProfileModal from '../components/UserProfileModal';
import axios from 'axios';
import {
  Trophy,
  Medal,
  Crown,
  Star,
  TrendingUp,
  Users,
  Award,
  Target,
  Flame,
  Zap,
  BookOpen,
  CheckCircle,
  Shield,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Filter,
  User
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Leaderboard = () => {
  const [activeCategory, setActiveCategory] = useState('top_mentor');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  useEffect(() => {
    loadLeaderboard();
  }, [activeCategory]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/leaderboard/`, {
        params: { category: activeCategory, limit: 20 }
      });
      // Transform data to match frontend expectations
      const transformedData = response.data.leaderboard?.map(item => ({
        rank: item.rank,
        user_id: item.user_id || item.user?.id,
        username: item.user?.username || item.username,
        full_name: item.user?.full_name || item.full_name,
        profile_photo: item.user?.profile_photo || item.profile_photo,
        score: item.score,
        trust_score: item.user?.trust_score || 0,
        stats: {
          total_sessions: item.user?.total_sessions || 0,
          average_rating: item.user?.average_rating || 0
        }
      })) || [];
      
      setLeaderboard(transformedData);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load leaderboard');
      setLeaderboard([]);
    }
    setLoading(false);
  };

  const categories = [
    { id: 'top_mentor', label: 'Top Mentors', icon: Crown, color: 'from-yellow-500 to-orange-500', description: 'Most active and highest-rated mentors' },
    { id: 'top_learner', label: 'Top Learners', icon: Target, color: 'from-blue-500 to-cyan-500', description: 'Most dedicated learners' },
    { id: 'top_contributor', label: 'Top Contributors', icon: Sparkles, color: 'from-purple-500 to-pink-500', description: 'Overall platform engagement leaders' },
  ];

  const getRankBadge = (rank) => {
    if (rank === 1) return { icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
    if (rank === 2) return { icon: Medal, color: 'text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700' };
    if (rank === 3) return { icon: Medal, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' };
    return { icon: Award, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30' };
  };

  const getTrustBadge = (score) => {
    if (score >= 90) return { label: 'Gold Mentor', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: '🏆' };
    if (score >= 75) return { label: 'Silver Mentor', color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-700', icon: '🥈' };
    if (score >= 60) return { label: 'Bronze Mentor', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30', icon: '🥉' };
    return { label: 'Aspiring Mentor', color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30', icon: '⭐' };
  };

  const currentCategory = categories.find(c => c.id === activeCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-pink-100 to-purple-100 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950" data-testid="leaderboard-page">
      <Navbar />

      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200 dark:bg-indigo-500/20 rounded-full blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200 dark:bg-purple-500/20 rounded-full blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-yellow-500 animate-bounce" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Leaderboard
            </h1>
            <Trophy className="w-12 h-12 text-yellow-500 animate-bounce animation-delay-1000" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Celebrating our top performers and contributors
          </p>
        </div>

        {/* Category Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${
                  isActive
                    ? 'bg-white dark:bg-gray-800 shadow-xl scale-105 ring-2 ring-indigo-500'
                    : 'bg-white/80 dark:bg-gray-800/80 hover:shadow-lg hover:scale-102'
                }`}
                data-testid={`category-${category.id}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${category.color} opacity-${isActive ? '10' : '0'} transition-opacity`}></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${category.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {isActive && (
                      <CheckCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {category.label}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {category.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={loadLeaderboard}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Leaderboard Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading leaderboard...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-8 text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={loadLeaderboard}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-gradient-to-br from-pink-200 via-rose-200 to-purple-200 dark:bg-gray-800 rounded-2xl p-16 text-center">
            <Trophy className="w-24 h-24 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Data Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Leaderboard data will appear as users engage with the platform
            </p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            <div className="grid grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
              {[1, 0, 2].map((index) => {
                const entry = leaderboard[index];
                if (!entry) return null;
                
                const rankBadge = getRankBadge(entry.rank);
                const RankIcon = rankBadge.icon;
                const trustBadge = entry.trust_score ? getTrustBadge(entry.trust_score) : null;

                return (
                  <div
                    key={entry.rank}
                    className={`${index === 0 ? 'order-2' : index === 1 ? 'order-1' : 'order-3'} ${
                      index === 0 ? 'scale-110' : ''
                    }`}
                  >
                    <div className="bg-gradient-to-br from-pink-200 via-rose-200 to-purple-200 dark:bg-gray-800 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all">
                      {/* Rank Badge */}
                      <div className="flex justify-center mb-4">
                        <div className={`${rankBadge.bg} rounded-full p-4`}>
                          <RankIcon className={`w-8 h-8 ${rankBadge.color}`} />
                        </div>
                      </div>

                      {/* Avatar */}
                      <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-1">
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-red-200 via-rose-200 to-purple-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                              {entry.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* User Info */}
                      <h3 className="text-center font-bold text-gray-900 dark:text-white mb-1">
                        {entry.full_name || entry.username}
                      </h3>
                      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                        @{entry.username}
                      </p>

                      {/* Trust Badge */}
                      {trustBadge && (
                        <div className={`${trustBadge.bg} rounded-full px-3 py-1 text-center mb-3`}>
                          <span className={`text-xs font-medium ${trustBadge.color}`}>
                            {trustBadge.icon} {trustBadge.label}
                          </span>
                        </div>
                      )}

                      {/* Stats */}
                     <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Score</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            {entry.score || 0}
                          </span>
                        </div>
                        {entry.stats && (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Sessions</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {entry.stats.total_sessions || 0}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Rating</span>
                              <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                {entry.stats.average_rating?.toFixed(1) || '0.0'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                          {/* View Profile Button */}
                      <button
                        onClick={() => {
                          setSelectedUserId(entry.user_id || entry.id);
                          setShowProfileModal(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        data-testid="leaderboard-view-profile-button"
                      >
                        <User className="w-4 h-4" />
                        View Profile
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rest of Leaderboard */}
            <div className="bg-gradient-to-br from-pink-200 via-rose-200 to-purple-200 dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-red-600 to-yellow-600">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  Full Rankings
                </h2>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {leaderboard.slice(3).map((entry) => {
                  const trustBadge = entry.trust_score ? getTrustBadge(entry.trust_score) : null;

                  return (
                    <div
                      key={entry.rank}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      data-testid="leaderboard-entry"
                    >
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className="w-12 text-center">
                          <span className="text-2xl font-bold text-gray-400">
                            #{entry.rank}
                          </span>
                        </div>

                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5">
                          <div className="w-full h-full rounded-full bg-white dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                              {entry.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 dark:text-white">
                            {entry.full_name || entry.username}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{entry.username}
                          </p>
                        </div>

                        {/* Trust Badge */}
                        {trustBadge && (
                          <div className={`${trustBadge.bg} rounded-full px-3 py-1`}>
                            <span className={`text-xs font-medium ${trustBadge.color}`}>
                              {trustBadge.icon} {trustBadge.label}
                            </span>
                          </div>
                        )}

                        {/* Stats */}
                        <div className="hidden md:flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Score</p>
                            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                              {entry.score || 0}
                            </p>
                          </div>
                          {entry.stats && (
                            <>
                              <div className="text-center">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Sessions</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {entry.stats.total_sessions || 0}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                  {entry.stats.average_rating?.toFixed(1) || '0.0'}
                                </p>
                              </div>
                            </>
                          )}
                        </div>

                        {/* View Profile Button */}
                        <button
                          onClick={() => {
                            setSelectedUserId(entry.user_id || entry.id);
                            setShowProfileModal(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          data-testid="leaderboard-list-view-profile-button"
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
          {/* User Profile Modal */}
      {showProfileModal && selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
            isOpen={showProfileModal}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedUserId(null);
          }}
        />
      )}
    </div>
  );
};

export default Leaderboard;
