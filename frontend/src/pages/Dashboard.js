import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import UserProfileModal from '../components/UserProfileModal';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { skillService, taskService, sessionService, dashboardService, activitiesService } from '../services/apiService';
import axios from 'axios';
import CalendarWidget from '../components/CalendarWidget';
import { 
  BookOpen, 
  CheckCircle, 
  Star, 
  Target, 
  PlusCircle, 
  Briefcase, 
  Bot, 
  TrendingUp,
  Users,
  Award,
  Clock,
  Sparkles,
  ArrowRight,
  Calendar,
  Zap,
  Shield,
  Code,
  Palette,
  Globe,
  Camera,
  Music,
  PenTool,
  Moon,
  Sun,
  Bell,
  Settings,
  Activity,
  BarChart3,
  PieChart,
  Gift,
  Rocket,
  Crown,
  Medal,
  Trophy,
  Flame,
  Coffee,
  Compass,
  Heart,
  Share2,
  MoreHorizontal,
  Coins,
  Loader2,
  User
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const { user, darkMode, toggleDarkMode } = useAuth();
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalTasks: 0,
    totalSkills: 0,
    averageRating: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [recommendedSkills, setRecommendedSkills] = useState([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeChart, setActiveChart] = useState('progress');
  const [tokenBalance, setTokenBalance] = useState(null);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  
  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    loadDashboardData();
    loadRecommendedSkills();
    loadRecentActivities();
    loadTokenBalance();
    // Hide welcome message after 5 seconds
    const timer = setTimeout(() => setShowWelcome(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const loadDashboardData = async () => {
    try{
      // Load user stats from NEW dashboard API
      const dashboardStats = await dashboardService.getStats();
      setStats({
        totalSessions: dashboardStats.total_sessions || 0,
        totalTasks: dashboardStats.tasks_completed || 0,
        totalSkills: dashboardStats.skills_listed || 0,
        averageRating: dashboardStats.average_rating || 0,
      });
      
      // Set token balance if available
      if (dashboardStats.tokens !== undefined) {
        setTokenBalance(dashboardStats.tokens);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  const loadRecommendedSkills = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get(`${BACKEND_URL}/api/users/recommended-skills`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecommendedSkills(response.data || []);
      }
    } catch (error) {
      console.error('Error loading recommended skills:', error);
      // Fallback to default skills
      setRecommendedSkills([
        { name: 'React Development', icon: Code, color: 'from-blue-500 to-cyan-400', students: 0 },
        { name: 'UI/UX Design', icon: Palette, color: 'from-purple-500 to-pink-400', students: 0 },
        { name: 'Digital Marketing', icon: Globe, color: 'from-green-500 to-emerald-400', students: 0 },
        { name: 'Photography', icon: Camera, color: 'from-orange-500 to-red-400', students: 0 },
      ]);
    }
  };

  const loadRecentActivities = async () => {
    try {
      // Use the correct activities endpoint
      const activities = await activitiesService.getRecent(20);
      
      // Format activities with time ago
      const formattedActivities = (activities || []).map(activity => ({
        ...activity,
        timeAgo: getTimeAgo(activity.time)
      }));
      
      setRecentActivities(formattedActivities);
    } catch (error) {
      console.error('Error loading recent activities:', error);
      setRecentActivities([]);
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return `${Math.floor(seconds / 604800)} weeks ago`;
  };

  const loadTokenBalance = async () => {
    setLoadingTokens(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get(`${BACKEND_URL}/api/users/token-balance`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTokenBalance(response.data);
      }
    } catch (error) {
      console.error('Error loading token balance:', error);
    }
    setLoadingTokens(false);
  };

  const getGreetingEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅';
    if (hour < 18) return '☀️';
    return '🌙';
  };

  const getMotivationalQuote = () => {
    const quotes = [
      { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
      { text: "Learning is a treasure that will follow its owner everywhere.", author: "Chinese Proverb" },
      { text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", author: "Brian Herbert" },
      { text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.", author: "Malcolm X" },
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  // Get quote once - this is the ONLY declaration
  const motivationalQuote = getMotivationalQuote();

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Navbar />
          <div className="flex items-center justify-center h-[80vh]">
            <div className="relative">  
              {/* Animated Loading Spinner */}
              <div className="w-24 h-24 relative">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-900/30"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 dark:border-t-indigo-400 animate-spin"></div>
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-gray-800 dark:to-gray-700 animate-pulse"></div>
              </div>
              
              {/* Floating Particles */}
              <div className="absolute -top-10 -left-10 w-20 h-20 bg-indigo-200/30 dark:bg-indigo-500/10 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-purple-200/30 dark:bg-purple-500/10 rounded-full blur-xl animate-pulse animation-delay-1000"></div>
              
              <div className="mt-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 animate-pulse">Loading your dashboard...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen relative bg-user-gradient " data-testid="dashboard-page">
        {/* Overlay for better content visibility */}
        <div className="absolute inset-0 bg-white/40 dark:bg-gray-900/60 backdrop-blur-sm"></div>
        
        <div className="relative z-10">
          <Navbar />
        </div>
        
        {/* Subtle Animated Accents */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-gradient-to-br from-amber-100 via-pink-100 to-purple-100">
          <div className="absolute top-20 right-20 w-72 h-72 bg-indigo-400/10 dark:bg-indigo-400/5 rounded-full mix-blend-multiply filter blur-3xl animate-float-smooth"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-400/10 dark:bg-purple-400/5 rounded-full mix-blend-multiply filter blur-3xl animate-float-smooth" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ">
          {/* Welcome Section with Enhanced Glass Effect */}
          <div className="relative mb-10 group animate-scale-in" data-testid="welcome-section">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-1 shadow-premium-lg">
              <div className="relative glass-card rounded-[22px] p-8 md:p-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-700/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative flex items-center justify-between flex-wrap gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-6 mb-6">
                      <div className="relative group">
                        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center text-5xl shadow-premium transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                          {getGreetingEmoji()}
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-gray-800 animate-pulse shadow-lg"></div>
                      </div>
                      <div>
                        <div className="flex items-center gap-4 mb-2">
                          <Sparkles className="w-8 h-8 text-yellow-300 animate-pulse" />
                          <h1 className="text-5xl font-black text-white tracking-tight">
                            {greeting}, {user?.full_name || user?.username}!
                          </h1>
                        </div>
                        <p className="text-xl text-[#333333] font-medium">
                          Ready to level up your skills today? ✨
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-6">
                      <div className="px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-full text-black text-sm font-semibold flex items-center gap-2 shadow-lg hover:scale-105 transition-transform duration-300">
                        <Calendar className="w-5 h-5" />
                        Member since {new Date(user?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </div>
                      <div className="px-5 py-2.5 bg-yellow-400/30 backdrop-blur-md rounded-full text-yellow-600 text-sm font-semibold flex items-center gap-2 shadow-lg hover:scale-105 transition-transform duration-300">
                        <Flame className="w-5 h-5" />
                        {stats.totalSessions} day streak
                      </div>
                      <div className="px-5 py-2.5 bg-purple-400/30 backdrop-blur-md rounded-full text-purple-600 text-sm font-semibold flex items-center gap-2 shadow-lg hover:scale-105 transition-transform duration-300">
                        <Trophy className="w-5 h-5" />
                        {stats.averageRating > 0 ? `${stats.averageRating} ⭐ Rating` : 'New Member'}
                      </div>
                      <div className="px-5 py-2.5 bg-green-400/30 backdrop-blur-md rounded-full text-green-600 text-sm font-semibold flex items-center gap-2 shadow-lg hover:scale-105 transition-transform duration-300" data-testid="token-balance-badge">
                        <Coins className="w-5 h-5" />
                        {loadingTokens ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>Tokens: {tokenBalance?.balance || 0}</>
                        )}
                      </div>
                    </div>
                  </div>  
                  
                  {/* Motivational Quote Card with Enhanced Design */}
                  <div className="hidden lg:block relative group max-w-xs">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-orange-700 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                    <div className="relative glass-card rounded-3xl p-8 border-2 border-white/30 shadow-premium transform transition-all duration-500 hover:scale-105">
                      <Coffee className="w-10 h-10 text-yellow-400 mb-4 animate-float-smooth" />
                      <p className="text-black text-base italic font-medium leading-relaxed mb-4">
                        "{motivationalQuote.text}"
                      </p>
                      <p className="text-black text-sm font-semibold">
                        — {motivationalQuote.author}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Grid with Premium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
            {[
              { icon: BookOpen, label: 'Total Sessions', value: stats.totalSessions, color: 'blue', trend: '+12%', iconBg: 'from-blue-500 to-cyan-400', borderColor: 'border-blue-200/50 dark:border-blue-800/50' },
              { icon: CheckCircle, label: 'Tasks Completed', value: stats.totalTasks, color: 'green', trend: '+5%', iconBg: 'from-green-500 to-emerald-400', borderColor: 'border-green-200/50 dark:border-green-800/50' },
              { icon: Star, label: 'Average Rating', value: stats.averageRating.toFixed(1), suffix: ' ⭐', color: 'yellow', trend: '+0.2', iconBg: 'from-yellow-500 to-orange-400', borderColor: 'border-yellow-200/50 dark:border-yellow-800/50' },
              { icon: Target, label: 'Skills Listed', value: stats.totalSkills, color: 'purple', trend: '+3', iconBg: 'from-purple-500 to-pink-400', borderColor: 'border-purple-200/50 dark:border-purple-800/50' },
              { 
                icon: Coins, 
                label: 'Skill Tokens', 
                value: loadingTokens ? '...' : (tokenBalance?.balance || 0), 
                color: 'indigo', 
                trend: '+' + (tokenBalance?.total_earned || 0), 
                iconBg: 'from-indigo-500 to-purple-400',
                borderColor: 'border-indigo-200/50 dark:border-indigo-800/50'
              },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="group relative animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Premium Card with Modern Design */}
                  <div className={`relative glass-card  rounded-3xl p-7 bg-gradient-to-br from-red-200 via-pink-200 to-blue-200 hover:shadow-premium-lg transition-all duration-500 transform hover:-translate-y-3 hover:scale-105 border-2 ${stat.borderColor} overflow-hidden`}>
                    {/* Gradient Overlay on Hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.iconBg} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-5">
                        <div
                          className={`p-4 bg-gradient-to-br ${stat.iconBg} rounded-2xl text-white shadow-lg 
                          transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}
                        >
                          <Icon className="w-7 h-7" />
                        </div>
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                          {stat.trend}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold mb-2 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                        {stat.label}
                      </p>
                      <p className="text-4xl font-black text-gray-900 dark:text-white mb-4 group-hover:scale-110 transform transition-transform origin-left">
                        {stat.value}{stat.suffix || ''}
                      </p>
                      
                      {/* Animated Progress Bar */}
                      <div className="h-2 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${stat.iconBg} rounded-full transition-all duration-1000 ease-out`}
                          style={{ width: `${Math.min(100, (stat.value / 100) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enhanced Quick Actions with Modern Design */}
          <div className="glass-card  rounded-3xl p-8 bg-gradient-to-br from-blue-200 via-emerald-200 to-lime-200 mb-10 border border-white/20 dark:border-gray-700/30" data-testid="quick-actions">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Quick Actions
                </h2>
                <p className="text-gray-600 dark:text-gray-400">Recommended for you today</p>
              </div>
              <div className="flex items-center gap-3 px-5 py-2.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-full border border-yellow-200 dark:border-yellow-800">
                <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400 animate-pulse" />
                <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">Hot Today</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { to: '/skills', icon: PlusCircle, title: 'Add Skills', desc: 'List your expertise', color: 'indigo', gradient: 'from-indigo-500 via-indigo-600 to-purple-600' },
                { to: '/tasks', icon: Briefcase, title: 'Browse Tasks', desc: 'Find earning opportunities', color: 'green', gradient: 'from-green-500 via-green-600 to-emerald-600' },
                { to: '/chatbot', icon: Bot, title: 'AI Assistant', desc: 'Get learning guidance', color: 'purple', gradient: 'from-purple-500 via-purple-600 to-pink-600' },
              ].map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={index}
                    to={action.to}
                    className="group relative overflow-hidden rounded-2xl p-8 glass-card hover:shadow-premium-lg transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 border-2 border-transparent hover:border-white/30"
                    data-testid={`action-${action.title.toLowerCase().replace(' ', '-')}`}
                  >
                    {/* Animated Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>
                    
                    <div className="relative z-10">
                      <div className="relative mb-6">
                        <div className={`w-16 h-16 bg-gradient-to-br ${action.gradient} rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 shadow-lg`}>
                          <Icon className={`w-8 h-8 text-white`} />
                        </div>
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full border-3 border-white dark:border-gray-800 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      
                      <h3 className={`font-black text-gray-900 dark:text-white mb-2 text-2xl group-hover:text-white transition-colors`}>
                        {action.title}
                      </h3>
                      <p className={`text-base text-gray-600 dark:text-gray-400 group-hover:text-white/90 transition-colors font-medium`}>
                        {action.desc}
                      </p>
                      
                      {/* Animated Arrow */}
                      <div className="absolute bottom-8 right-8 transform translate-x-0 group-hover:translate-x-2 transition-transform duration-500">
                        <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-white" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Enhanced Activity and Recommendations Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-10">
            {/* Recent Activity with Modern Cards */}
            <div className="lg:col-span-2 glass-card rounded-3xl p-8 bg-gradient-to-br from-pink-200 via-rose-200 to-purple-200 border border-white/20 dark:border-gray-700/30">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    Recent Activity
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">Your latest interactions</p>
                </div>
                <button className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">
                  View all
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                {recentActivities.map((activity, index) => {
                  const Icon = activity.icon || Activity;
                  return (
                    <div
                      key={index}
                      className="group relative overflow-hidden p-6 glass-card rounded-2xl hover:shadow-lg transition-all duration-500 animate-scale-in border border-gray-100 dark:border-gray-700/50 hover:-translate-y-1"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <div className="relative flex items-center gap-5">
                        <div className={`p-4 bg-gradient-to-br ${activity.color === 'blue' ? 'from-blue-500 to-cyan-400' : activity.color === 'green' ? 'from-green-500 to-emerald-400' : activity.color === 'purple' ? 'from-purple-500 to-pink-400' : 'from-yellow-500 to-orange-400'} rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 shadow-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 dark:text-white text-lg mb-1">{activity.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{activity.timeAgo || activity.time}</p>
                        </div>
                        
                        <button className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="w-5 h-5 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Activity Chart Placeholder */}
              <div className="mt-8 p-6 glass-card rounded-2xl border border-gray-100 dark:border-gray-700/50">
              </div>
            </div>
            
            {/* Enhanced Right Sidebar */}
            <div className="space-y-8">
              {/* Premium Achievement Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-1 shadow-premium-lg group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
                
                <div className="relative glass-card rounded-[22px] p-8 text-white">
                  <div className="flex items-center justify-between mb-6">
                    <Crown className="w-10 h-10 text-yellow-300 animate-float-smooth" />
                    <span className="px-4 py-2 bg-white/25 backdrop-blur-md rounded-full text-sm font-bold">Level 5</span>
                  </div>
                  
                  <h3 className="text-2xl font-black mb-3">Skill Seeker</h3>
                  <p className="text-white/90 text-sm mb-6 font-medium">Complete 10 more sessions to reach next level</p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Progress to Level 6</span>
                      <span>65%</span>
                    </div>
                    <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                      <div className="h-full bg-gradient-to-r from-white to-yellow-300 rounded-full animate-progress shadow-lg" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex items-center gap-3 p-4 bg-white/15 backdrop-blur-md rounded-2xl">
                    <Medal className="w-6 h-6 text-yellow-300" />
                    <span className="text-sm font-semibold">3 achievements this month</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Recommended Skills */}
              <div className="glass-card rounded-3xl p-8 bg-gradient-to-br from-amber-200 via-pink-200 to-purple-200 border border-white/20 dark:border-gray-700/30">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                  <Sparkles className="w-7 h-7 text-yellow-500" />
                  Recommended Skills
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">Curated for you</p>
                
                <div className="space-y-4">
                  {recommendedSkills.slice(0, 4).map((skill, index) => {
                    const Icon = skill.icon;
                    return (
                      <div
                        key={index}
                        className="group flex items-center justify-between p-5 glass-card rounded-2xl hover:shadow-lg transition-all cursor-pointer border border-gray-100 dark:border-gray-700/50 hover:-translate-y-1 duration-300"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-3 bg-gradient-to-br ${skill.color} rounded-xl text-white transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 shadow-lg`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white text-base">{skill.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{skill.students} students</p>
                          </div>
                        </div>
                        <button className="p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all transform hover:scale-110">
                          <PlusCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                
                <button className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold rounded-2xl hover:shadow-premium-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2">
                  View all recommendations
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Calendar Widget */}
              {/* <CalendarWidget userId={user?.id} /> */}
            </div>
          </div>

          {/* Premium Bottom Banner */}
          <div className="relative overflow-hidden rounded-3xl p-1 bg-gradient-to-br from-yellow-200 via-orange-200 to-teal-200 group">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-500 animate-gradient"></div>
            <div className="relative bg-gradient-to-r from-yellow-500 via-orange-600 to-red-600 rounded-[22px] p-8 text-white">
              <div className="flex items-center justify-between flex-wrap gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/25 backdrop-blur-md rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                    <Gift className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black mb-2">🎉 Special Offer!</h3>
                    <p className="text-white/95 text-lg font-medium">Get 20% off on premium mentorship sessions this week</p>
                  </div>
                </div>
                <button className="px-8 py-4 bg-white text-orange-600 rounded-2xl font-black text-lg hover:shadow-2xl transform hover:scale-110 transition-all duration-300">
                  Claim Offer
                </button>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes blob {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }
          
          @keyframes float-slow {
            0%, 100% { transform: translate(0px, 0px) scale(1); }
            50% { transform: translate(20px, -20px) scale(1.05); }
          }
          
          @keyframes float-particle {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(20px, -20px); }
          }
          
          @keyframes slide-in-right {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes slide-in-up {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          .animate-blob {
            animation: blob 7s infinite;
          }
          
          .animate-float-slow {
            animation: float-slow 8s ease-in-out infinite;
          }
          
          .animate-float-particle {
            animation: float-particle 8s ease-in-out infinite;
          }
          
          .animate-slide-in-right {
            animation: slide-in-right 0.5s ease-out forwards;
          }
          
          .animate-slide-in-up {
            animation: slide-in-up 0.5s ease-out forwards;
            opacity: 0;
          }
          
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          
          .animation-delay-4000 {
            animation-delay: 4s;
          }
          
          .animation-delay-1000 {
            animation-delay: 1s;
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          .animate-gradient {
            background-size: 200% 200%;
            animation: gradient 3s ease infinite;
          }
          
          @keyframes progress {
            0% { width: 0%; }
          }
          
          .animate-progress {
            animation: progress 1s ease-out forwards;
          }
          
          @keyframes pulse-slow {
            0%, 100% { opacity: 0.75; }
            50% { opacity: 1; }
          }
          
          .animate-pulse-slow {
            animation: pulse-slow 3s ease-in-out infinite;
          }
          
          /* 3D Effects */
          .perspective-1000 {
            perspective: 1000px;
          }
          
          .preserve-3d {
            transform-style: preserve-3d;
          }
          
          .rotate-y-6 {
            transform: rotateY(6deg);
          }
          
          .transform-gpu {
            transform: translateZ(0);
          }
          
          .transform-z-[-10px] {
            transform: translateZ(-10px);
          }
          
          /* Dark mode transitions */
          .dark {
            color-scheme: dark;
          }
          
          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          
          ::-webkit-scrollbar-thumb {
            background: rgba(99, 102, 241, 0.3);
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(99, 102, 241, 0.5);
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
    </div>
  );
};

export default Dashboard;