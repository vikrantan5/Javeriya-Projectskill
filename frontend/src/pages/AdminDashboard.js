import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { adminService } from '../services/apiService';
import {
  Users,
  CalendarCheck,
  Briefcase,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  Search,
  Filter,
  MoreVertical,
  Download,
  RefreshCw,
  UserCheck,
  UserX,
  Clock,
  Activity,
  PieChart,
  BarChart3,
  Eye,
  Mail,
  Phone,
  MapPin,
  Award,
  Star,
  ChevronDown,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  CreditCard,
  Flag,
  CheckCircle,
  XCircle,
  DollarSign,
  Wallet
} from 'lucide-react';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [timeRange, setTimeRange] = useState('week');
   const [activeTab, setActiveTab] = useState('users');
  const [transactions, setTransactions] = useState([]);
  const [reports, setReports] = useState([]);
  const [reportFilter, setReportFilter] = useState('all');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [usersData, analyticsData, transactionsData, reportsData] = await Promise.all([
        adminService.getAllUsers().catch(() => []),
        adminService.getAnalytics().catch(() => null),
        adminService.getAllTransactions().catch(() => []),
        adminService.getAllReports().catch(() => []),
      ]);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setAnalytics(analyticsData);
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      setReports(Array.isArray(reportsData) ? reportsData : []);
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
      } catch (error) {
        alert('Failed to unban user: ' + error.message);
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
      color: 'from-blue-500 to-cyan-400',
      bgColor: 'blue'
    },
    { 
      label: 'Total Sessions', 
      value: analytics?.total_sessions || 0, 
      icon: CalendarCheck, 
      change: '+8%', 
      trend: 'up',
      color: 'from-green-500 to-emerald-400',
      bgColor: 'green'
    },
    { 
      label: 'Total Tasks', 
      value: analytics?.total_tasks || 0, 
      icon: Briefcase, 
      change: '+15%', 
      trend: 'up',
      color: 'from-purple-500 to-pink-400',
      bgColor: 'purple'
    },
    { 
      label: 'Revenue', 
      value: `₹${analytics?.revenue?.toLocaleString() || 0}`, 
      icon: IndianRupee, 
      change: '+23%', 
      trend: 'up',
      color: 'from-yellow-500 to-orange-400',
      bgColor: 'yellow'
    },
  ];

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'mentor': return 'bg-green-100 text-green-600 border-green-200';
      default: return 'bg-blue-100 text-blue-600 border-blue-200';
    }
  };

  const getStatusBadge = (user) => {
    if (user.is_banned) {
      return { label: 'Banned', color: 'bg-red-100 text-red-600 border-red-200', icon: UserX };
    }
    if (user.is_active) {
      return { label: 'Active', color: 'bg-green-100 text-green-600 border-green-200', icon: UserCheck };
    }
    return { label: 'Inactive', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: Clock };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950" data-testid="admin-dashboard-page">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      <Navbar />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Manage your platform and monitor performance</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all border border-white/10">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all border border-white/10">
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={loadAdminData}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all border border-white/10"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
            return (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300"
                data-testid={`${stat.label.toLowerCase().replace(' ', '-')}-stat`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 bg-gradient-to-r ${stat.color} rounded-xl shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full">
                      <TrendIcon className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-green-400">{stat.change}</span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Analytics Chart Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Platform Activity</h2>
              <div className="flex gap-2">
                {['day', 'week', 'month'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 rounded-lg text-sm capitalize transition-all ${
                      timeRange === range
                        ? 'bg-indigo-500 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">Analytics chart will be displayed here</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { icon: Users, label: 'Add New User', color: 'blue' },
                { icon: Award, label: 'Create Badge', color: 'purple' },
                { icon: Shield, label: 'Review Reports', color: 'yellow', badge: 3 },
                { icon: Mail, label: 'Send Newsletter', color: 'green' },
              ].map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-${action.color}-500/20 rounded-lg`}>
                        <Icon className={`w-4 h-4 text-${action.color}-400`} />
                      </div>
                      <span className="text-gray-300 group-hover:text-white transition-colors">
                        {action.label}
                      </span>
                    </div>
                    {action.badge && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                        {action.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-xl font-bold text-white">User Management</h2>
              
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Filters */}
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="mentor">Mentor</option>
                  <option value="student">Student</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="banned">Banned</option>
                </select>

                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white transition-colors">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>
          
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No users found</p>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="users-table">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Contact</th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Role & Status</th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Stats</th>
                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const StatusIcon = getStatusBadge(user).icon;
                    return (
                      <tr 
                        key={user.id} 
                        className="border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium">
                                {user.username?.[0]?.toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-white">{user.full_name || user.username}</div>
                              <div className="text-sm text-gray-400">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <Mail className="w-4 h-4 text-gray-500" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-300">
                                <Phone className="w-4 h-4 text-gray-500" />
                                {user.phone}
                              </div>
                            )}
                            {user.location && (
                              <div className="flex items-center gap-2 text-sm text-gray-300">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                {user.location}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                              <Shield className="w-3 h-3" />
                              {user.role}
                            </span>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(user).color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {getStatusBadge(user).label}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="text-center">
                              <div className="text-sm font-medium text-white">{user.total_sessions || 0}</div>
                              <div className="text-xs text-gray-500">Sessions</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-medium text-white">{user.total_tasks || 0}</div>
                              <div className="text-xs text-gray-500">Tasks</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-medium text-white flex items-center gap-1">
                                {user.average_rating?.toFixed(1) || '0.0'}
                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              </div>
                              <div className="text-xs text-gray-500">Rating</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {!user.is_banned ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBanUser(user.id, user.username);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors"
                                data-testid="ban-user-button"
                              >
                                <AlertTriangle className="w-4 h-4" />
                                Ban
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnbanUser(user.id, user.username);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm transition-colors"
                              >
                                <UserCheck className="w-4 h-4" />
                                Unban
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // View user details
                              }}
                              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // More options
                              }}
                              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.3; }
        }
        .animate-pulse {
          animation: pulse 4s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;