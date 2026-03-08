import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { skillService, taskService, sessionService } from '../services/apiService';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalTasks: 0,
    totalSkills: 0,
    averageRating: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load user stats
      if (user) {
        setStats({
          totalSessions: user.total_sessions || 0,
          totalTasks: user.total_tasks_completed || 0,
          totalSkills: 0,
          averageRating: user.average_rating || 0,
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
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
    <div className="min-h-screen bg-gray-50" data-testid="dashboard-page">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white mb-8" data-testid="welcome-section">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.full_name || user?.username}!
          </h1>
          <p className="text-indigo-100">
            Ready to learn something new today?
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm" data-testid="stat-sessions">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Total Sessions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalSessions}</p>
              </div>
              <div className="text-4xl">📚</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm" data-testid="stat-tasks">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Tasks Completed</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalTasks}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm" data-testid="stat-rating">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Average Rating</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.averageRating.toFixed(1)} ⭐
                </p>
              </div>
              <div className="text-4xl">🏆</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm" data-testid="stat-skills">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Skills Listed</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalSkills}</p>
              </div>
              <div className="text-4xl">🎯</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8" data-testid="quick-actions">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/skills"
              className="flex items-center p-4 border-2 border-indigo-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition"
              data-testid="action-add-skill"
            >
              <div className="text-3xl mr-4">🎯</div>
              <div>
                <h3 className="font-semibold text-gray-900">Add Skills</h3>
                <p className="text-sm text-gray-600">List your expertise</p>
              </div>
            </Link>

            <Link
              to="/tasks"
              className="flex items-center p-4 border-2 border-green-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition"
              data-testid="action-browse-tasks"
            >
              <div className="text-3xl mr-4">💼</div>
              <div>
                <h3 className="font-semibold text-gray-900">Browse Tasks</h3>
                <p className="text-sm text-gray-600">Find earning opportunities</p>
              </div>
            </Link>

            <Link
              to="/chatbot"
              className="flex items-center p-4 border-2 border-purple-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition"
              data-testid="action-ai-assistant"
            >
              <div className="text-3xl mr-4">🤖</div>
              <div>
                <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                <p className="text-sm text-gray-600">Get learning guidance</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Learning Resources */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-sm" data-testid="learning-tips">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Learning Tips</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                <span className="text-gray-700">Set clear learning goals for each session</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                <span className="text-gray-700">Exchange skills to maximize your learning</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                <span className="text-gray-700">Rate mentors after sessions to help the community</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-600 mr-2">•</span>
                <span className="text-gray-700">Use the AI assistant for personalized guidance</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm" data-testid="platform-stats">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Highlights</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                <span className="text-gray-700">AI-Powered Matching</span>
                <span className="text-indigo-600 font-semibold">✓ Active</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">Secure Payments</span>
                <span className="text-green-600 font-semibold">✓ Protected</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-gray-700">Skill Verification</span>
                <span className="text-purple-600 font-semibold">✓ Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
