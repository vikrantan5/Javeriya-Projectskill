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
  Map,
  Wallet
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
  const isAdminPage = location.pathname.startsWith('/admin');

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, gradient: 'from-cyan-500 to-blue-600' },
    { path: '/skills', label: 'Skills', icon: Code2, gradient: 'from-blue-500 to-indigo-600' },
    { path: '/tasks', label: 'Tasks', icon: Briefcase, gradient: 'from-emerald-500 to-teal-600' },
    { path: '/exchange', label: 'Exchange', icon: ArrowLeftRight, gradient: 'from-teal-500 to-cyan-600' },
    { path: '/sessions', label: 'Sessions', icon: Calendar, gradient: 'from-purple-500 to-pink-600' },
    { path: '/roadmap', label: 'Roadmap', icon: Map, gradient: 'from-orange-500 to-red-600' },
    { path: '/leaderboard', label: 'Leaderboard', icon: Award, gradient: 'from-amber-500 to-yellow-600' },
    { path: '/wallet', label: 'Wallet', icon: Wallet, gradient: 'from-green-500 to-emerald-600' },
    { path: '/chatbot', label: 'AI Assistant', icon: Bot, gradient: 'from-pink-500 to-purple-600' },
  ];

  return (
    <nav 
      className={`sticky top-0 z-50 transition-all duration-500 w-full ${
        isScrolled 
          ? isAdminPage
            ? 'glass-card-admin shadow-neon-cyan'
            : 'bg-white/70 dark:bg-slate-900/80 backdrop-blur-2xl shadow-premium' 
          : isAdminPage
            ? 'glass-card-admin border-b border-cyan-500/20'
            : 'bg-white dark:bg-slate-900 shadow-md'
      }`} 
      data-testid="navbar"
    >
      {/* Premium Gradient Border */}
      <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-${isScrolled ? '100' : '0'} transition-opacity duration-500`}></div>
      
      <div className="w-full mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between h-16 items-center gap-2">
          {/* Logo Section with Premium Effects */}
          <div className="flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
            <Link 
              to="/dashboard" 
              className="flex items-center gap-2 group relative" 
              data-testid="nav-logo"
            >
              {/* Animated Glow Effect */}
              <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
              
              <div className="relative">
                <div className={`w-9 h-9 lg:w-11 lg:h-11 bg-gradient-to-br ${
                  isAdminPage 
                    ? 'from-cyan-500 via-purple-600 to-pink-600' 
                    : 'from-indigo-600 to-purple-600'
                } rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                  <GraduationCap className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                {/* Online Status Badge */}
                <div className="absolute -top-1 -right-1 w-3 h-3 lg:w-3.5 lg:h-3.5 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900 animate-pulse shadow-lg"></div>
              </div>
              
              <span className={`hidden sm:block text-lg lg:text-xl xl:text-2xl font-black bg-gradient-to-r ${
                isAdminPage 
                  ? 'from-cyan-400 via-purple-400 to-pink-400' 
                  : 'from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400'
              } bg-clip-text text-transparent whitespace-nowrap tracking-tight`}>
                TalentConnect
              </span>
            </Link>

            {/* Desktop Navigation - Premium Style */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-1.5 overflow-x-auto scrollbar-hide">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isItemActive = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative group px-2.5 xl:px-3 py-2 rounded-xl transition-all duration-300 whitespace-nowrap ${
                      isItemActive
                        ? isAdminPage
                          ? 'glass-card-admin border border-cyan-500/40 text-cyan-300 shadow-neon-cyan'
                          : 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-600 dark:text-indigo-400 shadow-md'
                        : isAdminPage
                          ? 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800/30'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                    data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                  >
                    {/* Hover Glow Effect */}
                    {isAdminPage && (
                      <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    )}
                    
                    <div className="relative flex items-center gap-1.5">
                      <Icon className={`w-4 h-4 transition-all duration-300 ${
                        isItemActive 
                          ? 'scale-110' 
                          : 'group-hover:scale-110 group-hover:rotate-12'
                      }`} />
                      <span className="font-bold text-xs xl:text-sm">{item.label}</span>
                    </div>
                    
                    {/* Active Indicator */}
                    {isItemActive && (
                      <>
                        <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${item.gradient} rounded-full`}></div>
                        {isAdminPage && <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-cyan-400 animate-pulse" />}
                      </>
                    )}
                  </Link>
                );
              })}
              
              {/* Admin Button */}
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`relative group px-3 py-2 rounded-xl transition-all duration-300 overflow-hidden ${
                    isActive('/admin')
                      ? 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white shadow-neon-cyan'
                      : 'glass-card-admin-hover text-slate-300'
                  }`}
                  data-testid="nav-admin"
                >
                  {isActive('/admin') && (
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 blur-xl opacity-50"></div>
                  )}
                  <div className="relative flex items-center gap-2">
                    <Shield className={`w-4 h-4 ${isActive('/admin') ? 'animate-pulse' : ''}`} />
                    <span className="font-bold text-sm hidden xl:inline">Admin</span>
                  </div>
                  {isActive('/admin') && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-pink-400 rounded-full"></div>
                  )}
                </Link>
              )}
            </div>
          </div>

          {/* Right Section - Premium Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            
            {/* Search Button (Desktop) */}
            {/* <button className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
              isAdminPage
                ? 'glass-card-admin-hover text-slate-300'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
            }`}>
              <Search className="w-4 h-4" />
              <span className="text-sm font-semibold hidden lg:inline">Search</span>
            </button> */}

            {/* Notifications with Glow */}
            <button className={`relative p-2.5 rounded-xl transition-all duration-300 group ${
              isAdminPage
                ? 'glass-card-admin-hover text-slate-300'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
            }`}>
              <Bell className="w-5 h-5 group-hover:animate-bounce-subtle" />
              {notifications > 0 && (
                <>
                  <span className={`absolute -top-1 -right-1 w-5 h-5 ${
                    isAdminPage ? 'bg-cyan-500' : 'bg-red-500'
                  } text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse shadow-lg`}>
                    {notifications}
                  </span>
                  {isAdminPage && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full animate-ping opacity-75"></div>
                  )}
                </>
              )}
            </button>

            {/* Profile Dropdown - Premium Style */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`flex items-center gap-3 p-2 rounded-xl transition-all duration-300 group ${
                  isAdminPage
                    ? 'glass-card-admin-hover'
                    : 'hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
                data-testid="nav-profile"
              >
                <div className="relative">
                  {/* Profile Avatar with Premium Effects */}
                  <div className={`w-9 h-9 bg-gradient-to-br ${
                    isAdminPage 
                      ? 'from-cyan-500 to-purple-600' 
                      : 'from-indigo-600 to-purple-600'
                  } rounded-xl flex items-center justify-center text-white font-black text-base shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110`}>
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  {/* Online Indicator */}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${
                    isAdminPage ? 'bg-cyan-400' : 'bg-emerald-500'
                  } rounded-full border-2 border-white dark:border-slate-900 shadow-lg`}></div>
                  {isAdminPage && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-cyan-400 rounded-full animate-ping opacity-75"></div>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 ${
                  isAdminPage ? 'text-slate-300' : 'text-gray-500'
                } transition-transform duration-300 hidden sm:block ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Enhanced Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className={`absolute top-full right-0 mt-3 w-72 ${
                  isAdminPage 
                    ? 'glass-card-admin border border-cyan-500/20' 
                    : 'bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl border border-gray-200 dark:border-slate-700'
                } rounded-2xl shadow-2xl py-3 z-[100] animate-fade-in-scale`}>
                  
                  {/* User Info Header */}
                  <div className={`px-5 py-4 border-b ${
                    isAdminPage ? 'border-slate-700/50' : 'border-gray-200 dark:border-slate-700'
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 bg-gradient-to-br ${
                        isAdminPage ? 'from-cyan-500 to-purple-600' : 'from-indigo-600 to-purple-600'
                      } rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg`}>
                        {user?.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-bold ${
                          isAdminPage ? 'text-white' : 'text-gray-900 dark:text-white'
                        }`}>
                          {user?.full_name || user?.username}
                        </p>
                        <p className={`text-xs ${
                          isAdminPage ? 'text-slate-400' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    {user?.role === 'admin' && (
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                        isAdminPage 
                          ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-300' 
                          : 'bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                      }`}>
                        <Shield className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">Admin Access</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Menu Items */}
                  <div className="py-2">
                    <Link
                      to="/profile"
                      className={`flex items-center gap-3 px-5 py-3 transition-all duration-200 ${
                        isAdminPage
                          ? 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800/50'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <User className="w-4 h-4" />
                      <span className="font-semibold text-sm">Your Profile</span>
                    </Link>
                    
                    {/* <button
                      onClick={() => {
                        setShowBrowseUsers(true);
                        setShowProfileMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-5 py-3 transition-all duration-200 ${
                        isAdminPage
                          ? 'text-slate-300 hover:text-purple-300 hover:bg-slate-800/50'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span className="font-semibold text-sm">Browse Users</span>
                    </button> */}

                    <Link
                      to="/settings"
                      className={`flex items-center gap-3 px-5 py-3 transition-all duration-200 ${
                        isAdminPage
                          ? 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800/50'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Settings className="w-4 h-4" />
                      <span className="font-semibold text-sm">Settings</span>
                    </Link>
                  </div>
                  
                  <div className={`border-t ${
                    isAdminPage ? 'border-slate-700/50' : 'border-gray-200 dark:border-slate-700'
                  } my-2`}></div>
                  
                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowProfileMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-5 py-3 transition-all duration-200 ${
                      isAdminPage
                        ? 'text-red-400 hover:bg-red-500/20'
                        : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    }`}
                    data-testid="logout-button"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-bold text-sm">Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`lg:hidden p-2.5 rounded-xl transition-all duration-300 ${
                isAdminPage
                  ? 'glass-card-admin-hover text-slate-300'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Premium Style */}
      {isMenuOpen && (
        <div className={`lg:hidden border-t ${
          isAdminPage
            ? 'glass-card-admin border-slate-700/50'
            : 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-gray-200 dark:border-slate-800'
        } animate-slide-down`}>
          <div className="px-4 py-4 space-y-2">
            {/* Mobile Navigation */}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isItemActive = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    isItemActive
                      ? isAdminPage
                        ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-300 shadow-neon-cyan'
                        : 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-600 dark:text-indigo-400'
                      : isAdminPage
                        ? 'text-slate-300 hover:bg-slate-800/50'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${item.gradient} ${
                    isItemActive ? 'shadow-lg' : 'opacity-70'
                  }`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold flex-1">{item.label}</span>
                  {isItemActive && <Sparkles className="w-4 h-4 animate-pulse" />}
                </Link>
              );
            })}

            {/* Admin Link - Mobile */}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive('/admin')
                    ? 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white shadow-neon-cyan'
                    : isAdminPage
                      ? 'text-slate-300 hover:bg-slate-800/50'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Shield className="w-5 h-5" />
                <span className="font-bold">Admin Dashboard</span>
              </Link>
            )}

            <div className={`border-t ${
              isAdminPage ? 'border-slate-700/50' : 'border-gray-200 dark:border-slate-700'
            } my-3`}></div>

            {/* Browse Users - Mobile */}
            <button
              onClick={() => {
                setShowBrowseUsers(true);
                setIsMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isAdminPage
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-neon-cyan'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="font-bold">Browse Users</span>
            </button>

            {/* Settings - Mobile */}
            <Link
              to="/settings"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isAdminPage
                  ? 'text-slate-300 hover:bg-slate-800/50'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Settings className="w-5 h-5" />
              <span className="font-bold">Settings</span>
            </Link>

            {/* Logout - Mobile */}
            <button
              onClick={() => {
                handleLogout();
                setIsMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isAdminPage
                  ? 'text-red-400 hover:bg-red-500/20 border border-red-500/30'
                  : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
              }`}
            >
              <LogOut className="w-5 h-5" />
              <span className="font-bold">Logout</span>
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
          animation: slide-down 0.3s ease-out forwards;
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
