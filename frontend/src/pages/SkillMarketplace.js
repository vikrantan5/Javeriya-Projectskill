import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import FindMentorModal from '../components/FindMentorModal';
import { skillService } from '../services/apiService';
import {
  Search,
  Plus,
  X,
  CheckCircle,
  Award,
  Star,
  MapPin,
  User,
  Clock,
  TrendingUp,
  Filter,
  Grid,
  List,
  BookOpen,
  GraduationCap,
  Sparkles,
  Zap,
  Shield,
  Users,
  MessageSquare,
  Calendar,
  ChevronRight,
  MoreVertical,
  ThumbsUp,
  Share2,
  Download,
  RefreshCw,
  AlertCircle,
  Loader2,
  Check,
  Globe,
  Mail,
  Phone,
  Video,
  Briefcase,
  Heart,
  Crown,
  Medal,
  Target,
  Brain,
  Rocket,
  Compass,
  Edit2
} from 'lucide-react';

const SkillMarketplace = () => {
  const [activeTab, setActiveTab] = useState('my-skills');
  const [mySkills, setMySkills] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [searchSkill, setSearchSkill] = useState('');
  const [newSkill, setNewSkill] = useState({
    skill_name: '',
    skill_type: 'offered',
    skill_level: 'intermediate',
    description: '',
    years_experience: '',
    hourly_rate: ''
  });
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showSkillDetails, setShowSkillDetails] = useState(false);
  const [requestModal, setRequestModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [requestData, setRequestData] = useState({
    date: '',
    time: '',
    duration: 60,
    message: ''
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editSkill, setEditSkill] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [findMentorModal, setFindMentorModal] = useState({ show: false, skill: '' });

  const handleAddSkill = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await skillService.addSkill(newSkill);
      setShowAddSkill(false);
      setNewSkill({ 
        skill_name: '', 
        skill_type: 'offered', 
        skill_level: 'intermediate',
        description: '',
        years_experience: '',
        hourly_rate: ''
      });
      showNotification('Skill added successfully!', 'success');
      loadMySkills();
    } catch (error) {
      showNotification('Failed to add skill: ' + (error.response?.data?.detail || error.message), 'error');
    }
    setLoading(false);
  };

  const handleEditSkill = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await skillService.updateSkill(editSkill.id, editSkill);
      setShowEditModal(false);
      setEditSkill(null);
      showNotification('Skill updated successfully!', 'success');
      loadMySkills();
    } catch (error) {
      showNotification('Failed to update skill: ' + (error.response?.data?.detail || error.message), 'error');
    }
    setLoading(false);
  };

  const handleDeleteSkill = async (skillId) => {
    try {
      await skillService.deleteSkill(skillId);
      setDeleteConfirm(null);
      showNotification('Skill deleted successfully!', 'success');
      loadMySkills();
    } catch (error) {
      showNotification('Failed to delete skill: ' + (error.response?.data?.detail || error.message), 'error');
    }
  };

  const handleRequestSession = async () => {
    setLoading(true);
    try {
      await skillService.requestSession({
        mentor_id: selectedMentor.user_id,
        skill_id: selectedMentor.skill_id,
        ...requestData
      });
      setRequestModal(false);
      showNotification('Session request sent successfully!', 'success');
      setRequestData({ date: '', time: '', duration: 60, message: '' });
    } catch (error) {
      showNotification('Failed to send request: ' + (error.response?.data?.detail || error.message), 'error');
    }
    setLoading(false);
  };

  const loadMySkills = async () => {
    try {
      const data = await skillService.getMySkills();
      setMySkills(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading skills:', error);
      setMySkills([]);
    }
  };

  const searchMentors = async () => {
    if (!searchSkill.trim()) return;
    setLoading(true);
    try {
      const data = await skillService.searchSkills(searchSkill, 'offered');
      setMentors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error finding mentors:', error);
      showNotification('Failed to find mentors', 'error');
      setMentors([]);
    }
    setLoading(false);
  };

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  useEffect(() => {
    if (activeTab === 'my-skills') {
      loadMySkills();
    }
  }, [activeTab]);

  const getLevelColor = (level) => {
    switch(level?.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400';
      case 'intermediate': return 'bg-yellow-100 text-yellow-600 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'advanced': return 'bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400';
      case 'expert': return 'bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getLevelIcon = (level) => {
    switch(level?.toLowerCase()) {
      case 'beginner': return GraduationCap;
      case 'intermediate': return TrendingUp;
      case 'advanced': return Award;
      case 'expert': return Crown;
      default: return Target;
    }
  };

  const sortMentors = (mentorsList) => {
    switch(sortBy) {
      case 'rating':
        return [...mentorsList].sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
      case 'sessions':
        return [...mentorsList].sort((a, b) => (b.total_sessions || 0) - (a.total_sessions || 0));
      case 'name':
        return [...mentorsList].sort((a, b) => (a.full_name || a.username || '').localeCompare(b.full_name || b.username || ''));
      default:
        return mentorsList;
    }
  };

  const filterMentorsByLevel = (mentorsList) => {
    if (filterLevel === 'all') return mentorsList;
    return mentorsList.filter(m => m.skill_level?.toLowerCase() === filterLevel);
  };

  const filterMentorsByType = (mentorsList) => {
    if (filterType === 'all') return mentorsList;
    return mentorsList.filter(m => m.verification_status === (filterType === 'verified'));
  };

  const displayedMentors = filterMentorsByType(filterMentorsByLevel(sortMentors(mentors)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950" data-testid="skill-marketplace-page">
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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Skill Marketplace</h1>
            <p className="text-gray-600 dark:text-gray-400">Discover, learn, and grow with our community</p>
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
              onClick={() => activeTab === 'my-skills' ? loadMySkills() : searchMentors()}
              className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Tabs with Icons */}
        <div className="flex space-x-4 mb-8 border-b border-gray-200 dark:border-gray-700" data-testid="skill-tabs">
          {[
            { id: 'my-skills', label: 'My Skills', icon: BookOpen },
            { id: 'find-mentors', label: 'Find Mentors', icon: Compass },
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
                data-testid={`${tab.id}-tab`}
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

        {/* My Skills Tab */}
        {activeTab === 'my-skills' && (
          <div className="space-y-6">
            {/* Header with Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Your Skills</h2>
                  <p className="text-gray-600 dark:text-gray-400">Manage your skills and expertise</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{mySkills.length}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total Skills</p>
                    </div>
                    <div className="w-px h-10 bg-gray-200 dark:bg-gray-700"></div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {mySkills.filter(s => s.is_verified).length}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Verified</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowAddSkill(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-600/25"
                    data-testid="add-skill-button"
                  >
                    <Plus className="w-5 h-5" />
                    Add Skill
                  </button>
                </div>
              </div>
            </div>

            {mySkills.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-16 text-center shadow-lg" data-testid="no-skills">
                <div className="w-24 h-24 mx-auto bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Skills Added Yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Start by adding your first skill. Showcase what you can teach or what you want to learn!
                </p>
                <button
                  onClick={() => setShowAddSkill(true)}
                  className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium hover:gap-3 transition-all"
                >
                  Add your first skill
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
                {mySkills.map((skill) => {
                  const LevelIcon = getLevelIcon(skill.skill_level);
                  return (
                    <div
                      key={skill.id}
                      className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                      data-testid="skill-card"
                    >
                      {/* Card Header with Gradient */}
                      <div className="relative h-24 bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
                        <div className="absolute inset-0 bg-black/20"></div>
                        <div className="relative flex justify-between items-start">
                          <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-white text-xs">
                            #{skill.skill_name?.slice(0, 2).toUpperCase()}
                          </span>
                          {skill.is_verified && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 backdrop-blur text-green-400 rounded-full text-xs">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{skill.skill_name}</h3>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => {
                                setEditSkill(skill);
                                setShowEditModal(true);
                              }}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </button>
                            <button 
                              onClick={() => setDeleteConfirm(skill.id)}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                            </button>
                          </div>
                        </div>

                        {/* Delete Confirmation */}
                        {deleteConfirm === skill.id && (
                          <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400 mb-2">Delete this skill?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDeleteSkill(skill.id)}
                                className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-xs rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                              >
                                No
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Skill Description */}
                        {skill.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {skill.description}
                          </p>
                        )}

                        <div className="space-y-3">
                          {/* Type Badge */}
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              skill.skill_type === 'offered' 
                                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {skill.skill_type === 'offered' ? '📤 Can Teach' : '📥 Want to Learn'}
                            </span>
                          </div>

                          {/* Level with Icon */}
                          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(skill.skill_level)}`}>
                            <LevelIcon className="w-3 h-3" />
                            <span className="capitalize">{skill.skill_level || 'Not specified'}</span>
                          </div>

                          {/* Experience & Rate */}
                          {(skill.years_experience || skill.hourly_rate) && (
                            <div className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                              {skill.years_experience && (
                                <span>📅 {skill.years_experience} years exp.</span>
                              )}
                              {skill.hourly_rate && (
                                <span>💰 ${skill.hourly_rate}/hr</span>
                              )}
                            </div>
                          )}

                          {/* Stats */}
                          <div className="flex items-center gap-4 pt-3 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{skill.student_count || 0} learners</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400" />
                              <span>{skill.average_rating?.toFixed(1) || '0.0'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Find Mentors Tab */}
        {activeTab === 'find-mentors' && (
          <div className="space-y-6">
            {/* Search Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for a skill (e.g., React, Python, Design)..."
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={searchSkill}
                    onChange={(e) => setSearchSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchMentors()}
                    data-testid="search-skill-input"
                  />
                </div>
                <button
                  onClick={searchMentors}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/25"
                  data-testid="search-mentors-button"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Find Mentors
                    </>
                  )}
                </button>
              </div>

              {/* Filters */}
              {mentors.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Filter className="w-4 h-4" />
                    Filter:
                  </span>
                  
                  <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>

                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Mentors</option>
                    <option value="verified">Verified Only</option>
                    <option value="unverified">Unverified</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="rating">Sort by Rating</option>
                    <option value="sessions">Sort by Sessions</option>
                    <option value="name">Sort by Name</option>
                  </select>
                </div>
              )}
            </div>

            {mentors.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-16 text-center shadow-lg" data-testid="no-mentors">
                <div className="w-24 h-24 mx-auto bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Find Your Mentor</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Enter a skill above to discover expert mentors ready to guide you.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['React', 'Python', 'Design', 'Marketing'].map((skill) => (
                    <button
                      key={skill}
                      onClick={() => {
                        setSearchSkill(skill);
                        searchMentors();
                      }}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
                {displayedMentors.map((mentor) => {
                  const LevelIcon = getLevelIcon(mentor.skill_level);
                  return (
                    <div
                      key={mentor.user_id}
                      className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                      data-testid="mentor-card"
                    >
                      {/* Card Header */}
                      <div className="relative h-32 bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
                        <div className="absolute inset-0 bg-black/20"></div>
                        <div className="relative flex justify-between items-start">
                          <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-white text-xs">
                            Top Mentor
                          </span>
                          {mentor.is_verified && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 backdrop-blur text-green-400 rounded-full text-xs">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </span>
                          )}
                        </div>
                        
                        {/* Avatar */}
                        <div className="relative -mt-8 flex justify-center">
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-1">
                            <div className="w-full h-full rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center">
                              <span className="text-3xl font-bold text-indigo-600">
                                {mentor.username?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-6 pt-2">
                        <div className="text-center mb-4">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            {mentor.full_name || mentor.username}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {mentor.location || 'Location not set'}
                          </p>
                        </div>

                        {/* Skill Info */}
                        <div className="text-center mb-3">
                          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            {mentor.skill_name}
                          </p>
                        </div>

                        {/* Skill Level Badge */}
                        <div className="flex justify-center mb-4">
                          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(mentor.skill_level)}`}>
                            <LevelIcon className="w-3 h-3" />
                            <span className="capitalize">{mentor.skill_level || 'Intermediate'}</span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-yellow-500">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="font-bold text-gray-900 dark:text-white">
                                {mentor.average_rating?.toFixed(1) || '0.0'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
                          </div>
                          <div className="text-center border-x border-gray-200 dark:border-gray-600">
                            <div className="font-bold text-gray-900 dark:text-white">
                              {mentor.total_sessions || 0}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Sessions</p>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-gray-900 dark:text-white">
                              {mentor.total_students || 0}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Students</p>
                          </div>
                        </div>

                        {/* Hourly Rate */}
                        {mentor.hourly_rate && (
                          <div className="text-center mb-3">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                              ${mentor.hourly_rate}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400"> / hour</span>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                           <button
                            onClick={() => setFindMentorModal({ show: true, skill: skill.skill_name })}
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium text-sm flex items-center justify-center gap-2"
                            data-testid="find-mentor-button"
                          >
                            <Search className="w-4 h-4" />
                            Find Mentor
                          </button>
                          <button
                            onClick={() => {
                              setSelectedMentor(mentor);
                              setRequestModal(true);
                            }}
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2"
                            data-testid="request-session-button"
                          >
                            <Calendar className="w-4 h-4" />
                            Request
                          </button>
                          <button className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                            <MessageSquare className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-indigo-600" />
                          </button>
                          <button className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                            <Heart className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Add Skill Modal */}
        {showAddSkill && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddSkill(false)} data-testid="add-skill-modal">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="relative h-24 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl p-6">
                <div className="absolute inset-0 bg-black/20 rounded-t-2xl"></div>
                <div className="relative flex justify-between items-start">
                  <h2 className="text-2xl font-bold text-white">Add New Skill</h2>
                  <button
                    onClick={() => setShowAddSkill(false)}
                    className="p-2 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleAddSkill} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Skill Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., JavaScript, Photography"
                    value={newSkill.skill_name}
                    onChange={(e) => setNewSkill({ ...newSkill, skill_name: e.target.value })}
                    data-testid="skill-name-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Brief description of your skill..."
                    rows="3"
                    value={newSkill.description}
                    onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['offered', 'wanted'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewSkill({ ...newSkill, skill_type: type })}
                        className={`px-4 py-3 rounded-xl border-2 transition-all ${
                          newSkill.skill_type === type
                            ? type === 'offered'
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                              : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {type === 'offered' ? '📤 Can Teach' : '📥 Want to Learn'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Skill Level
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newSkill.skill_level}
                    onChange={(e) => setNewSkill({ ...newSkill, skill_level: e.target.value })}
                    data-testid="skill-level-select"
                  >
                    <option value="beginner">🌱 Beginner</option>
                    <option value="intermediate">📈 Intermediate</option>
                    <option value="advanced">🚀 Advanced</option>
                    <option value="expert">👑 Expert</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Years Experience
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., 5"
                      value={newSkill.years_experience}
                      onChange={(e) => setNewSkill({ ...newSkill, years_experience: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hourly Rate ($)
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., 50"
                      value={newSkill.hourly_rate}
                      onChange={(e) => setNewSkill({ ...newSkill, hourly_rate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddSkill(false)}
                    className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    data-testid="cancel-button"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                    data-testid="submit-skill-button"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Skill
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Skill Modal */}
        {showEditModal && editSkill && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="relative h-24 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl p-6">
                <div className="absolute inset-0 bg-black/20 rounded-t-2xl"></div>
                <div className="relative flex justify-between items-start">
                  <h2 className="text-2xl font-bold text-white">Edit Skill</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-2 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleEditSkill} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Skill Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={editSkill.skill_name}
                    onChange={(e) => setEditSkill({ ...editSkill, skill_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows="3"
                    value={editSkill.description || ''}
                    onChange={(e) => setEditSkill({ ...editSkill, description: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['offered', 'wanted'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setEditSkill({ ...editSkill, skill_type: type })}
                        className={`px-4 py-3 rounded-xl border-2 transition-all ${
                          editSkill.skill_type === type
                            ? type === 'offered'
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                              : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {type === 'offered' ? '📤 Can Teach' : '📥 Want to Learn'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Skill Level
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={editSkill.skill_level}
                    onChange={(e) => setEditSkill({ ...editSkill, skill_level: e.target.value })}
                  >
                    <option value="beginner">🌱 Beginner</option>
                    <option value="intermediate">📈 Intermediate</option>
                    <option value="advanced">🚀 Advanced</option>
                    <option value="expert">👑 Expert</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Years Experience
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={editSkill.years_experience || ''}
                      onChange={(e) => setEditSkill({ ...editSkill, years_experience: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hourly Rate ($)
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={editSkill.hourly_rate || ''}
                      onChange={(e) => setEditSkill({ ...editSkill, hourly_rate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Update Skill
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Session Request Modal */}
        {requestModal && selectedMentor && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setRequestModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="relative h-24 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl p-6">
                <div className="absolute inset-0 bg-black/20 rounded-t-2xl"></div>
                <div className="relative flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Request Session</h2>
                    <p className="text-indigo-100 text-sm">with {selectedMentor.full_name || selectedMentor.username}</p>
                  </div>
                  <button
                    onClick={() => setRequestModal(false)}
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
                    Skill
                  </label>
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white">
                    {selectedMentor.skill_name} ({selectedMentor.skill_level})
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={requestData.date}
                    onChange={(e) => setRequestData({ ...requestData, date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Time
                  </label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={requestData.time}
                    onChange={(e) => setRequestData({ ...requestData, time: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration (minutes)
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={requestData.duration}
                    onChange={(e) => setRequestData({ ...requestData, duration: parseInt(e.target.value) })}
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows="3"
                    placeholder="What would you like to learn? Any specific topics?"
                    value={requestData.message}
                    onChange={(e) => setRequestData({ ...requestData, message: e.target.value })}
                  ></textarea>
                </div>

                {/* Price Summary */}
                {selectedMentor.hourly_rate && (
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Hourly Rate:</span>
                      <span className="font-bold text-gray-900 dark:text-white">${selectedMentor.hourly_rate}/hr</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-2">
                      <span className="text-gray-600 dark:text-gray-400">Total for {requestData.duration}min:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        ${((selectedMentor.hourly_rate / 60) * requestData.duration).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setRequestModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestSession}
                    disabled={loading || !requestData.date || !requestData.time}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4" />
                        Send Request
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
 {/* Find Mentor Modal */}
      <FindMentorModal 
        isOpen={findMentorModal.show}
        onClose={() => setFindMentorModal({ show: false, skill: '' })}
        skillName={findMentorModal.skill}
      />

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

export default SkillMarketplace;