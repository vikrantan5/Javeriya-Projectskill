import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { skillService, taskService, sessionService } from '../services/apiService';
import axios from 'axios';
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
  Loader2
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
    try {
      if (user) {
        setStats({
          totalSessions: user.total_sessions || 0,
          totalTasks: user.total_tasks_completed || 0,
          totalSkills: user.skills_offered?.length || 0,
          averageRating: user.average_rating || 0,
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  const loadRecommendedSkills = () => {
    setRecommendedSkills([
      { name: 'React Development', icon: Code, color: 'from-blue-500 to-cyan-400', bgColor: 'blue', students: 1234 },
      { name: 'UI/UX Design', icon: Palette, color: 'from-purple-500 to-pink-400', bgColor: 'purple', students: 987 },
      { name: 'Digital Marketing', icon: Globe, color: 'from-green-500 to-emerald-400', bgColor: 'green', students: 756 },
      { name: 'Photography', icon: Camera, color: 'from-orange-500 to-red-400', bgColor: 'orange', students: 543 },
      { name: 'Music Production', icon: Music, color: 'from-indigo-500 to-purple-400', bgColor: 'indigo', students: 321 },
      { name: 'Content Writing', icon: PenTool, color: 'from-pink-500 to-rose-400', bgColor: 'pink', students: 234 },
    ]);
  };

  const loadRecentActivities = () => {
    setRecentActivities([
      { type: 'session', title: 'Completed React Workshop', time: '2 hours ago', icon: BookOpen, color: 'blue' },
      { type: 'task', title: 'Finished UI Design Task', time: '5 hours ago', icon: Briefcase, color: 'green' },
      { type: 'rating', title: 'Received 5-star rating', time: '1 day ago', icon: Star, color: 'yellow' },
      { type: 'skill', title: 'Added Python to skills', time: '2 days ago', icon: Code, color: 'purple' },
    ]);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300" data-testid="dashboard-page">
        <Navbar />
        
        {/* Animated Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200 dark:bg-indigo-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200 dark:bg-purple-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-slow animation-delay-2000"></div>
          <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-pink-200 dark:bg-pink-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-slow animation-delay-4000"></div>
          
          {/* Floating Particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-indigo-400/20 dark:bg-indigo-400/10 rounded-full animate-float-particle"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 5}s`
              }}
            />
          ))}
        </div>

        {/* Welcome Toast */}
        {showWelcome && (
          <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-indigo-100 dark:border-gray-700 p-4 max-w-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white animate-bounce">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Welcome back! 👋</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    You have {stats.totalTasks} tasks completed this week. Keep up the great work!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section with Glass Effect */}
          <div className="relative mb-8 group" data-testid="welcome-section">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity animate-pulse-slow"></div>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-1">
              <div className="relative bg-white/10 dark:bg-gray-900/50 backdrop-blur-xl rounded-xl p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative flex items-center justify-between flex-wrap gap-6">
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center text-4xl shadow-xl animate-float">
                          {getGreetingEmoji()}
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
                          <h1 className="text-4xl font-bold text-white">
                            {greeting}, {user?.full_name || user?.username}!
                          </h1>
                        </div>
                        <p className="text-xl text-indigo-100">
                          Ready to level up your skills today?
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                      <div className="px-4 py-2 bg-white/20 backdrop-blur rounded-full text-white text-sm font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Member since {new Date(user?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </div>
                      <div className="px-4 py-2 bg-yellow-400/20 backdrop-blur rounded-full text-yellow-100 text-sm font-medium flex items-center gap-2">
                        <Flame className="w-4 h-4" />
                        {stats.totalSessions} day streak
                      </div>
                      <div className="px-4 py-2 bg-purple-400/20 backdrop-blur rounded-full text-purple-100 text-sm font-medium flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        {stats.averageRating > 0 ? `${stats.averageRating} ⭐ Rating` : 'New Member'}
                      </div>
                    </div>
                  </div>

                  {/* Motivational Quote Card - Use motivationalQuote here */}
                  <div className="hidden lg:block relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative bg-white/10 backdrop-blur-xl rounded-xl p-6 max-w-xs border border-white/20">
                      <Coffee className="w-8 h-8 text-yellow-300 mb-3" />
                      <p className="text-white/90 text-sm italic">"{motivationalQuote.text}"</p>
                      <p className="text-white/70 text-xs mt-2">— {motivationalQuote.author}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

                    {/* Stats Grid with 3D Effects */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8 perspective-1000">
            {[
              { icon: BookOpen, label: 'Total Sessions', value: stats.totalSessions, color: 'blue', trend: '+12%', iconBg: 'from-blue-500 to-cyan-400' },
              { icon: CheckCircle, label: 'Tasks Completed', value: stats.totalTasks, color: 'green', trend: '+5%', iconBg: 'from-green-500 to-emerald-400' },
              { icon: Star, label: 'Average Rating', value: stats.averageRating.toFixed(1), suffix: ' ⭐', color: 'yellow', trend: '+0.2', iconBg: 'from-yellow-500 to-orange-400' },
              { icon: Target, label: 'Skills Listed', value: stats.totalSkills, color: 'purple', trend: '+3', iconBg: 'from-purple-500 to-pink-400' },
              { 
                icon: Coins, 
                label: 'Skill Tokens', 
                value: loadingTokens ? '...' : (tokenBalance?.balance || 0), 
                color: 'indigo', 
                trend: '+' + (tokenBalance?.total_earned || 0), 
                iconBg: 'from-indigo-500 to-purple-400' 
              },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="group relative preserve-3d transform-gpu hover:rotate-y-6 transition-all duration-500 cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* 3D Card Front */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl transform translate-z-[-10px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-r ${stat.iconBg} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 bg-gradient-to-r ${stat.iconBg} rounded-xl text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 dark:bg-green-500/20 rounded-full">
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          <span className="text-xs font-medium text-green-500">{stat.trend}</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-1 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                        {stat.label}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transform transition-transform">
                        {stat.value}{stat.suffix || ''}
                      </p>
                      
                      {/* Progress Bar */}
                      <div className="mt-4 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${stat.iconBg} rounded-full transition-all duration-1000`}
                          style={{ width: `${Math.min(100, (stat.value / 100) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions with Neumorphism */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl mb-8 border border-gray-200 dark:border-gray-700" data-testid="quick-actions">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Quick Actions
              </h2>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Recommended for you</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { to: '/skills', icon: PlusCircle, title: 'Add Skills', desc: 'List your expertise', color: 'indigo', gradient: 'from-indigo-500 to-purple-500', icon: PlusCircle },
                { to: '/tasks', icon: Briefcase, title: 'Browse Tasks', desc: 'Find earning opportunities', color: 'green', gradient: 'from-green-500 to-emerald-500', icon: Briefcase },
                { to: '/chatbot', icon: Bot, title: 'AI Assistant', desc: 'Get learning guidance', color: 'purple', gradient: 'from-purple-500 to-pink-500', icon: Bot },
              ].map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={index}
                    to={action.to}
                    className="group relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-600 hover:border-transparent transition-all duration-500 hover:shadow-2xl"
                    data-testid={`action-${action.title.toLowerCase().replace(' ', '-')}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                    
                    <div className="relative z-10">
                      <div className="relative mb-4">
                        <div className={`w-14 h-14 bg-${action.color}-100 dark:bg-${action.color}-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className={`w-7 h-7 text-${action.color}-600 dark:text-${action.color}-400 group-hover:text-white transition-colors`} />
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
                      </div>
                      
                      <h3 className={`font-bold text-gray-900 dark:text-white mb-1 text-lg group-hover:text-white transition-colors`}>
                        {action.title}
                      </h3>
                      <p className={`text-sm text-gray-600 dark:text-gray-400 group-hover:text-white/90 transition-colors`}>
                        {action.desc}
                      </p>
                      
                      {/* Animated Arrow */}
                      <div className="absolute bottom-6 right-6 transform translate-x-0 group-hover:translate-x-1 transition-transform">
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Activity and Recommendations Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Recent Activity
                </h2>
                <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                  View all
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                {recentActivities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={index}
                      className="group relative overflow-hidden p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:shadow-lg transition-all duration-300 animate-slide-in-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="relative flex items-center gap-4">
                        <div className={`p-3 bg-${activity.color}-100 dark:bg-${activity.color}-900/30 rounded-xl group-hover:scale-110 transition-transform`}>
                          <Icon className={`w-5 h-5 text-${activity.color}-600 dark:text-${activity.color}-400`} />
                        </div>
                        
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{activity.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{activity.time}</p>
                        </div>
                        
                        <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                          <MoreHorizontal className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Activity Chart */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Weekly Progress</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveChart('progress')}
                      className={`p-2 rounded-lg transition-colors ${
                        activeChart === 'progress' 
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' 
                          : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActiveChart('distribution')}
                      className={`p-2 rounded-lg transition-colors ${
                        activeChart === 'distribution' 
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' 
                          : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <PieChart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="h-32 flex items-end gap-2">
                  {[40, 65, 45, 80, 55, 70, 90].map((height, i) => (
                    <div key={i} className="flex-1 group">
                      <div className="relative">
                        <div 
                          className="h-0 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg transition-all duration-1000 group-hover:from-indigo-600 group-hover:to-purple-600"
                          style={{ height: `${height}%` }}
                        >
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-600 dark:text-gray-400">
                            {height}%
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Achievement Card */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <Crown className="w-8 h-8 text-yellow-300" />
                    <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm">Level 5</span>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2">Skill Seeker</h3>
                  <p className="text-indigo-100 text-sm mb-4">Complete 10 more sessions to reach next level</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress to Level 6</span>
                      <span>65%</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full animate-progress" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-2">
                    <Medal className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm">3 achievements this month</span>
                  </div>
                </div>
              </div>

              {/* Recommended Skills */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  Recommended Skills
                </h3>
                
                <div className="space-y-3">
                  {recommendedSkills.slice(0, 4).map((skill, index) => {
                    const Icon = skill.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:shadow-md transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 bg-gradient-to-r ${skill.color} rounded-lg text-white`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{skill.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{skill.students} students</p>
                          </div>
                        </div>
                        <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                          <PlusCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                
                <button className="w-full mt-4 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline flex items-center justify-center gap-1">
                  View all recommendations
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Upcoming Events */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Upcoming Events
                </h3>
                
                <div className="space-y-3">
                  {[
                    { title: 'Web Dev Workshop', time: 'Today, 3:00 PM', attendees: 24, color: 'blue' },
                    { title: 'UI/UX Design Session', time: 'Tomorrow, 11:00 AM', attendees: 18, color: 'purple' },
                    { title: 'Python Masterclass', time: 'Wed, 2:00 PM', attendees: 32, color: 'green' },
                  ].map((event, index) => (
                    <div
                      key={index}
                      className="group p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">{event.title}</h4>
                        <span className={`px-2 py-1 bg-${event.color}-100 dark:bg-${event.color}-900/30 text-${event.color}-600 dark:text-${event.color}-400 text-xs rounded-full`}>
                          {event.attendees} spots
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{event.time}</span>
                        <button className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs font-medium">
                          Join
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 p-1 group">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="relative bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">🎉 Special Offer!</h3>
                    <p className="text-yellow-100">Get 20% off on premium mentorship sessions this week</p>
                  </div>
                </div>
                <button className="px-6 py-3 bg-white text-orange-600 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all">
                  Claim Offer
                </button>
              </div>
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
    </div>
  );
};

export default Dashboard;