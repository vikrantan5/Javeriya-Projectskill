import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import BrowseUsersModal from '../components/BrowseUsersModal';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  User,
  Mail,
  MapPin,
  Phone,
  Calendar,
  Edit2,
  Save,
  X,
  Camera,
  Award,
  Star,
  BookOpen,
  Briefcase,
  CheckCircle,
  Clock,
  Shield,
  Globe,
  Github,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  LogOut,
  Settings,
  Bell,
  Moon,
  Sun,
  Download,
  Upload,
  Copy,
  Check,
  AlertCircle,
  Trophy,
  Target,
  TrendingUp,
  Users,
  MessageSquare,
  Heart,
  Sparkles,
  BadgeCheck,
  Medal,
  GraduationCap,
  Brain,
  Rocket,
  Zap,
  Crown,
  Coins,
  FileText,
  Loader2
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Profile = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [profileData, setProfileData] = useState({
    full_name: '',
    bio: '',
    location: '',
    phone: '',
    website: '',
    github: '',
    twitter: '',
    linkedin: '',
    skills: [],
    interests: [],
    languages: [],
    education: '',
    company: '',
    jobTitle: ''
  });


   const [bankDetails, setBankDetails] = useState({
    account_number: '',
    ifsc_code: '',
    account_holder_name: '',
    bank_name: '',
    upi_id: '',
    preferred_payout_mode: 'bank_transfer'
  });
  const [userStats, setUserStats] = useState({
    total_sessions: 0,
    total_tasks_completed: 0,
    average_rating: 0,
    total_mentees: 0
  });
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [connections, setConnections] = useState([]);
  const [profileCompletion, setProfileCompletion] = useState({ completion_percentage: 0, missing_fields: [] });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [achievements, setAchievements] = useState([]);

  const coverInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const [avatar, setAvatar] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  
  // Trust Score & Token Balance
  const [trustScore, setTrustScore] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(null);
  const [tokenTransactions, setTokenTransactions] = useState([]);
  const [loadingTrust, setLoadingTrust] = useState(false);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeResult, setResumeResult] = useState(null);
  const [showBrowseUsers, setShowBrowseUsers] = useState(false);
  const [connectionRequests, setConnectionRequests] = useState([]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${BACKEND_URL}/api/users/me`, {
        full_name: profileData.full_name,
        bio: profileData.bio,
        location: profileData.location,
        phone: profileData.phone,
        website: profileData.website,
        github: profileData.github,
        twitter: profileData.twitter,
        linkedin: profileData.linkedin,
        company: profileData.company,
        job_title: profileData.jobTitle
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Profile updated successfully!');
      setIsEditing(false);
      loadProfileData();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile: ' + (error.response?.data?.detail || error.message));
    }
  };


  const handleSaveBankDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${BACKEND_URL}/api/users/me`, {
        bank_details: bankDetails
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Bank details saved successfully!');
      loadProfileData();
    } catch (error) {
      console.error('Error saving bank details:', error);
      alert('Failed to save bank details: ' + (error.response?.data?.detail || error.message));
    }
  };


  const handleCopyProfileLink = () => {
    navigator.clipboard.writeText(`https://talentconnect.com/profile/${user?.username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Fixed handleImageUpload function
  const handleImageUpload = async (type, file) => {
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size too large. Maximum size is 5MB.');
      return;
    }
    
    if (type === 'avatar') {
      setUploadingAvatar(true);
    } else {
      setUploadingCover(true);
    }
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      
      // Use correct endpoints
      const endpoint = type === 'avatar' 
        ? `${BACKEND_URL}/api/users/upload-profile-photo`
        : `${BACKEND_URL}/api/users/upload-background-photo`;
      
      console.log(`Uploading ${type} to:`, endpoint);
      
      const response = await axios.post(endpoint, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log(`${type} upload response:`, response.data);
      
      if (type === 'avatar') {
        setAvatar(response.data.photo_url);
        // Update profileData with new avatar URL
        setProfileData(prev => ({ ...prev, profile_photo: response.data.photo_url }));
      } else {
        setCoverImage(response.data.photo_url);
        setProfileData(prev => ({ ...prev, background_photo: response.data.photo_url }));
      }
      
      alert(response.data.message);
      
      // Reload profile data to ensure everything is synced
      await loadProfileData();
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      alert(`Failed to upload ${type}: ` + (error.response?.data?.detail || error.message));
    } finally {
      if (type === 'avatar') {
        setUploadingAvatar(false);
      } else {
        setUploadingCover(false);
      }
    }
  };

  // Load all data
  useEffect(() => {
    if (user?.id) {
      loadProfileData();
      loadTrustScore();
      loadTokenBalance();
      loadTokenTransactions();
      loadUpcomingSessions();
      loadConnections();
      loadProfileCompletion();
      loadConnectionRequests();
    }
  }, [user]);

  const loadProfileData = async () => {
    setLoadingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Profile data loaded:', response.data);
      
      const userData = response.data;
      setProfileData({
        full_name: userData.full_name || '',
        bio: userData.bio || '',
        location: userData.location || '',
        phone: userData.phone || '',
        website: userData.website || '',
        github: userData.github || '',
        twitter: userData.twitter || '',
        linkedin: userData.linkedin || '',
        skills: userData.skills || [],
        interests: userData.interests || [],
        languages: userData.languages || [],
        education: userData.education || '',
        company: userData.company || '',
        jobTitle: userData.job_title || ''
      });
      
      // Set avatar and cover image from backend
      if (userData.profile_photo) {
        console.log('Setting avatar from URL:', userData.profile_photo);
        setAvatar(userData.profile_photo);
      } else {
        setAvatar(null);
      }
      
      if (userData.background_photo) {
        console.log('Setting cover from URL:', userData.background_photo);
        setCoverImage(userData.background_photo);
      } else {
        setCoverImage(null);
      }
      
      // Load user stats from dedicated endpoint
      await loadUserStats();
      // Load dynamic activities
      await loadActivities();
      // Load dynamic achievements
      await loadAchievements();
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
    setLoadingProfile(false);
  };

  const loadUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/users/me/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserStats(response.data);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const loadUpcomingSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/users/upcoming-sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUpcomingSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Error loading upcoming sessions:', error);
    }
  };

  const loadConnections = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/users/connections`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConnections(response.data.connections || []);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const loadProfileCompletion = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/users/profile-completion`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileCompletion(response.data);
    } catch (error) {
      console.error('Error loading profile completion:', error);
    }
  };

  const loadTrustScore = async () => {
    setLoadingTrust(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/reputation/trust-score/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrustScore(response.data);
    } catch (error) {
      console.error('Error loading trust score:', error);
    }
    setLoadingTrust(false);
  };

  const loadTokenBalance = async () => {
    setLoadingTokens(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/users/token-balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTokenBalance(response.data);
    } catch (error) {
      console.error('Error loading token balance:', error);
    }
    setLoadingTokens(false);
  };

  const loadTokenTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/users/token-transactions?limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTokenTransactions(response.data.transactions || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/users/my-activities?limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentActivity(response.data.activities || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const loadAchievements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/users/achievements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAchievements(response.data.achievements || []);
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const loadConnectionRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/users/connection-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConnectionRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error loading connection requests:', error);
    }
  };

  const handleConnectionResponse = async (connectionId, accept) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/users/connections/respond/${connectionId}`, 
        { accept },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(`Connection request ${accept ? 'accepted' : 'rejected'}!`);
      loadConnectionRequests();
      loadConnections();
    } catch (error) {
      console.error('Error responding to connection request:', error);
      alert('Failed to respond to connection request');
    }
  };

  const handleResumeUpload = async (file) => {
    setUploadingResume(true);
    setResumeResult(null);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('auto_add', 'true');
      
      const response = await axios.post(`${BACKEND_URL}/api/skills/upload-resume`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setResumeResult(response.data);
      alert(`Resume uploaded! ${response.data.auto_add_result?.added_count || 0} skills added to your profile.`);

      // Reload profile data to refresh skills
      await loadProfileData();
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Failed to upload resume: ' + (error.response?.data?.detail || error.message));
    }
    setUploadingResume(false);
  };

  const getTrustBadge = (score) => {
    if (!score) return { label: 'New User', color: 'gray', icon: '⭐', bgGradient: 'from-gray-400 to-gray-500' };
    if (score >= 90) return { label: 'Gold Mentor', color: 'yellow', icon: '🏆', bgGradient: 'from-yellow-400 to-yellow-600' };
    if (score >= 75) return { label: 'Silver Mentor', color: 'gray', icon: '🥈', bgGradient: 'from-gray-300 to-gray-500' };
    if (score >= 60) return { label: 'Bronze Mentor', color: 'orange', icon: '🥉', bgGradient: 'from-orange-400 to-orange-600' };
    return { label: 'Aspiring Mentor', color: 'indigo', icon: '⭐', bgGradient: 'from-indigo-400 to-indigo-600' };
  };
  
  const stats = [
    { icon: BookOpen, label: 'Sessions', value: userStats.total_sessions, color: 'blue', trend: '+12%' },
    { icon: Briefcase, label: 'Tasks', value: userStats.total_tasks_completed, color: 'green', trend: '+8%' },
    { icon: Star, label: 'Rating', value: userStats.average_rating?.toFixed(1) || '0.0', suffix: '⭐', color: 'yellow', trend: '+0.2' },
    { icon: Users, label: 'Mentees', value: userStats.total_mentees, color: 'purple', trend: '+15%' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'skills', label: 'Skills & Expertise', icon: Brain },
    { id: 'payment', label: 'Payment Details', icon: Coins },
    { id: 'activity', label: 'Activity', icon: TrendingUp },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
  ];

  return (
    <div className={`min-h-screen  bg-gradient-to-br from-amber-100 via-pink-100 to-purple-100`} data-testid="profile-page">
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      
      {/* Settings Sidebar */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50  backdrop-blur-sm z-50" onClick={() => setShowSettings(false)}>
          <div className="absolute right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl p-6 animate-slide-left" onClick={e => e.stopPropagation()}>
            <div className="flex items-center bg-gradient-to-r from-amber-100 to-pink-100 justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h3>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300">Dark Mode</span>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="relative w-12 h-6 bg-gray-300 dark:bg-indigo-600 rounded-full transition-colors"
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${darkMode ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
              
              <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">Notifications</span>
              </button>
              
              <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">Privacy</span>
              </button>
              
              <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">Export Data</span>
              </button>
              
              <button 
                onClick={logout}
                className="w-full flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cover Image */}
      <div className="relative h-64 bg-gradient-to-br from-sky-200 via-cyan-200 to-teal-200 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        {coverImage && (
          <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        
        <button 
          onClick={() => coverInputRef.current?.click()}
          disabled={uploadingCover}
          className="absolute bottom-4 right-4 p-3 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white/30 transition-all disabled:opacity-50"
        >
          {uploadingCover ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
        </button>
        
        <input
          type="file"
          ref={coverInputRef}
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleImageUpload('cover', e.target.files[0]);
            }
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 pb-8">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-1">
                <div className="w-full h-full rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl font-bold text-indigo-600">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="absolute -bottom-2 -right-2">
                <div className="relative">
                  <button 
                    onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                    disabled={uploadingAvatar}
                    className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  </button>
                  
                  {showAvatarMenu && (
                    <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-10">
                      <input
                        type="file"
                        ref={avatarInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleImageUpload('avatar', e.target.files[0]);
                            setShowAvatarMenu(false);
                          }
                        }}
                      />
                      <button 
                        onClick={() => {
                          avatarInputRef.current?.click();
                          setShowAvatarMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Photo
                      </button>
                      <button 
                        onClick={() => {
                          setAvatar(null);
                          setShowAvatarMenu(false);
                          // Optionally call API to remove photo
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Remove Photo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="mb-4 md:mb-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-400 ">{user?.full_name || user?.username}</h1>
                {user?.is_verified && (
                  <BadgeCheck className="w-6 h-6 text-blue-400" />
                )}
                <span className="px-3 py-1 bg-green-500/20 backdrop-blur text-green-400 text-sm rounded-full border border-green-500/30">
                  PRO
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-gray-500">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  @{user?.username}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '2024'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4 md:mt-0">
            <button
              onClick={handleCopyProfileLink}
              className="p-3 bg-white/20 backdrop-blur  rounded-xl text-white hover:bg-white/30 transition-all"
              title="Copy profile link"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
            
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-br from-sky-200 via-red-200 to-teal-200 backdrop-blur rounded-xl text-white hover:bg-white/30 transition-all"
              data-testid="edit-profile-button"
            >
              {isEditing ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
              <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="p-3 bg-white/20 backdrop-blur rounded-xl text-white hover:bg-white/30 transition-all"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-gradient-to-br from-pink-200 via-rose-200 to-purple-200 dark:bg-gray-800 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-lg`}>
                    <Icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  </div>
                  <span className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                    {stat.trend}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}{stat.suffix || ''}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
              </div>
            );
          })}
        </div>

              {/* Trust Score & Token Balance Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Trust Score Card */}
          <div className="bg-gradient-to-br from-sky-200 via-red-200 to-teal-200 dark:bg-gray-800 rounded-2xl shadow-xl p-6" data-testid="trust-score-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                Trust Score
              </h3>
              <button onClick={loadTrustScore} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <Zap className={`w-4 h-4 text-indigo-600 ${loadingTrust ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {loadingTrust ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : trustScore ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {trustScore.trust_score || 0}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">out of 100</p>
                  </div>
                  <div className={`px-4 py-2 bg-gradient-to-r ${getTrustBadge(trustScore.trust_score).bgGradient} rounded-xl text-white text-center`}>
                    <div className="text-2xl mb-1">{getTrustBadge(trustScore.trust_score).icon}</div>
                    <div className="text-xs font-semibold">{getTrustBadge(trustScore.trust_score).label}</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Verified Skills</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{trustScore.stats?.verified_skills_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Response Rate</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{trustScore.stats?.response_rate || 0}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Sessions</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{trustScore.stats?.total_sessions || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Average Rating</span>
                    <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      {trustScore.stats?.average_rating?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-gray-500 py-8">No trust score data available</p>
            )}
          </div>

          {/* Token Balance Card */}
          <div className="bg-gradient-to-br from-indigo-400 to-purple-400 rounded-2xl shadow-xl p-6 text-white" data-testid="token-balance-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Coins className="w-5 h-5" />
                Skill Tokens
              </h3>
              <button onClick={loadTokenBalance} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <Zap className={`w-4 h-4 ${loadingTokens ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {loadingTokens ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : tokenBalance ? (
              <>
                <div className="mb-6">
                  <div className="text-5xl font-bold mb-2 flex items-center gap-2">
                    <Coins className="w-10 h-10" />
                    {tokenBalance.balance || 0}
                  </div>
                  <p className="text-indigo-100 text-sm">Available Balance</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                    <p className="text-xs text-indigo-100 mb-1">Total Earned</p>
                    <p className="text-xl font-bold">{tokenBalance.total_earned || 0}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-3">
                    <p className="text-xs text-indigo-100 mb-1">Total Spent</p>
                    <p className="text-xl font-bold">{tokenBalance.total_spent || 0}</p>
                  </div>
                </div>
                
               <div className="bg-white/10 backdrop-blur rounded-xl p-3 mb-4">
                  <p className="text-xs text-indigo-100 mb-2">Recent Transactions</p>
                  {tokenTransactions.length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {tokenTransactions.slice(0, 3).map((tx, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-white/90">{tx.reason?.replace(/_/g, ' ')}</span>
                          <span className={`font-semibold ${tx.transaction_type === 'earn' ? 'text-green-300' : 'text-red-300'}`}>
                            {tx.transaction_type === 'earn' ? '+' : '-'}{tx.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/70">No transactions yet</p>
                  )}
                </div>
                <a
                  href="/wallet"
                  className="block w-full px-4 py-2 bg-white text-indigo-600 rounded-xl font-semibold text-center hover:bg-indigo-50 transition-colors"
                  data-testid="view-all-transactions-link"
                >
                  View All Transactions
                </a>
              </>
            ) : (
              <p className="text-center text-white/70 py-8">No token data available</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center bg-gradient-to-br from-red-200 via-blue-200 to-yellow-200 gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Bio Card */}
                <div className="bg-gradient-to-br from-sky-200 via-red-200 to-teal-200 dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">About Me</h3>
                  </div>
                  
                  {isEditing ? (
                    <textarea
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                      rows="4"
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      data-testid="bio-input"
                    />
                  ) : (
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {profileData.bio}
                    </p>
                  )}
                </div>

                {/* Personal Info */}
                <div className="bg-gradient-to-br from-sky-200 via-red-200 to-teal-200 dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { icon: User, label: 'Full Name', value: profileData.full_name, key: 'full_name' },
                      { icon: MapPin, label: 'Location', value: profileData.location, key: 'location' },
                      { icon: Phone, label: 'Phone', value: profileData.phone, key: 'phone' },
                      { icon: Globe, label: 'Website', value: profileData.website, key: 'website' },
                      { icon: Briefcase, label: 'Company', value: profileData.company, key: 'company' },
                      { icon: Award, label: 'Job Title', value: profileData.jobTitle, key: 'jobTitle' },
                    ].map((field, index) => {
                      const Icon = field.icon;
                      return (
                        <div key={index} className="flex items-start gap-3">
                          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400">{field.label}</p>
                            {isEditing ? (
                              <input
                                type="text"
                                className="w-full px-3 py-1 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                                value={profileData[field.key]}
                                onChange={(e) => setProfileData({ ...profileData, [field.key]: e.target.value })}
                              />
                            ) : (
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{field.value}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Social Links */}
                <div className="bg-gradient-to-br from-sky-200 via-red-200 to-teal-200 dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Social Links</h3>
                  <div className="space-y-3">
                    {[
                      { icon: Github, label: 'GitHub', value: profileData.github, color: 'gray' },
                      { icon: Twitter, label: 'Twitter', value: profileData.twitter, color: 'blue' },
                      { icon: Linkedin, label: 'LinkedIn', value: profileData.linkedin, color: 'indigo' },
                    ].map((social, index) => {
                      const Icon = social.icon;
                      return (
                        <div key={index} className="flex items-center gap-3">
                          <div className={`p-2 bg-${social.color}-100 dark:bg-${social.color}-900/30 rounded-lg`}>
                            <Icon className={`w-4 h-4 text-${social.color}-600 dark:text-${social.color}-400`} />
                          </div>
                          {isEditing ? (
                            <input
                              type="text"
                              className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                              value={social.value}
                              onChange={(e) => setProfileData({ ...profileData, [social.label.toLowerCase()]: e.target.value })}
                            />
                          ) : (
                            <a href={`https://${social.value}`} target="_blank" rel="noopener noreferrer" 
                               className="flex-1 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                              {social.value}
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {isEditing && (
                  <button
                    onClick={handleSave}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                    data-testid="save-profile-button"
                  >
                    <Save className="w-5 h-5" />
                    Save Changes
                  </button>
                )}
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="space-y-6">
                   {/* Resume Upload Card */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl p-6 text-white" data-testid="resume-upload-card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                        <FileText className="w-6 h-6" />
                        Upload Resume → Auto Import Skills
                      </h3>
                      <p className="text-purple-100 text-sm">Upload your resume (PDF/DOCX) and we'll automatically extract and add your skills</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <input
                      type="file"
                      ref={resumeInputRef}
                      className="hidden"
                      accept=".pdf,.docx,.doc"
                      onChange={(e) => e.target.files?.[0] && handleResumeUpload(e.target.files[0])}
                    />
                    <button
                      onClick={() => resumeInputRef.current?.click()}
                      disabled={uploadingResume}
                      className="flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-all disabled:opacity-50"
                      data-testid="upload-resume-button"
                    >
                      {uploadingResume ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          Upload Resume
                        </>
                      )}
                    </button>
                  </div>
                  
                  {resumeResult && (
                    <div className="mt-4 bg-white/10 backdrop-blur rounded-xl p-4">
                      <p className="font-semibold mb-2">✅ Resume processed successfully!</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-purple-100">Skills Found: {resumeResult.parse_result?.total_skills_found || 0}</p>
                          <p className="text-purple-100">Skills Added: {resumeResult.auto_add_result?.added_count || 0}</p>
                        </div>
                        <div>
                          <p className="text-purple-100">Already Had: {resumeResult.auto_add_result?.skipped_count || 0}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                                {/* Skills */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Skills & Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {profileData.skills && profileData.skills.length > 0 ? (
                      profileData.skills.map((skill, index) => (
                        <span key={index} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg text-sm font-medium">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No skills added yet. Upload your resume to automatically add skills!</p>
                    )}
                  </div>
                </div>

                {/* Languages */}
                {/* <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Languages</h3>
                  <div className="space-y-3">
                    {profileData.languages.map((lang, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-gray-900 dark:text-white">{lang}</span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    ))}
                  </div>
                </div> */}

                {/* Interests */}
                {/* <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {profileData.interests.map((interest, index) => (
                      <span key={index} className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-sm font-medium">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div> */}
              </div>
            )}
                        {activeTab === 'payment' && (
              <div className="space-y-6">
                {/* Payment Mode Indicator */}
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertCircle className="w-6 h-6" />
                    <h3 className="text-xl font-bold">Payment Mode: TEST</h3>
                  </div>
                  <p className="text-yellow-100 text-sm">
                    Currently, all transactions are in TEST mode. No real money will be transferred.
                    Bank details are optional but required when switching to PRODUCTION mode.
                  </p>
                </div>

                {/* Bank Details Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bank Account Details</h3>
                    <span className="text-xs px-3 py-1 bg-blue-100 text-blue-600 rounded-full">
                      For Production Payouts
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Account Holder Name *
                      </label>
                      <input
                        type="text"
                        value={bankDetails.account_holder_name}
                        onChange={(e) => setBankDetails({ ...bankDetails, account_holder_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter account holder name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Account Number *
                      </label>
                      <input
                        type="text"
                        value={bankDetails.account_number}
                        onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter account number"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          IFSC Code *
                        </label>
                        <input
                          type="text"
                          value={bankDetails.ifsc_code}
                          onChange={(e) => setBankDetails({ ...bankDetails, ifsc_code: e.target.value.toUpperCase() })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                          placeholder="IFSC Code"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          value={bankDetails.bank_name}
                          onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                          placeholder="Bank Name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        UPI ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={bankDetails.upi_id}
                        onChange={(e) => setBankDetails({ ...bankDetails, upi_id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        placeholder="yourname@upi"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Preferred Payout Mode
                      </label>
                      <select
                        value={bankDetails.preferred_payout_mode}
                        onChange={(e) => setBankDetails({ ...bankDetails, preferred_payout_mode: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="upi">UPI</option>
                      </select>
                    </div>

                    <button
                      onClick={handleSaveBankDetails}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      Save Bank Details
                    </button>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Secure & Encrypted</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Your bank details are encrypted and stored securely. They will only be used for processing payouts when you complete tasks or sessions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'activity' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => {
                      // Map icon name string to actual icon component
                      const iconMap = {
                        'BookOpen': BookOpen,
                        'Briefcase': Briefcase,
                        'Star': Star,
                        'Users': Users
                      };
                      const Icon = iconMap[activity.icon] || BookOpen;
                      
                      // Format time
                      const timeAgo = activity.time ? new Date(activity.time).toLocaleString() : 'Recently';
                      
                      return (
                        <div key={index} className="flex items-start gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{activity.title}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">with {activity.user}</p>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-500">{timeAgo}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">No recent activity</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="grid md:grid-cols-2 gap-4">
                {achievements.length > 0 ? (
                  achievements.map((achievement, index) => {
                    // Map icon name string to actual icon component
                    const iconMap = {
                      'Trophy': Trophy,
                      'Medal': Medal,
                      'Crown': Crown,
                      'Target': Target,
                      'Rocket': Rocket
                    };
                    const Icon = iconMap[achievement.icon] || Trophy;
                    
                    return (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`p-3 bg-${achievement.color}-100 dark:bg-${achievement.color}-900/30 rounded-xl`}>
                            <Icon className={`w-6 h-6 text-${achievement.color}-600 dark:text-${achievement.color}-400`} />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{achievement.date}</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{achievement.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{achievement.description}</p>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">Keep learning and earning achievements!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
                       {/* Profile Completion */}
            <div className="bg-gradient-to-br from-sky-200 via-red-200 to-teal-200 dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Completion</h3>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200 dark:bg-indigo-900/30">
                      {profileCompletion.completion_percentage === 100 ? 'Complete' : 'In Progress'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-indigo-600 dark:text-indigo-400">
                      {profileCompletion.completion_percentage}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-indigo-200 dark:bg-indigo-900/30">
                  <div style={{ width: `${profileCompletion.completion_percentage}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className={`w-4 h-4 ${profileCompletion.missing_fields?.includes('Basic Info') ? 'text-gray-400' : 'text-green-500'}`} />
                  <span className="text-gray-700 dark:text-gray-300">Basic Info</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className={`w-4 h-4 ${profileCompletion.missing_fields?.includes('Skills Added') ? 'text-gray-400' : 'text-green-500'}`} />
                  <span className="text-gray-700 dark:text-gray-300">Skills Added</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {profileCompletion.missing_fields?.includes('Profile Picture') ? (
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  <span className="text-gray-700 dark:text-gray-300">Profile Picture</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {profileCompletion.missing_fields?.includes('Verification') ? (
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  <span className="text-gray-700 dark:text-gray-300">Verification</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {profileCompletion.missing_fields?.includes('Connections') ? (
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  <span className="text-gray-700 dark:text-gray-300">Connections</span>
                </div>
              </div>
            </div>
            
            {/* Connection Requests */}
            {connectionRequests.length > 0 && (
              <div className="bg-gradient-to-br from-sky-200 via-red-200 to-teal-200 dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Connection Requests</h3>
                <div className="space-y-3">
                  {connectionRequests.slice(0, 3).map((request) => (
                    <div key={request.connection_id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                          {request.sender.profile_photo ? (
                            <img src={request.sender.profile_photo} alt={request.sender.username} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            request.sender.username?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {request.sender.full_name || request.sender.username}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">@{request.sender.username}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleConnectionResponse(request.connection_id, true)}
                          className="flex-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleConnectionResponse(request.connection_id, false)}
                          className="flex-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
                       {/* Connections */}
            {/* <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Connections</h3>
                <button
                  onClick={() => setShowBrowseUsers(true)}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                >
                  Browse Users
                </button>
              </div>
              
              <div className="space-y-3">
                {connections.length > 0 ? (
                  connections.slice(0, 3).map((connection, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {connection.profile_photo ? (
                            <img src={connection.profile_photo} alt={connection.username} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            connection.username?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{connection.full_name || connection.username}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{connection.primary_skill}</p>
                        </div>
                      </div>
                      <button className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No connections yet</p>
                    <button
                      onClick={() => setShowBrowseUsers(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Find Connections
                    </button>
                  </div>
                )}
              </div>
            </div> */}

                       {/* Upcoming Sessions */}
            <div className="bg-gradient-to-br from-sky-200 via-red-200 to-teal-200 dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Sessions</h3>
              <div className="space-y-3">
                {upcomingSessions.length > 0 ? (
                  upcomingSessions.slice(0, 2).map((session, index) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        {session.other_user?.profile_photo && (
                          <img 
                            src={session.other_user.profile_photo} 
                            alt={session.other_user.username} 
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{session.title}</p>
                          {session.other_user && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              with {session.other_user.full_name || session.other_user.username}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {session.scheduled_at ? new Date(session.scheduled_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }) : 'Date TBD'}
                      </p>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">{session.duration_minutes || 60} minutes</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No upcoming sessions</p>
                )}
              </div>
            </div>

            {/* Recommended Connections */}
            <div className="bg-gradient-to-br from-sky-200 via-red-200 to-teal-200 dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Recommended for You
              </h3>
              
              <div className="space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Browse users to find recommended connections
                </p>
                <button
                  onClick={() => setShowBrowseUsers(true)}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Browse Users
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-left {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-left {
          animation: slide-left 0.3s ease-out forwards;
        }
      `}</style>
       {/* Browse Users Modal */}
      <BrowseUsersModal 
        isOpen={showBrowseUsers} 
        onClose={() => {
          setShowBrowseUsers(false);
          loadConnections();
          loadConnectionRequests();
        }} 
      />
    </div>
  );
};

export default Profile;