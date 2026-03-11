import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { taskService } from '../services/apiService';
import {
  Briefcase,
  Plus,
  X,
  Search,
  Filter,
  Clock,
  DollarSign,
  BookOpen,
  TrendingUp,
  Award,
  Users,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  ChevronRight,
  MoreVertical,
  ThumbsUp,
  Share2,
  Download,
  RefreshCw,
  Star,
  MapPin,
  User,
  Video,
  FileText,
  Upload,
  Download as DownloadIcon,
  Eye,
  Edit,
  Trash2,
  Send,
  Copy,
  Check,
  Sparkles,
  Zap,
  Shield,
  Crown,
  Medal,
  Target,
  Brain,
  Rocket,
  Compass,
  Grid,
  List
} from 'lucide-react';

const TaskMarketplace = () => {
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterPrice, setFilterPrice] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    subject: '',
    difficulty_level: 'medium',
    price: '',
    deadline: '',
    attachments: [],
    requirements: '',
    estimated_hours: ''
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [submissionModal, setSubmissionModal] = useState(false);
  const [submissionData, setSubmissionData] = useState({
    message: '',
    attachments: []
  });

  useEffect(() => {
    loadTasks();
  }, [activeTab]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      let data;
      if (activeTab === 'all') {
        data = await taskService.getAllTasks('open');
      } else if (activeTab === 'my-tasks') {
        data = await taskService.getMyTasks();
      } else if (activeTab === 'accepted') {
        data = await taskService.getAcceptedTasks();
      } else if (activeTab === 'completed') {
        data = await taskService.getCompletedTasks();
      } else {
        data = await taskService.getAllTasks(activeTab);
      }
      // Extract tasks from response - handle both flat and nested structures
      let processedTasks = [];
      if (Array.isArray(data)) {
        processedTasks = data.map(item => {
          // If item has 'task' property, extract and merge with creator info
          if (item.task) {
            return {
              ...item.task,
              creator_name: item.creator?.full_name || item.creator?.username,
              creator_photo: item.creator?.profile_photo,
              creator_rating: item.creator?.average_rating
            };
          }
          // Otherwise it's already a flat task object
          return item;
        });
      }
      
      setTasks(processedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      showNotification('Failed to load tasks', 'error');
      setTasks([]);
    }
    setLoading(false);
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await taskService.createTask(newTask);
      showNotification('Task created successfully!', 'success');
      setShowCreateTask(false);
      setNewTask({
        title: '',
        description: '',
        subject: '',
        difficulty_level: 'medium',
        price: '',
        deadline: '',
        attachments: [],
        requirements: '',
        estimated_hours: ''
      });
      loadTasks();
    } catch (error) {
      showNotification('Failed to create task: ' + (error.response?.data?.detail || error.message), 'error');
    }
    setLoading(false);
  };

  const handleAcceptTask = async (taskId) => {
    try {
      await taskService.acceptTask(taskId);
      showNotification('Task accepted! You can now work on it.', 'success');
      loadTasks();
    } catch (error) {
      showNotification('Failed to accept task: ' + (error.response?.data?.detail || error.message), 'error');
    }
  };

  const handleSubmitTask = async () => {
    setLoading(true);
    try {
      await taskService.submitTask(selectedTask.id, submissionData);
      showNotification('Task submitted successfully!', 'success');
      setSubmissionModal(false);
      setSubmissionData({ message: '', attachments: [] });
      loadTasks();
    } catch (error) {
      showNotification('Failed to submit task: ' + (error.response?.data?.detail || error.message), 'error');
    }
    setLoading(false);
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await taskService.completeTask(taskId);
      showNotification('Task marked as completed!', 'success');
      loadTasks();
    } catch (error) {
      showNotification('Failed to complete task: ' + (error.response?.data?.detail || error.message), 'error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskService.deleteTask(taskId);
        showNotification('Task deleted successfully!', 'success');
        loadTasks();
      } catch (error) {
        showNotification('Failed to delete task: ' + (error.response?.data?.detail || error.message), 'error');
      }
    }
  };

  const getDifficultyColor = (level) => {
    switch(level?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400';
      case 'medium': return 'bg-yellow-100 text-yellow-600 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'hard': return 'bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'open': return 'bg-green-100 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400';
      case 'accepted': return 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400';
      case 'in_progress': return 'bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400';
      case 'submitted': return 'bg-yellow-100 text-yellow-600 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'completed': return 'bg-indigo-100 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400';
      default: return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'open': return Target;
      case 'accepted': return CheckCircle;
      case 'in_progress': return TrendingUp;
      case 'submitted': return Send;
      case 'completed': return Award;
      default: return Briefcase;
    }
  };

  const filterTasks = (tasksList) => {
    let filtered = [...tasksList];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Difficulty filter
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(task => task.difficulty_level === filterDifficulty);
    }

    // Price filter
    if (filterPrice !== 'all') {
      const price = parseInt(task.price);
      switch(filterPrice) {
        case 'low':
          filtered = filtered.filter(task => task.price < 500);
          break;
        case 'medium':
          filtered = filtered.filter(task => task.price >= 500 && task.price < 1000);
          break;
        case 'high':
          filtered = filtered.filter(task => task.price >= 1000);
          break;
      }
    }

    // Sort
    switch(sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'deadline':
        filtered.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        break;
    }

    return filtered;
  };

  const displayedTasks = filterTasks(tasks);

  const stats = {
    total: tasks.length,
    open: tasks.filter(t => t.status === 'open').length,
    accepted: tasks.filter(t => t.status === 'accepted' || t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    totalEarnings: tasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.price || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950" data-testid="task-marketplace-page">
      <Navbar />
      
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200 dark:bg-indigo-500/20 rounded-full blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200 dark:bg-purple-500/20 rounded-full blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg animate-slide-in ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white flex items-center gap-3`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {notification.message}
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Task Marketplace</h1>
            <p className="text-gray-600 dark:text-gray-400">Find tasks to earn or get help with your projects</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all"
              title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
            >
              {viewMode === 'grid' ? <List className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : <Grid className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
            </button>
            <button
              onClick={loadTasks}
              className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setShowCreateTask(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-600/25"
              data-testid="create-task-button"
            >
              <Plus className="w-5 h-5" />
              Create Task
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Briefcase className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-green-600 dark:text-green-400" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.open}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Open Tasks</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.accepted}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{stats.totalEarnings}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Earned</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-gray-200 dark:border-gray-700" data-testid="task-tabs">
          {[
            { id: 'all', label: 'All Tasks', icon: Briefcase },
            { id: 'open', label: 'Open', icon: Target },
            { id: 'my-tasks', label: 'My Tasks', icon: User },
            { id: 'accepted', label: 'Accepted', icon: CheckCircle },
            { id: 'completed', label: 'Completed', icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3 px-4 font-medium transition-all relative ${
                  activeTab === tab.id
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                data-testid={`${tab.id}-tasks-tab`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks by title, description, or subject..."
                className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3">
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              <select
                value={filterPrice}
                onChange={(e) => setFilterPrice(e.target.value)}
                className="px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Prices</option>
                <option value="low">Under ₹500</option>
                <option value="medium">₹500 - ₹1000</option>
                <option value="high">Above ₹1000</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-high">Price: High to Low</option>
                <option value="price-low">Price: Low to High</option>
                <option value="deadline">Deadline</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tasks Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        ) : displayedTasks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-16 text-center shadow-lg" data-testid="no-tasks">
            <div className="w-24 h-24 mx-auto bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
              <Briefcase className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Tasks Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {searchTerm || filterDifficulty !== 'all' || filterPrice !== 'all'
                ? "No tasks match your search criteria. Try adjusting your filters."
                : activeTab === 'my-tasks' 
                  ? "You haven't created any tasks yet. Create your first task to get help!"
                  : "No tasks available at the moment. Check back later or create a new task."}
            </p>
            {(searchTerm || filterDifficulty !== 'all' || filterPrice !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterDifficulty('all');
                  setFilterPrice('all');
                }}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
            {displayedTasks.map((task) => {
              const StatusIcon = getStatusIcon(task.status);
              const DifficultyIcon = getDifficultyColor(task.difficulty_level) ? Award : Target;
              
              return (
                <div
                  key={task.id}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
                  onClick={() => {
                    setSelectedTask(task);
                    setShowTaskDetails(true);
                  }}
                  data-testid="task-card"
                >
                  {/* Card Header with Gradient */}
                  <div className="relative h-32 bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="relative flex justify-between items-start">
                      <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-white text-xs">
                        #{task.id?.slice(0, 8)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        <StatusIcon className="w-3 h-3 inline mr-1" />
                        {task.status}
                      </span>
                    </div>
                    
                    <div className="relative mt-4">
                      <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{task.title}</h3>
                      <p className="text-indigo-100 text-sm flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {task.subject || 'General'}
                      </p>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {task.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty_level)}`}>
                        {task.difficulty_level}
                      </span>
                      {task.estimated_hours && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-full text-xs font-medium">
                          📅 {task.estimated_hours}h
                        </span>
                      )}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-bold text-gray-900 dark:text-white">₹{task.price}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Price</p>
                      </div>
                      <div className="text-center border-l border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-center gap-1 text-indigo-600 dark:text-indigo-400">
                          <Calendar className="w-4 h-4" />
                          <span className="font-bold text-gray-900 dark:text-white">
                            {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Deadline</p>
                      </div>
                    </div>

                    {/* Creator Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {task.creator_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {task.creator_name || 'Anonymous'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(task.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      {task.status === 'open' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptTask(task.id);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md shadow-indigo-600/25 text-sm"
                          data-testid="accept-task-button"
                        >
                          Accept Task
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Task Modal */}
        {showCreateTask && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateTask(false)} data-testid="create-task-modal">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="relative h-24 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl p-6">
                <div className="absolute inset-0 bg-black/20 rounded-t-2xl"></div>
                <div className="relative flex justify-between items-start">
                  <h2 className="text-2xl font-bold text-white">Create New Task</h2>
                  <button
                    onClick={() => setShowCreateTask(false)}
                    className="p-2 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Help with Python Assignment"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    data-testid="task-title-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Describe the task in detail. Include specific requirements, expectations, and any relevant information..."
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    data-testid="task-description-input"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Requirements
                  </label>
                  <textarea
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="List any specific requirements, skills needed, or prerequisites..."
                    value={newTask.requirements}
                    onChange={(e) => setNewTask({ ...newTask, requirements: e.target.value })}
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., Computer Science"
                      value={newTask.subject}
                      onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
                      data-testid="task-subject-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Difficulty Level
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={newTask.difficulty_level}
                      onChange={(e) => setNewTask({ ...newTask, difficulty_level: e.target.value })}
                      data-testid="task-difficulty-select"
                    >
                      <option value="easy">🌱 Easy</option>
                      <option value="medium">📈 Medium</option>
                      <option value="hard">🚀 Hard</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="500"
                      value={newTask.price}
                      onChange={(e) => setNewTask({ ...newTask, price: e.target.value })}
                      data-testid="task-price-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., 5"
                      value={newTask.estimated_hours}
                      onChange={(e) => setNewTask({ ...newTask, estimated_hours: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                    data-testid="task-deadline-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Attachments
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center">
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Drag and drop files here, or{' '}
                      <button className="text-indigo-600 dark:text-indigo-400 hover:underline">
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Supported: PDF, DOC, ZIP (Max 10MB)
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateTask(false)}
                    className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    data-testid="cancel-button"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                    data-testid="submit-task-button"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Task
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Details Modal */}
        {showTaskDetails && selectedTask && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowTaskDetails(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="relative h-32 bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
                <div className="absolute inset-0 bg-black/20 rounded-t-2xl"></div>
                <div className="relative flex justify-between items-start">
                  <div>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-white text-xs">
                      Task #{selectedTask.id?.slice(0, 8)}
                    </span>
                    <h2 className="text-2xl font-bold text-white mt-2">{selectedTask.title}</h2>
                  </div>
                  <button
                    onClick={() => setShowTaskDetails(false)}
                    className="p-2 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {/* Status Badge */}
                <div className="flex justify-between items-center mb-6">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTask.status)}`}>
                    {selectedTask.status}
                  </span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ₹{selectedTask.price}
                  </span>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {selectedTask.description}
                  </p>
                </div>

                {/* Requirements */}
                {selectedTask.requirements && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Requirements</h3>
                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {selectedTask.requirements}
                    </p>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Subject</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedTask.subject || 'General'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Difficulty</p>
                    <p className={`font-medium ${getDifficultyColor(selectedTask.difficulty_level)}`}>
                      {selectedTask.difficulty_level}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Deadline</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(selectedTask.deadline).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Created</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(selectedTask.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Creator Info */}
                <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Task Creator</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {selectedTask.creator_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedTask.creator_name || 'Anonymous'}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Member since {new Date(selectedTask.creator_joined)?.toLocaleDateString() || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {selectedTask.status === 'open' && (
                    <button
                      onClick={() => {
                        handleAcceptTask(selectedTask.id);
                        setShowTaskDetails(false);
                      }}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Accept Task
                    </button>
                  )}

                  {selectedTask.status === 'accepted' && (
                    <button
                      onClick={() => {
                        setSubmissionModal(true);
                        setShowTaskDetails(false);
                      }}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-600/25 flex items-center justify-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      Submit Work
                    </button>
                  )}

                  {selectedTask.status === 'submitted' && (
                    <button
                      onClick={() => handleCompleteTask(selectedTask.id)}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2"
                    >
                      <Award className="w-5 h-5" />
                      Mark Complete
                    </button>
                  )}

                  {(selectedTask.status === 'open' || selectedTask.status === 'accepted') && (
                    <button className="flex-1 border border-gray-200 dark:border-gray-700 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Message
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submission Modal */}
        {submissionModal && selectedTask && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSubmissionModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="relative h-24 bg-gradient-to-r from-green-600 to-emerald-600 rounded-t-2xl p-6">
                <div className="absolute inset-0 bg-black/20 rounded-t-2xl"></div>
                <div className="relative flex justify-between items-start">
                  <h2 className="text-2xl font-bold text-white">Submit Work</h2>
                  <button
                    onClick={() => setSubmissionModal(false)}
                    className="p-2 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Submission Message
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows="4"
                    placeholder="Add a message about your work..."
                    value={submissionData.message}
                    onChange={(e) => setSubmissionData({ ...submissionData, message: e.target.value })}
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Attachments
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center">
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Drag and drop files here, or{' '}
                      <button className="text-indigo-600 dark:text-indigo-400 hover:underline">
                        browse
                      </button>
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setSubmissionModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitTask}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-green-600/25 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default TaskMarketplace;