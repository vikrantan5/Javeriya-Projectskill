import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Filter,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Award,
  ShoppingCart,
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  Search,
  Download,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Wallet = () => {
  const { user } = useAuth();
  const [tokenBalance, setTokenBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'earn', 'spend'
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (user?.id) {
      loadWalletData();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [transactions, filter, searchTerm]);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Load token balance
      const balanceResponse = await axios.get(`${BACKEND_URL}/api/users/token-balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTokenBalance(balanceResponse.data);
      
      // Load all transactions
      const transactionsResponse = await axios.get(`${BACKEND_URL}/api/users/token-transactions?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(transactionsResponse.data.transactions || []);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...transactions];
    
    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(tx => tx.transaction_type === filter);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.transaction_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredTransactions(filtered);
    setCurrentPage(1);
  };

  const getTransactionIcon = (type, reason) => {
    if (type === 'earn') {
      if (reason?.includes('session')) return BookOpen;
      if (reason?.includes('task')) return CheckCircle;
      if (reason?.includes('bonus')) return Award;
      return ArrowDownLeft;
    } else {
      if (reason?.includes('session')) return BookOpen;
      if (reason?.includes('purchase')) return ShoppingCart;
      return ArrowUpRight;
    }
  };

  const getTransactionColor = (type) => {
    return type === 'earn' ? 'text-green-600' : 'text-red-600';
  };

  const getTransactionBg = (type) => {
    return type === 'earn' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30';
  };

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = [
    {
      label: 'Current Balance',
      value: tokenBalance?.balance || 0,
      icon: Coins,
      color: 'indigo',
      suffix: ' tokens'
    },
    {
      label: 'Total Earned',
      value: tokenBalance?.total_earned || 0,
      icon: TrendingUp,
      color: 'green',
      suffix: ' tokens'
    },
    {
      label: 'Total Spent',
      value: tokenBalance?.total_spent || 0,
      icon: TrendingDown,
      color: 'red',
      suffix: ' tokens'
    },
    {
      label: 'Total Transactions',
      value: transactions.length,
      icon: Award,
      color: 'purple',
      suffix: ''
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-pink-100 to-purple-100" data-testid="wallet-page">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Wallet & Transactions
          </h1>
          <p className="text-gray-600">Manage your skill tokens and view transaction history</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-gradient-to-br from-pink-200 via-rose-200 to-purple-200 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-${stat.color}-100 rounded-xl`}>
                    <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                  <button onClick={loadWalletData} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}{stat.suffix}
                </h3>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Filters and Search */}
        <div className="bg-gradient-to-br from-pink-200 via-rose-200 to-purple-200 dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="search-transactions-input"
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                data-testid="filter-all"
              >
                All
              </button>
              <button
                onClick={() => setFilter('earn')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  filter === 'earn'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                data-testid="filter-earn"
              >
                <TrendingUp className="w-4 h-4" />
                Earned
              </button>
              <button
                onClick={() => setFilter('spend')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  filter === 'spend'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                data-testid="filter-spend"
              >
                <TrendingDown className="w-4 h-4" />
                Spent
              </button>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-gradient-to-br from-pink-200 via-rose-200 to-purple-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-red-600 to-blue-600">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Transaction History
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-16 text-center">
              <Coins className="w-24 h-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Transactions Found</h3>
              <p className="text-gray-600">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your filters or search terms'
                  : 'Your transaction history will appear here'}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {paginatedTransactions.map((transaction, index) => {
                  const Icon = getTransactionIcon(transaction.transaction_type, transaction.reason);
                  const isEarn = transaction.transaction_type === 'earn';
                  
                  return (
                    <div
                      key={transaction.id || index}
                      className="p-6 hover:bg-gray-50 transition-colors"
                      data-testid="transaction-item"
                    >
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className={`p-3 rounded-xl ${getTransactionBg(transaction.transaction_type)}`}>
                          <Icon className={`w-6 h-6 ${getTransactionColor(transaction.transaction_type)}`} />
                        </div>

                        {/* Details */}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {transaction.reason?.replace(/_/g, ' ').replace(/bw/g, l => l.toUpperCase()) || 'Transaction'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {transaction.created_at 
                              ? new Date(transaction.created_at).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'Date unknown'}
                          </p>
                        </div>

                        {/* Amount */}
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${getTransactionColor(transaction.transaction_type)}`}>
                            {isEarn ? '+' : '-'}{transaction.amount}
                          </p>
                          <p className="text-xs text-gray-500">tokens</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
                  </p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          currentPage === i + 1
                            ? 'bg-indigo-600 text-white'
                            : 'border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;
