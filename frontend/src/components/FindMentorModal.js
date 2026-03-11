import React, { useState } from 'react';
import axios from 'axios';
import { X, Search, Loader2, Star, Trophy, Shield, MessageSquare, Calendar } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const FindMentorModal = ({ isOpen, onClose, skillName }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchMentors = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BACKEND_URL}/api/ai/match-mentors`,
        { skill_name: skillName, limit: 5 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMatches(response.data.matches || []);
    } catch (error) {
      console.error('Error finding mentors:', error);
      alert('Failed to find mentors');
    }
    setLoading(false);
  };

  const getTrustBadge = (score) => {
    if (!score || score < 60) return { label: 'Aspiring', color: 'indigo', icon: '⭐' };
    if (score >= 90) return { label: 'Gold', color: 'yellow', icon: '🏆' };
    if (score >= 75) return { label: 'Silver', color: 'gray', icon: '🥈' };
    return { label: 'Bronze', color: 'orange', icon: '🥉' };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Search className="w-6 h-6 text-indigo-600" />
            Find Mentor for {skillName}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {!searched ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <Search className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">AI-Powered Mentor Matching</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">We'll find the best mentors for {skillName} based on ratings, experience, and compatibility</p>
              <button
                onClick={searchMentors}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Find Mentors'}
              </button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">No mentors found for this skill</p>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match, index) => {
                const mentor = match.mentor || match;
                const trustBadge = getTrustBadge(mentor.trust_score);
                
                return (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:shadow-lg transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                        {mentor.username?.[0]?.toUpperCase()}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{mentor.full_name || mentor.username}</h3>
                          <span className={`px-2 py-1 bg-${trustBadge.color}-100 dark:bg-${trustBadge.color}-900/30 text-${trustBadge.color}-600 dark:text-${trustBadge.color}-400 text-xs rounded-full`}>
                            {trustBadge.icon} {trustBadge.label}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            {mentor.average_rating?.toFixed(1) || '0.0'} ({mentor.total_ratings || 0} reviews)
                          </span>
                          <span className="flex items-center gap-1">
                            <Trophy className="w-4 h-4 text-indigo-600" />
                            {mentor.total_sessions || 0} sessions
                          </span>
                          {mentor.trust_score && (
                            <span className="flex items-center gap-1">
                              <Shield className="w-4 h-4 text-green-600" />
                              Trust Score: {mentor.trust_score}
                            </span>
                          )}
                        </div>
                        
                        {mentor.bio && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">{mentor.bio}</p>
                        )}
                        
                        <div className="flex gap-2">
                          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Book Session
                          </button>
                          <button className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-sm font-medium flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Message
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindMentorModal;
