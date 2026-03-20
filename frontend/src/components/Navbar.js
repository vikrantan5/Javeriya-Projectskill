import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Code2,
  Briefcase,
  Calendar,
  Bot,
  Shield,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  Settings,
  Moon,
  Sun,
  Search,
  Home,
  GraduationCap,
  Sparkles,
  Zap,
  MessageSquare,
  Award,
   TrendingUp,
  ArrowLeftRight,
  Users,
  Map
} from 'lucide-react';
import BrowseUsersModal from './BrowseUsersModal';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(3);
    const [showBrowseUsers, setShowBrowseUsers] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'indigo' },
    { path: '/skills', label: 'Skills', icon: Code2, color: 'blue' },
    { path: '/tasks', label: 'Tasks', icon: Briefcase, color: 'green' },
     { path: '/exchange', label: 'Exchange', icon: ArrowLeftRight, color: 'teal' },
    { path: '/sessions', label: 'Sessions', icon: Calendar, color: 'purple' },
     { path: '/roadmap', label: 'Roadmap', icon: Map, color: 'orange' },
      { path: '/leaderboard', label: 'Leaderboard', icon: Award, color: 'yellow' },
       { path: '/wallet', label: 'Wallet', icon: TrendingUp, color: 'emerald' },
    { path: '/chatbot', label: 'AI Assistant', icon: Bot, color: 'pink', badge: 'New' },
  ];

  const quickActions = [
   
  ];

  return (
     <nav 
      className={`sticky top-0 z-50 transition-all duration-300 w-full overflow-x-hidden ${
        isScrolled 
          ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg' 
          : 'bg-white dark:bg-gray-900 shadow-md'
      }`} 
      data-testid="navbar"
    >
      <div className="w-full mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between h-16 items-center gap-2">
          {/* Logo Section */}
          <div className="flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
            <Link 
              to="/dashboard" 
              className="flex items-center gap-2 group" 
              data-testid="nav-logo"
            >
              <div className="relative">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <GraduationCap className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-2 h-2 lg:w-3 lg:h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
              </div>
              <span className="hidden sm:block text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
                TalentConnect
              </span>
            </Link>

                       {/* Desktop Navigation */}
           <div className="hidden lg:flex items-center gap-0.5 xl:gap-1 overflow-x-auto scrollbar-hide">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isItemActive = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative group px-2 xl:px-3 py-2 rounded-lg xl:rounded-xl transition-all duration-200 whitespace-nowrap ${
                      isItemActive
                        ? `bg-${item.color}-50 dark:bg-${item.color}-900/20 text-${item.color}-600 dark:text-${item.color}-400`
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        isItemActive ? `text-${item.color}-600` : ''
                      }`} />
                      <span className="font-medium text-xs xl:text-sm">{item.label}</span>
                      {item.badge && (
                        <span className={`px-1.5 py-0.5 bg-${item.color}-500 text-white text-xs rounded-full`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {isItemActive && (
                      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-${item.color}-600 rounded-full`}></div>
                    )}
                  </Link>
                );
              })}
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`relative group px-4 py-2 rounded-xl transition-all duration-200 ${
                    isActive('/admin')
                      ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  data-testid="nav-admin"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium text-sm">Admin</span>
                  </div>
                  {isActive('/admin') && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full"></div>
                  )}
                </Link>
              )}
            </div>
          </div>

                 {/* Right Section */}
          <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
            {/* Browse Users Button */}
            <button
              onClick={() => setShowBrowseUsers(true)}
              className="hidden md:flex items-center gap-1 lg:gap-2 px-2 lg:px-3 xl:px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
              data-testid="browse-users-button"
            >
              <Users className="w-4 h-4" />
              <span className="text-xs lg:text-sm font-medium hidden lg:inline">Browse Users</span>
              <span className="text-xs lg:text-sm font-medium lg:hidden">Browse</span>
            </button>
            {/* Quick Actions */}
            <div className="hidden md:flex items-center gap-1">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={index}
                    to={action.path}
                    className="relative p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Icon className="w-5 h-5" />
                    {action.badge && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {action.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Notifications */}
            {/* <button className="relative p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button> */}

            {/* Dark Mode Toggle */}
            {/* <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button> */}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors group"
                data-testid="nav-profile"
              >
                <div className="relative">
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:shadow-lg transition-all">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role || 'Student'}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 animate-slide-down">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.full_name || user?.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                  
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <User className="w-4 h-4" />
                    Your Profile
                  </Link>
                  

                      <button
                    onClick={() => {
                      setShowBrowseUsers(true);
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    Browse Users
                  </button>
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                  
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    data-testid="logout-button"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 animate-slide-down">
          <div className="px-4 py-3 space-y-1">
            {/* Mobile Navigation */}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isItemActive = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isItemActive
                      ? `bg-${item.color}-50 dark:bg-${item.color}-900/20 text-${item.color}-600 dark:text-${item.color}-400`
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium flex-1">{item.label}</span>
                  {item.badge && (
                    <span className={`px-2 py-0.5 bg-${item.color}-500 text-white text-xs rounded-full`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive('/admin')
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Shield className="w-5 h-5" />
                <span className="font-medium">Admin</span>
              </Link>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

            {/* Browse Users - Mobile */}
            <button
              onClick={() => {
                setShowBrowseUsers(true);
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 rounded-xl transition-colors"
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Browse Users</span>
            </button>

            {/* Mobile Quick Actions */}
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  to={action.path}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium flex-1">{action.label}</span>
                  {action.badge && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {action.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <Link
              to="/settings"
              className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </Link>

            <button
              onClick={() => {
                handleLogout();
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out forwards;
        }
      `}</style>

       
      {/* Browse Users Modal */}
      <BrowseUsersModal 
        isOpen={showBrowseUsers} 
        onClose={() => setShowBrowseUsers(false)} 
      />
    </nav>
  );
};

export default Navbar;