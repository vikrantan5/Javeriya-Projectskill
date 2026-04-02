import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { adminService } from '../services/apiService';
import {
  Users, CalendarCheck, Briefcase, IndianRupee, TrendingUp, TrendingDown,
  Shield, AlertTriangle, Search, Download, RefreshCw, UserCheck, UserX,
  Clock, BarChart3, Eye, Mail, Star, Bell, Settings, CreditCard, Flag,
  CheckCircle, XCircle, Wallet, Lock, Unlock, Ban, FileText, DollarSign,
  ArrowUpRight, ArrowDownRight, Circle, Zap, Sparkles, Activity, TrendingUpDown
} from 'lucide-react';

import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const AdminDashboard = () => {
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [reports, setReports] = useState([]);
  const [escrowPayments, setEscrowPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [reportFilter, setReportFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('week');
  const [activityData, setActivityData] = useState([]);

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'overview') {
      loadActivityData();
    }
  }, [timeRange, activeTab]);

  const loadActivityData = async () => {
    try {
      const data = await adminService.getActivityData(timeRange);
      setActivityData(data.data || []);
    } catch (error) {
      console.error('Error loading activity data:', error);
    }
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [analyticsData, usersData] = await Promise.all([
        adminService.getAnalytics().catch(() => null),
        adminService.getAllUsers().catch(() => [])
      ]);

      setAnalytics(analyticsData);
      setUsers(Array.isArray(usersData) ? usersData : []);

      switch (activeTab) {
        case 'transactions':
          const transData = await adminService.getAllTransactions().catch(() => []);
          setTransactions(Array.isArray(transData) ? transData : []);
          break;
        case 'reports':
          const reportsData = await adminService.getAllReports().catch(() => []);
          setReports(Array.isArray(reportsData) ? reportsData : []);
          break;
        case 'escrow':
          const escrowData = await adminService.getAllEscrowPayments().catch(() => []);
          setEscrowPayments(Array.isArray(escrowData) ? escrowData : []);
          break;
        case 'refunds':
          const refundsData = await adminService.getAllRefunds().catch(() => []);
          setRefunds(Array.isArray(refundsData) ? refundsData : []);
          break;
        case 'disputes':
          const disputesData = await adminService.getAllDisputes().catch(() => []);
          setDisputes(Array.isArray(disputesData) ? disputesData : []);
          break;
        case 'banned':
          const bannedData = await adminService.getBannedUsers().catch(() => []);
          setBannedUsers(Array.isArray(bannedData) ? bannedData : []);
          break;
        default:
          break;
      }
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
        loadAdminData();
        alert('User banned successfully');
      } catch (error) {
        alert('Failed to ban user: ' + (error.response?.data?.detail || error.message));
      }
    }
  };

  const handleUnbanUser = async (userId, username) => {
    if (window.confirm(`Are you sure you want to unban ${username}?`)) {
      try {
        await adminService.unbanUser(userId);
        loadAdminData();
        alert('User unbanned successfully');
      } catch (error) {
        alert('Failed to unban user: ' + error.message);
      }
    }
  };

  const handleForceRelease = async (paymentId) => {
    if (window.confirm('Force release this payment? This action cannot be undone.')) {
      try {
        await adminService.forceReleasePayment(paymentId);
        loadAdminData();
        alert('Payment released successfully');
      } catch (error) {
        alert('Failed to release payment: ' + error.message);
      }
    }
  };

  const handleForceRefund = async (paymentId) => {
    const reason = prompt('Enter reason for force refund:');
    if (reason) {
      try {
        await adminService.forceRefundPayment(paymentId, reason);
        loadAdminData();
        alert('Payment refunded successfully');
      } catch (error) {
        alert('Failed to refund payment: ' + error.message);
      }
    }
  };

  const handleResolveReport = async (reportId, status) => {
    const notes = status === 'resolved'
      ? prompt('Enter resolution notes:')
      : prompt('Enter reason for dismissal:');

    if (notes) {
      try {
        await adminService.updateReport(reportId, status, notes);
        loadAdminData();
        alert(`Report ${status} successfully`);
      } catch (error) {
        alert('Failed to update report: ' + error.message);
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'banned' && user.is_banned) ||
      (filterStatus === 'active' && !user.is_banned && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredReports = reports.filter(report => {
    if (reportFilter === 'all') return true;
    return report.status === reportFilter;
  });

  const stats = [
    {
      label: 'Total Users',
      value: analytics?.total_users || 0,
      icon: Users,
      change: '+12%',
      trend: 'up',
      gradient: 'from-cyan-500 via-cyan-600 to-blue-600',
      glowColor: 'rgba(6, 182, 212, 0.5)'
    },
    {
      label: 'Total Sessions',
      value: analytics?.total_sessions || 0,
      icon: CalendarCheck,
      change: '+8%',
      trend: 'up',
      gradient: 'from-emerald-500 via-green-600 to-teal-600',
      glowColor: 'rgba(16, 185, 129, 0.5)'
    },
    {
      label: 'Total Tasks',
      value: analytics?.total_tasks || 0,
      icon: Briefcase,
      change: '+15%',
      trend: 'up',
      gradient: 'from-purple-500 via-purple-600 to-pink-600',
      glowColor: 'rgba(139, 92, 246, 0.5)'
    },
    {
      label: 'Revenue',
      value: `₹${analytics?.total_revenue?.toLocaleString() || 0}`,
      icon: IndianRupee,
      change: '+23%',
      trend: 'up',
      gradient: 'from-amber-500 via-orange-600 to-red-600',
      glowColor: 'rgba(251, 191, 36, 0.5)'
    },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'escrow', label: 'Escrow Payments', icon: Lock },
    { id: 'refunds', label: 'Refunds', icon: ArrowDownRight },
    { id: 'reports', label: 'Reports', icon: Flag },
    { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
    { id: 'banned', label: 'Banned Users', icon: Ban },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
  ];

  if (loading && activeTab !== 'overview') {
    return (
      <div className="min-h-screen bg-admin-gradient">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-cyan-500/30 border-t-cyan-500 animate-spin"></div>
            <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-admin-gradient relative overflow-hidden" data-testid="admin-dashboard-page">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float-smooth"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float-smooth" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-float-smooth" style={{ animationDelay: '4s' }}></div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSg2LDE4MiwyMTIsMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
      </div>

      <Navbar />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        {/* Premium Header with Neon Glow */}
        <div className="mb-10 animate-slide-up">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-20 animate-glow-pulse"></div>
              <div className="relative">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-4 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl shadow-neon-cyan">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 tracking-tight">
                      Admin Dashboard
                    </h1>
                    <p className="text-cyan-300/80 text-lg font-semibold mt-1">Command Center • Real-time Analytics</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="group relative p-4 glass-card-admin-hover rounded-2xl text-cyan-300 transition-all">
                <Bell className="w-6 h-6" />
                <span className="absolute top-2 right-2 w-3 h-3 bg-pink-500 rounded-full animate-pulse"></span>
              </button>
              <button className="p-4 glass-card-admin-hover rounded-2xl text-cyan-300">
                <Settings className="w-6 h-6" />
              </button>
              <button
                onClick={loadAdminData}
                className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl text-white font-bold shadow-neon-cyan hover:shadow-neon-purple transition-all transform hover:scale-105"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Premium Stats Grid with Neon Effects */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
            return (
              <div
                key={index}
                className="group relative animate-fade-in-scale"
                style={{ animationDelay: `${index * 0.1}s` }}
                data-testid={`${stat.label.toLowerCase().replace(' ', '-')}-stat`}
              >
                {/* Glow Effect */}
                <div 
                  className="absolute -inset-1 rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500"
                  style={{ background: `linear-gradient(135deg, ${stat.glowColor}, transparent)` }}
                ></div>
                
                <div className="relative glass-card-admin rounded-3xl p-7 transform transition-all duration-500 group-hover:-translate-y-2 group-hover:scale-105 overflow-hidden">
                  {/* Animated Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                  
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-5">
                      <div className={`relative p-4 bg-gradient-to-br ${stat.gradient} rounded-2xl shadow-lg transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                        <Icon className="w-7 h-7 text-white" />
                        <div className="absolute inset-0 rounded-2xl bg-white/20 blur-md"></div>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm border ${
                        stat.trend === 'up' 
                          ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                          : 'bg-red-500/20 border-red-500/30 text-red-400'
                      }`}>
                        <TrendIcon className="w-4 h-4" />
                        <span className="text-xs font-bold">{stat.change}</span>
                      </div>
                    </div>
                    
                    <p className="text-slate-400 text-sm font-semibold mb-2 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-200">
                      {stat.value}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="mt-5 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full transition-all duration-1000`}
                        style={{ width: `${Math.min(100, (stat.value / 100) * 100 || 75)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enhanced Tab Navigation with Glow */}
        <div className="mb-8 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative flex items-center gap-3 px-6 py-4 rounded-2xl transition-all whitespace-nowrap font-bold transform hover:scale-105 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white shadow-neon-cyan'
                      : 'glass-card-admin text-slate-300 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 blur-xl opacity-50"></div>
                  )}
                  <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'animate-bounce-subtle' : ''}`} />
                  <span className="text-sm relative z-10">{tab.label}</span>
                  {isActive && (
                    <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse absolute -top-1 -right-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Overview Tab - Enhanced Design */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Activity Chart Card */}
            <div className="lg:col-span-2 glass-card-admin rounded-3xl p-8 animate-slide-up">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="w-6 h-6 text-cyan-400" />
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                      Platform Activity
                    </h2>
                  </div>
                  <p className="text-slate-400 font-semibold">Real-time analytics dashboard</p>
                </div>
                <div className="flex gap-2">
                  {['day', 'week', 'month'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-4 py-2 rounded-xl text-sm capitalize font-bold transition-all ${
                        timeRange === range
                          ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-neon-cyan'
                          : 'glass-card-admin text-slate-400 hover:text-white'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="h-64 rounded-2xl p-4 bg-slate-900/30 border border-cyan-500/10">
                {activityData.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 text-cyan-500/30 mx-auto mb-4 animate-pulse" />
                      <p className="text-slate-500 font-semibold">Loading analytics...</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityData}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="label" stroke="#64748b" style={{ fontSize: '12px', fontWeight: 600 }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '12px', fontWeight: 600 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                          border: '1px solid rgba(6, 182, 212, 0.3)',
                          borderRadius: '12px',
                          color: '#fff',
                          fontWeight: 600
                        }}
                      />
                      <Legend wrapperStyle={{ color: '#94a3b8', fontWeight: 600 }} />
                      <Area 
                        type="monotone" 
                        dataKey="users" 
                        stroke="#06b6d4" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorUsers)" 
                        name="New Users"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="tasks" 
                        stroke="#8b5cf6" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorTasks)" 
                        name="Tasks"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="sessions" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorSessions)" 
                        name="Sessions"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Quick Actions Sidebar */}
            <div className="glass-card-admin rounded-3xl p-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-6 h-6 text-yellow-400 animate-pulse" />
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                  Quick Actions
                </h2>
              </div>
              <p className="text-slate-400 mb-8 font-semibold">Manage platform</p>
              
              <div className="space-y-4">
                {[
                  { 
                    icon: Users, 
                    label: 'View All Users', 
                    action: () => setActiveTab('users'), 
                    gradient: 'from-cyan-500 to-blue-600',
                    badge: null 
                  },
                  { 
                    icon: Lock, 
                    label: 'Escrow Payments', 
                    action: () => setActiveTab('escrow'), 
                    gradient: 'from-purple-500 to-pink-600',
                    badge: null 
                  },
                  { 
                    icon: Flag, 
                    label: 'Review Reports', 
                    action: () => setActiveTab('reports'), 
                    gradient: 'from-amber-500 to-orange-600',
                    badge: reports.filter(r => r.status === 'pending').length 
                  },
                  { 
                    icon: Ban, 
                    label: 'Banned Users', 
                    action: () => setActiveTab('banned'), 
                    gradient: 'from-red-500 to-pink-500',
                    badge: null 
                  },
                ].map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={action.action}
                      className="w-full group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                      <div className="relative flex items-center justify-between p-5 glass-card-admin-hover rounded-2xl">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 bg-gradient-to-br ${action.gradient} rounded-xl shadow-lg transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-slate-300 group-hover:text-white transition-colors font-bold">
                            {action.label}
                          </span>
                        </div>
                        {action.badge && action.badge > 0 && (
                          <span className="px-3 py-1.5 bg-red-500/30 text-red-300 text-xs rounded-full font-bold border border-red-500/50 animate-pulse">
                            {action.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* Platform Status */}
              <div className="mt-8 p-6 glass-card-admin rounded-2xl border border-emerald-500/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400 font-semibold">Platform Status</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-emerald-400 text-sm font-bold">All Systems Operational</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-semibold">API Response</span>
                    <span className="text-cyan-400 font-bold">32ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-semibold">Database</span>
                    <span className="text-emerald-400 font-bold">Healthy</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 font-semibold">Uptime</span>
                    <span className="text-purple-400 font-bold">99.9%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="glass-card-admin rounded-3xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                    User Management
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">Manage all platform users</p>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-11 pr-4 py-3 bg-slate-900/50 border border-cyan-500/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-semibold"
                    />
                  </div>

                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-4 py-3 bg-slate-900/50 border border-cyan-500/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-semibold"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="mentor">Mentor</option>
                    <option value="student">Student</option>
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-3 bg-slate-900/50 border border-cyan-500/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-semibold"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="banned">Banned</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="text-center py-20">
                <Users className="w-20 h-20 text-cyan-500/30 mx-auto mb-4" />
                <p className="text-slate-400 text-lg font-semibold">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="users-table">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left py-5 px-6 text-xs font-bold text-cyan-400 uppercase tracking-wider">User</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-cyan-400 uppercase tracking-wider">Contact</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-cyan-400 uppercase tracking-wider">Role & Status</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-cyan-400 uppercase tracking-wider">Stats</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-cyan-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, idx) => (
                      <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <span className="text-white font-black text-lg">
                                  {user.username?.[0]?.toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-900"></div>
                            </div>
                            <div>
                              <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                                {user.full_name || user.username}
                              </div>
                              <div className="text-sm text-slate-500 font-semibold">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-2 text-sm text-slate-400 font-semibold">
                            <Mail className="w-4 h-4 text-cyan-500" />
                            {user.email}
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="space-y-2">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              <Shield className="w-3 h-3" />
                              {user.role}
                            </span>
                            <div>
                              {user.is_banned ? (
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                                  <UserX className="w-3 h-3" />
                                  Banned
                                </span>
                              ) : user.is_active ? (
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  <UserCheck className="w-3 h-3" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">
                                  <Clock className="w-3 h-3" />
                                  Inactive
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-sm font-bold text-cyan-400">{user.total_sessions || 0}</div>
                              <div className="text-xs text-slate-500 font-semibold">Sessions</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-bold text-purple-400">{user.total_tasks || 0}</div>
                              <div className="text-xs text-slate-500 font-semibold">Tasks</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-bold text-yellow-400 flex items-center gap-1">
                                {user.average_rating?.toFixed(1) || '0.0'}
                                <Star className="w-3 h-3 fill-current" />
                              </div>
                              <div className="text-xs text-slate-500 font-semibold">Rating</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-2">
                            {!user.is_banned ? (
                              <button
                                onClick={() => handleBanUser(user.id, user.username)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl text-sm font-bold transition-all border border-red-500/20 hover:border-red-500/40"
                                data-testid="ban-user-button"
                              >
                                <AlertTriangle className="w-4 h-4" />
                                Ban
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUnbanUser(user.id, user.username)}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-xl text-sm font-bold transition-all border border-emerald-500/20 hover:border-emerald-500/40"
                              >
                                <UserCheck className="w-4 h-4" />
                                Unban
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      {/* Escrow Payments Tab */}
        {activeTab === 'escrow' && (
          <div className="glass-card-admin rounded-3xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-purple-400" />
                <div>
                  <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                    Escrow Payments Management
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">Manage payments held in escrow</p>
                </div>
              </div>
            </div>

            {escrowPayments.length === 0 ? (
              <div className="text-center py-20">
                <Lock className="w-20 h-20 text-purple-500/30 mx-auto mb-4 animate-pulse" />
                <p className="text-slate-400 text-lg font-semibold">No escrow payments found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left py-5 px-6 text-xs font-bold text-purple-400 uppercase tracking-wider">Payment ID</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-purple-400 uppercase tracking-wider">Amount</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-purple-400 uppercase tracking-wider">Payer</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-purple-400 uppercase tracking-wider">Payee</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-purple-400 uppercase tracking-wider">Task</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-purple-400 uppercase tracking-wider">Status</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-purple-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {escrowPayments.map((payment) => (
                      <tr key={payment.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-5 px-6">
                          <code className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-lg">
                            {payment.id.slice(0, 8)}...
                          </code>
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-white font-bold text-lg">₹{payment.amount}</div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-slate-300 font-semibold">{payment.payer?.username || 'N/A'}</div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-slate-300 font-semibold">{payment.payee?.username || 'N/A'}</div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-slate-400 text-sm font-semibold">{payment.task?.title || 'N/A'}</div>
                        </td>
                        <td className="py-5 px-6">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                            payment.escrow_status === 'ESCROW_HELD'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : payment.escrow_status === 'RELEASED_TEST'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          }`}>
                            {payment.escrow_status}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-2">
                            {payment.escrow_status === 'ESCROW_HELD' && (
                              <>
                                <button
                                  onClick={() => handleForceRelease(payment.id)}
                                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-bold transition-all border border-emerald-500/20"
                                >
                                  <Unlock className="w-4 h-4" />
                                  Release
                                </button>
                                <button
                                  onClick={() => handleForceRefund(payment.id)}
                                  className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-xl text-sm font-bold transition-all border border-orange-500/20"
                                >
                                  <ArrowDownRight className="w-4 h-4" />
                                  Refund
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Refunds Tab */}
        {activeTab === 'refunds' && (
          <div className="glass-card-admin rounded-3xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <ArrowDownRight className="w-6 h-6 text-orange-400" />
                <div>
                  <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
                    Refunds Management
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">View all refunded payments</p>
                </div>
              </div>
            </div>

            {refunds.length === 0 ? (
              <div className="text-center py-20">
                <ArrowDownRight className="w-20 h-20 text-orange-500/30 mx-auto mb-4 animate-pulse" />
                <p className="text-slate-400 text-lg font-semibold">No refunds found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left py-5 px-6 text-xs font-bold text-orange-400 uppercase tracking-wider">Payment ID</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-orange-400 uppercase tracking-wider">Amount</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-orange-400 uppercase tracking-wider">Refunded To</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-orange-400 uppercase tracking-wider">Reason</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-orange-400 uppercase tracking-wider">Refunded At</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-orange-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refunds.map((refund) => (
                      <tr key={refund.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-5 px-6">
                          <code className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-lg">
                            {refund.id.slice(0, 8)}...
                          </code>
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-white font-bold text-lg">₹{refund.amount}</div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-slate-300 font-semibold">{refund.payer?.username || 'N/A'}</div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-slate-400 text-sm max-w-xs truncate font-semibold">
                            {refund.refund_reason || 'N/A'}
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-slate-400 text-sm font-semibold">
                            {refund.refunded_at ? new Date(refund.refunded_at).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                            {refund.escrow_status || 'REFUNDED'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="glass-card-admin rounded-3xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Flag className="w-6 h-6 text-yellow-400" />
                  <div>
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                      Reports Management
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Review and resolve user reports</p>
                  </div>
                </div>
                <select
                  value={reportFilter}
                  onChange={(e) => setReportFilter(e.target.value)}
                  className="px-4 py-3 bg-slate-900/50 border border-yellow-500/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 font-semibold"
                >
                  <option value="all">All Reports</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
            </div>

            {filteredReports.length === 0 ? (
              <div className="text-center py-20">
                <Flag className="w-20 h-20 text-yellow-500/30 mx-auto mb-4 animate-pulse" />
                <p className="text-slate-400 text-lg font-semibold">No reports found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left py-5 px-6 text-xs font-bold text-yellow-400 uppercase tracking-wider">Reporter</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-yellow-400 uppercase tracking-wider">Type</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-yellow-400 uppercase tracking-wider">Reason</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-yellow-400 uppercase tracking-wider">Description</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-yellow-400 uppercase tracking-wider">Status</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-yellow-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-5 px-6">
                          <div className="text-slate-300 font-semibold">{report.reporter?.username || 'N/A'}</div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-slate-400 text-sm font-semibold">{report.report_type || 'general'}</div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-slate-400 text-sm font-semibold">{report.reason}</div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-slate-400 text-sm max-w-xs truncate font-semibold">{report.description}</div>
                        </td>
                        <td className="py-5 px-6">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                            report.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : report.status === 'resolved'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          {report.status === 'pending' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleResolveReport(report.id, 'resolved')}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-bold transition-all border border-emerald-500/20"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Resolve
                              </button>
                              <button
                                onClick={() => handleResolveReport(report.id, 'dismissed')}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 rounded-xl text-sm font-bold transition-all border border-slate-500/20"
                              >
                                <XCircle className="w-4 h-4" />
                                Dismiss
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Disputes Tab */}
        {activeTab === 'disputes' && (
          <div className="glass-card-admin rounded-3xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
                <div>
                  <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400">
                    Disputes Management
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">Resolve payment and task disputes</p>
                </div>
              </div>
            </div>

            {disputes.length === 0 ? (
              <div className="text-center py-20">
                <AlertTriangle className="w-20 h-20 text-red-500/30 mx-auto mb-4 animate-pulse" />
                <p className="text-slate-400 text-lg font-semibold">No disputes found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left py-5 px-6 text-xs font-bold text-red-400 uppercase tracking-wider">Reporter</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-red-400 uppercase tracking-wider">Reported User</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-red-400 uppercase tracking-wider">Type</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-red-400 uppercase tracking-wider">Description</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-red-400 uppercase tracking-wider">Status</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-red-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disputes.map((dispute) => (
                      <tr key={dispute.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-5 px-6">
                          <div className="text-slate-300 font-semibold">{dispute.reporter?.username || 'N/A'}</div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-slate-300 font-semibold">{dispute.reported_user?.username || 'N/A'}</div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-slate-400 text-sm font-semibold">{dispute.report_type}</div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-slate-400 text-sm max-w-xs truncate font-semibold">{dispute.description}</div>
                        </td>
                        <td className="py-5 px-6">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                            dispute.status === 'pending'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                              : dispute.status === 'resolved'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                          }`}>
                            {dispute.status}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          {dispute.status === 'pending' && (
                            <button
                              onClick={() => handleResolveReport(dispute.id, 'resolved')}
                              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-bold transition-all border border-emerald-500/20"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Resolve
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
        )}

        {/* Banned Users Tab */}
        {activeTab === 'banned' && (
          <div className="glass-card-admin rounded-3xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <Ban className="w-6 h-6 text-red-400" />
                <div>
                  <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400">
                    Banned Users
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">Manage banned user accounts</p>
                </div>
              </div>
            </div>

            {bannedUsers.length === 0 ? (
              <div className="text-center py-20">
                <Ban className="w-20 h-20 text-red-500/30 mx-auto mb-4" />
                <p className="text-slate-400 text-lg font-semibold">No banned users</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left py-5 px-6 text-xs font-bold text-red-400 uppercase tracking-wider">User</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-red-400 uppercase tracking-wider">Email</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-red-400 uppercase tracking-wider">Ban Reason</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-red-400 uppercase tracking-wider">Reports</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-red-400 uppercase tracking-wider">Banned At</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-red-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bannedUsers.map((user) => (
                      <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                              <span className="text-white font-black text-lg">
                                {user.username?.[0]?.toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <div className="font-bold text-white">{user.full_name || user.username}</div>
                              <div className="text-sm text-slate-500 font-semibold">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-slate-300 font-semibold">{user.email}</div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-slate-400 text-sm max-w-xs truncate font-semibold">{user.ban_reason || 'N/A'}</div>
                        </td>
                        <td className="py-5 px-6">
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            {user.report_count || 0} reports
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-slate-400 text-sm font-semibold">
                            {user.banned_at ? new Date(user.banned_at).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <button
                            onClick={() => handleUnbanUser(user.id, user.username)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-sm font-bold transition-all border border-emerald-500/20"
                          >
                            <UserCheck className="w-4 h-4" />
                            Unban
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="glass-card-admin rounded-3xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-cyan-400" />
                <div>
                  <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                    All Transactions
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">View all platform transactions</p>
                </div>
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-20">
                <CreditCard className="w-20 h-20 text-cyan-500/30 mx-auto mb-4 animate-pulse" />
                <p className="text-slate-400 text-lg font-semibold">No transactions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left py-5 px-6 text-xs font-bold text-cyan-400 uppercase tracking-wider">Transaction ID</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-cyan-400 uppercase tracking-wider">Amount</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-cyan-400 uppercase tracking-wider">From</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-cyan-400 uppercase tracking-wider">To</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-cyan-400 uppercase tracking-wider">Status</th>
                      <th className="text-left py-5 px-6 text-xs font-bold text-cyan-400 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-5 px-6">
                          <code className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-lg">
                            {transaction.id.slice(0, 8)}...
                          </code>
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-white font-bold text-lg">₹{transaction.amount}</div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-slate-300 font-semibold">{transaction.payer?.username || 'N/A'}</div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-slate-300 font-semibold">{transaction.payee?.username || 'N/A'}</div>
                        </td>
                        <td className="py-5 px-6">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                            transaction.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : transaction.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-slate-400 text-sm font-semibold">
                            {transaction.created_at ? new Date(transaction.created_at).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
};

export default AdminDashboard;
