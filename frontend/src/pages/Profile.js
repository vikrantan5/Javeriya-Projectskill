import React, { useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
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
  Crown
} from 'lucide-react';

const Profile = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    bio: user?.bio || 'Passionate learner and skill exchanger. Always excited to learn new technologies and help others grow.',
    location: user?.location || 'New York, USA',
    phone: user?.phone || '+1 234 567 8900',
    website: user?.website || 'https://portfolio.example.com',
    github: user?.github || 'github.com/username',
    twitter: user?.twitter || 'twitter.com/username',
    linkedin: user?.linkedin || 'linkedin.com/in/username',
    skills: user?.skills || ['React', 'JavaScript', 'Python', 'UI/UX', 'Node.js', 'MongoDB'],
    interests: user?.interests || ['Machine Learning', 'Web Development', 'Cloud Computing', 'Mobile Apps'],
    languages: user?.languages || ['English (Native)', 'Spanish (Intermediate)', 'French (Basic)'],
    education: user?.education || 'B.Tech in Computer Science',
    company: user?.company || 'Tech Innovators Inc.',
    jobTitle: user?.jobTitle || 'Senior Developer'
  });

  const fileInputRef = useRef(null);
  const [avatar, setAvatar] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  const handleSave = () => {
    alert('Profile updated successfully!');
    setIsEditing(false);
  };

  const handleCopyProfileLink = () => {
    navigator.clipboard.writeText(`https://talentconnect.com/profile/${user?.username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageUpload = (type, file) => {
    if (type === 'avatar') {
      setAvatar(URL.createObjectURL(file));
    } else {
      setCoverImage(URL.createObjectURL(file));
    }
  };

  const stats = [
    { icon: BookOpen, label: 'Sessions', value: user?.total_sessions || 128, color: 'blue', trend: '+12%' },
    { icon: Briefcase, label: 'Tasks', value: user?.total_tasks_completed || 45, color: 'green', trend: '+8%' },
    { icon: Star, label: 'Rating', value: user?.average_rating?.toFixed(1) || '4.8', suffix: '⭐', color: 'yellow', trend: '+0.2' },
    { icon: Users, label: 'Mentees', value: user?.total_mentees || 56, color: 'purple', trend: '+15%' },
  ];

  const achievements = [
    { icon: Trophy, title: 'Top Mentor', description: 'Rated #1 in Web Development', date: 'Mar 2024', color: 'yellow' },
    { icon: Medal, title: '100 Sessions', description: 'Completed 100 mentoring sessions', date: 'Feb 2024', color: 'purple' },
    { icon: Crown, title: 'Rising Star', description: 'Most active user of the month', date: 'Jan 2024', color: 'indigo' },
    { icon: Target, title: 'Skill Master', description: 'Mastered 10+ technologies', date: 'Dec 2023', color: 'green' },
  ];

  const recentActivity = [
    { type: 'session', title: 'React Advanced Workshop', user: 'John Doe', time: '2 hours ago', icon: BookOpen },
    { type: 'task', title: 'Frontend Development Task', user: 'Jane Smith', time: '5 hours ago', icon: Briefcase },
    { type: 'feedback', title: '5-star rating received', user: 'Mike Johnson', time: '1 day ago', icon: Star },
    { type: 'connection', title: 'New follower', user: 'Sarah Wilson', time: '2 days ago', icon: Users },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'skills', label: 'Skills & Expertise', icon: Brain },
    { id: 'activity', label: 'Activity', icon: TrendingUp },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30'}`} data-testid="profile-page">
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      
      {/* Settings Sidebar */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setShowSettings(false)}>
          <div className="absolute right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl p-6 animate-slide-left" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
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
      <div className="relative h-64 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        {coverImage && (
          <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-4 right-4 p-3 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white/30 transition-all"
        >
          <Camera className="w-5 h-5" />
        </button>
        
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={(e) => handleImageUpload('cover', e.target.files[0])}
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
                    className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white hover:bg-indigo-700 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  
                  {showAvatarMenu && (
                    <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload Photo
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
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
                <h1 className="text-3xl font-bold text-white">{user?.full_name || user?.username}</h1>
                {user?.is_verified && (
                  <BadgeCheck className="w-6 h-6 text-blue-400" />
                )}
                <span className="px-3 py-1 bg-green-500/20 backdrop-blur text-green-400 text-sm rounded-full border border-green-500/30">
                  PRO
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-white/80">
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
              className="p-3 bg-white/20 backdrop-blur rounded-xl text-white hover:bg-white/30 transition-all"
              title="Copy profile link"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
            
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-4 py-3 bg-white/20 backdrop-blur rounded-xl text-white hover:bg-white/30 transition-all"
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
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all group">
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
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
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
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
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
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
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
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
                {/* Skills */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Skills & Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {profileData.skills.map((skill, index) => (
                      <span key={index} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Languages</h3>
                  <div className="space-y-3">
                    {profileData.languages.map((lang, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <span className="text-gray-900 dark:text-white">{lang}</span>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interests */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {profileData.interests.map((interest, index) => (
                      <span key={index} className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-sm font-medium">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div key={index} className="flex items-start gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                          <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{activity.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">with {activity.user}</p>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-500">{activity.time}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="grid md:grid-cols-2 gap-4">
                {achievements.map((achievement, index) => {
                  const Icon = achievement.icon;
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
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Profile Completion */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Completion</h3>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200 dark:bg-indigo-900/30">
                      In Progress
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-indigo-600 dark:text-indigo-400">
                      75%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-indigo-200 dark:bg-indigo-900/30">
                  <div style={{ width: "75%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">Basic Info</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">Skills Added</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-700 dark:text-gray-300">Profile Picture</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-700 dark:text-gray-300">Verification</span>
                </div>
              </div>
            </div>

            {/* Connections */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Connections</h3>
                <span className="text-sm text-indigo-600 dark:text-indigo-400">View all</span>
              </div>
              
              <div className="space-y-3">
                {[1, 2, 3].map((_, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        JD
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">John Doe</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">React Developer</p>
                      </div>
                    </div>
                    <button className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Sessions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Sessions</h3>
              <div className="space-y-3">
                {[1, 2].map((_, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="font-medium text-gray-900 dark:text-white">React Workshop</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tomorrow, 3:00 PM</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">2 hours</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Connections */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Recommended for You
              </h3>
              
              <div className="space-y-3">
                {[1, 2].map((_, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">Sarah Wilson</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">UI/UX Designer</p>
                    </div>
                    <button className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors">
                      Connect
                    </button>
                  </div>
                ))}
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
    </div>
  );
};

export default Profile;