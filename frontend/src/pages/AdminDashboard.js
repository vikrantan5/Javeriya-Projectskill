import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { adminService } from '../services/apiService';
import {
  Users, CalendarCheck, Briefcase, IndianRupee, TrendingUp, TrendingDown,
  Shield, AlertTriangle, Search, Download, RefreshCw, UserCheck, UserX,
  Clock, BarChart3, Eye, Mail, Star, Bell, Settings, CreditCard, Flag,
  CheckCircle, XCircle, Wallet, Lock, Unlock, Ban, FileText, DollarSign,
  ArrowUpRight, ArrowDownRight, Circle
} from 'lucide-react';

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

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Load common data
      const [analyticsData, usersData] = await Promise.all([
        adminService.getAnalytics().catch(() => null),
        adminService.getAllUsers().catch(() => [])
      ]);

      setAnalytics(analyticsData);
      setUsers(Array.isArray(usersData) ? usersData : []);

      // Load tab-specific data
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
      value: `₹${analytics?.total_revenue?.toLocaleString() || 0}`,
      icon: IndianRupee,
      change: '+23%',
      trend: 'up',
      color: 'from-yellow-500 to-orange-400',
      bgColor: 'yellow'
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950" data-testid="admin-dashboard-page">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
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

        {/* Tab Navigation */}
        <div className="mb-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  { icon: Users, label: 'View All Users', action: () => setActiveTab('users'), color: 'blue' },
                  { icon: Lock, label: 'Escrow Payments', action: () => setActiveTab('escrow'), color: 'purple' },
                  { icon: Flag, label: 'Review Reports', action: () => setActiveTab('reports'), color: 'yellow', badge: reports.filter(r => r.status === 'pending').length },
                  { icon: Ban, label: 'Banned Users', action: () => setActiveTab('banned'), color: 'red' },
                ].map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={action.action}
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
                      {action.badge && action.badge > 0 && (
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
        )}

        {activeTab === 'users' && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-xl font-bold text-white">User Management</h2>

                <div className="flex flex-col md:flex-row gap-3">
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
                </div>
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="users-table">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">User</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Contact</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Role & Status</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Stats</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
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
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Mail className="w-4 h-4 text-gray-500" />
                            {user.email}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-purple-100 text-purple-600 border-purple-200">
                              <Shield className="w-3 h-3" />
                              {user.role}
                            </span>
                            <div>
                              {user.is_banned ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-red-100 text-red-600 border-red-200">
                                  <UserX className="w-3 h-3" />
                                  Banned
                                </span>
                              ) : user.is_active ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-600 border-green-200">
                                  <UserCheck className="w-3 h-3" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-600 border-gray-200">
                                  <Clock className="w-3 h-3" />
                                  Inactive
                                </span>
                              )}
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
                                onClick={() => handleBanUser(user.id, user.username)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors"
                                data-testid="ban-user-button"
                              >
                                <AlertTriangle className="w-4 h-4" />
                                Ban
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUnbanUser(user.id, user.username)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm transition-colors"
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

        {activeTab === 'escrow' && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Escrow Payments Management</h2>
              <p className="text-gray-400 text-sm mt-1">Manage payments held in escrow</p>
            </div>

            {escrowPayments.length === 0 ? (
              <div className="text-center py-16">
                <Lock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No escrow payments found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Payment ID</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Amount</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Payer</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Payee</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Task</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Status</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {escrowPayments.map((payment) => (
                      <tr key={payment.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6">
                          <code className="text-xs text-indigo-400">{payment.id.slice(0, 8)}...</code>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-white font-medium">₹{payment.amount}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-gray-300">{payment.payer?.username || 'N/A'}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-gray-300">{payment.payee?.username || 'N/A'}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-gray-300 text-sm">{payment.task?.title || 'N/A'}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            payment.escrow_status === 'ESCROW_HELD'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : payment.escrow_status === 'RELEASED_TEST'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {payment.escrow_status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {payment.escrow_status === 'ESCROW_HELD' && (
                              <>
                                <button
                                  onClick={() => handleForceRelease(payment.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm transition-colors"
                                >
                                  <Unlock className="w-4 h-4" />
                                  Release
                                </button>
                                <button
                                  onClick={() => handleForceRefund(payment.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg text-sm transition-colors"
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

        {activeTab === 'refunds' && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Refunds Management</h2>
              <p className="text-gray-400 text-sm mt-1">View all refunded payments</p>
            </div>

            {refunds.length === 0 ? (
              <div className="text-center py-16">
                <ArrowDownRight className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No refunds found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Payment ID</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Amount</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Refunded To</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Reason</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Refunded At</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refunds.map((refund) => (
                      <tr key={refund.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6">
                          <code className="text-xs text-indigo-400">{refund.id.slice(0, 8)}...</code>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-white font-medium">₹{refund.amount}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-gray-300">{refund.payer?.username || 'N/A'}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-gray-400 text-sm max-w-xs truncate">{refund.refund_reason || 'N/A'}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-gray-400 text-sm">
                            {refund.refunded_at ? new Date(refund.refunded_at).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400">
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

        {activeTab === 'reports' && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Reports Management</h2>
                  <p className="text-gray-400 text-sm mt-1">Review and resolve user reports</p>
                </div>
                <select
                  value={reportFilter}
                  onChange={(e) => setReportFilter(e.target.value)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Reports</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
            </div>

            {filteredReports.length === 0 ? (
              <div className="text-center py-16">
                <Flag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No reports found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Reporter</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Type</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Reason</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Description</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Status</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6">
                          <div className="text-gray-300">{report.reporter?.username || 'N/A'}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-gray-400 text-sm">{report.report_type || 'general'}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-gray-400 text-sm">{report.reason}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-gray-400 text-sm max-w-xs truncate">{report.description}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            report.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : report.status === 'resolved'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {report.status === 'pending' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleResolveReport(report.id, 'resolved')}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Resolve
                              </button>
                              <button
                                onClick={() => handleResolveReport(report.id, 'dismissed')}
                                className="flex items-center gap-1 px-3 py-1.5 bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 rounded-lg text-sm transition-colors"
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

        {activeTab === 'disputes' && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Disputes Management</h2>
              <p className="text-gray-400 text-sm mt-1">Resolve payment and task disputes</p>
            </div>

            {disputes.length === 0 ? (
              <div className="text-center py-16">
                <AlertTriangle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No disputes found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Reporter</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Reported User</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Type</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Description</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Status</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disputes.map((dispute) => (
                      <tr key={dispute.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6">
                          <div className="text-gray-300">{dispute.reporter?.username || 'N/A'}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-gray-300">{dispute.reported_user?.username || 'N/A'}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-gray-400 text-sm">{dispute.report_type}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-gray-400 text-sm max-w-xs truncate">{dispute.description}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            dispute.status === 'pending'
                              ? 'bg-red-500/20 text-red-400'
                              : dispute.status === 'resolved'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {dispute.status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {dispute.status === 'pending' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleResolveReport(dispute.id, 'resolved')}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Resolve
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

        {activeTab === 'banned' && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Banned Users</h2>
              <p className="text-gray-400 text-sm mt-1">Manage banned user accounts</p>
            </div>

            {bannedUsers.length === 0 ? (
              <div className="text-center py-16">
                <Ban className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No banned users</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">User</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Email</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Ban Reason</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Reports</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Banned At</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bannedUsers.map((user) => (
                      <tr key={user.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center">
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
                          <div className="text-gray-300">{user.email}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-gray-400 text-sm max-w-xs truncate">{user.ban_reason || 'N/A'}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                            {user.report_count || 0} reports
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-gray-400 text-sm">
                            {user.banned_at ? new Date(user.banned_at).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleUnbanUser(user.id, user.username)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm transition-colors"
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

        {activeTab === 'transactions' && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">All Transactions</h2>
              <p className="text-gray-400 text-sm mt-1">View all platform transactions</p>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-16">
                <CreditCard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No transactions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Transaction ID</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Amount</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">From</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">To</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Status</th>
                      <th className="text-left py-4 px-6 text-xs font-medium text-gray-400 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6">
                          <code className="text-xs text-indigo-400">{transaction.id.slice(0, 8)}...</code>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-white font-medium">₹{transaction.amount}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-gray-300">{transaction.payer?.username || 'N/A'}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-gray-300">{transaction.payee?.username || 'N/A'}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.status === 'completed'
                              ? 'bg-green-500/20 text-green-400'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-gray-400 text-sm">
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
