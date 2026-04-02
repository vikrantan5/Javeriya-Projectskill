import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { sessionService, ratingService } from '../services/apiService';
import RealtimeChat from '../components/RealtimeChat';
import UserProfileModal from '../components/UserProfileModal';
import RatingModal from '../components/RatingModal';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  User,
  Star,
  Award,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Calendar as CalendarIcon,
  ChevronRight,
  Filter,
  Search,
  RefreshCw,
  Download,
  MoreVertical,
  ExternalLink,
  MessageSquare,
  ThumbsUp,
  Share2,
  BookOpen,
  Users,
  Trophy,
  TrendingUp,
  Zap,
  Sparkles,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Phone,
  Mail,
  Link as LinkIcon,
  Copy,
  Check,
  Clock as ClockIcon,
  CalendarCheck,
  CalendarX,
  CalendarClock,
  Video as VideoIcon,
  MapPinned
} from 'lucide-react';

const SessionBooking = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('grid');
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
    const [meetingModal, setMeetingModal] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    provider: 'google_meet',
    date: '',
    time: '',
    duration_minutes: 60,
  });
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    scheduled: 0,
    cancelled: 0,
    pending: 0
  });


  const [showChat, setShowChat] = useState(false);
  const [chatSession, setChatSession] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingSessionData, setRatingSessionData] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      const newStats = {
        total: sessions.length,
        completed: sessions.filter(s => s.status === 'completed').length,
        scheduled: sessions.filter(s => s.status === 'scheduled').length,
        cancelled: sessions.filter(s => s.status === 'cancelled').length,
        pending: sessions.filter(s => s.status === 'pending').length
      };
      setStats(newStats);
    }
  }, [sessions]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      // Load both learning sessions and skill exchange sessions
      const [learningSessionsData, exchangeSessionsData] = await Promise.all([
        sessionService.getMySessions().catch(() => []),
        sessionService.getSkillExchangeSessions().catch(() => [])
      ]);
      
      // Normalize learning sessions
      const normalizedLearningSessions = Array.isArray(learningSessionsData)
        ? learningSessionsData.map((item) => {
            if (item?.session) {
              return {
                ...item.session,
                role: item.role,
                mentor_name: item.mentor?.full_name || item.mentor?.username,
                learner_name: item.learner?.full_name || item.learner?.username,
                session_type: 'learning'
              };
            }
            return { ...item, session_type: 'learning' };
          })
        : [];
      
      // Normalize skill exchange sessions
      const normalizedExchangeSessions = Array.isArray(exchangeSessionsData)
        ? exchangeSessionsData.map((item) => {
            const session = item.session || item;
            const otherParticipant = item.other_participant;
            const task = item.task;
            return {
              ...session,
              session_type: 'skill_exchange',
              other_participant_name: otherParticipant?.full_name || otherParticipant?.username,
              other_participant_photo: otherParticipant?.profile_photo,
              other_participant_id: otherParticipant?.id,
              skill_offered: task?.skill_offered,
              skill_requested: task?.skill_requested
            };
          })
        : [];
      
      // Combine both types of sessions
      const allSessions = [...normalizedLearningSessions, ...normalizedExchangeSessions];
      setSessions(allSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessions([]);
    }
    setLoading(false);
  };

  // Mark skill exchange session as complete - Updates leaderboard!
  const handleMarkComplete = async (session) => {
    try {
      setLoading(true);
      const result = await sessionService.markSessionComplete(session.id);
      
      toast.success(result.message);
      
      // Reload sessions to get updated status
      await loadSessions();
      
      // If both completed, show rating modal
      if (result.both_completed && result.can_rate) {
        setRatingSessionData({
          sessionId: session.id,
          receiverId: session.other_participant_id,
          receiverName: session.other_participant_name
        });
        setShowRatingModal(true);
      }
    } catch (error) {
      console.error('Error marking session complete:', error);
      toast.error(error.response?.data?.detail || 'Failed to mark session complete');
    } finally {
      setLoading(false);
    }
  };

  // Open rating modal for a completed session
  const handleRatePartner = (session) => {
    setRatingSessionData({
      sessionId: session.id,
      receiverId: session.other_participant_id,
      receiverName: session.other_participant_name
    });
    setShowRatingModal(true);
  };

  // Handle successful rating submission
  const handleRatingSuccess = () => {
    toast.success('Rating submitted successfully! Thank you for your feedback.');
    loadSessions(); // Reload to update any changes
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

   const openMeetingModal = (session) => {
    setSelectedSession(session);
    const scheduleDate = session?.scheduled_at ? new Date(session.scheduled_at) : null;
    setMeetingForm({
      provider: 'google_meet',
      date: scheduleDate ? scheduleDate.toISOString().slice(0, 10) : '',
      time: scheduleDate ? scheduleDate.toISOString().slice(11, 16) : '',
      duration_minutes: session?.duration_minutes || 60,
    });
    setMeetingModal(true);
  };

  const handleSaveMeetingLink = async () => {
    if (!selectedSession) return;
    setLoading(true);
    try {
      const generated = await sessionService.generateMeetingLink(
        meetingForm.provider,
        selectedSession.skill_name || 'TalentConnect Session'
      );

      const payload = {
        meeting_link: generated.meeting_link,
        duration_minutes: Number(meetingForm.duration_minutes || 60),
      };

      if (meetingForm.date && meetingForm.time) {
        payload.scheduled_at = new Date(`${meetingForm.date}T${meetingForm.time}:00`).toISOString();
      }

      await sessionService.updateSession(selectedSession.id, payload);
      setMeetingModal(false);
      await loadSessions();
    } catch (error) {
      console.error('Meeting link setup failed:', error);
    }
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return CheckCircle;
      case 'scheduled': return CalendarCheck;
      case 'cancelled': return CalendarX;
      default: return CalendarClock;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          text: 'text-green-600 dark:text-green-400',
          border: 'border-green-200 dark:border-green-800',
          icon: CheckCircle
        };
      case 'scheduled':
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          text: 'text-blue-600 dark:text-blue-400',
          border: 'border-blue-200 dark:border-blue-800',
          icon: CalendarCheck
        };
      case 'cancelled':
        return {
          bg: 'bg-red-100 dark:bg-red-900/30',
          text: 'text-red-600 dark:text-red-400',
          border: 'border-red-200 dark:border-red-800',
          icon: CalendarX
        };
      default:
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          text: 'text-yellow-600 dark:text-yellow-400',
          border: 'border-yellow-200 dark:border-yellow-800',
          icon: CalendarClock
        };
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (filter !== 'all' && session.status !== filter) return false;
    if (searchTerm) {
      return session.skill_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             session.mentor_name?.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const quickStats = [
    { label: 'Total Sessions', value: stats.total, icon: Calendar, color: 'indigo' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'green' },
    { label: 'Scheduled', value: stats.scheduled, icon: CalendarCheck, color: 'blue' },
    { label: 'Pending', value: stats.pending, icon: CalendarClock, color: 'yellow' },
  ];

  const upcomingSessions = sessions.filter(s => s.status === 'scheduled').slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-pink-100 to-purple-100 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950" data-testid="session-booking-page">
      <Navbar />
      
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200 dark:bg-indigo-500/20 rounded-full blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200 dark:bg-purple-500/20 rounded-full blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">My Sessions</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your learning sessions and track progress</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView(view === 'list' ? 'grid' : 'list')}
              className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              {view === 'list' ? 'Grid' : 'List'}
            </button>
            <button
              onClick={loadSessions}
              className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-gradient-to-br from-pink-200 via-rose-200 to-purple-200 dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-lg`}>
                    <Icon className={`w-5 h-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  </div>
                  <span className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Upcoming Sessions Banner */}
        {upcomingSessions.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 mb-8 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8" />
                <div>
                  <h3 className="text-lg font-semibold">Upcoming Sessions</h3>
                  <p className="text-indigo-100">You have {upcomingSessions.length} session(s) scheduled</p>
                </div>
              </div>
              <div className="flex gap-2">
                {upcomingSessions.map((session, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedSession(session);
                      setShowDetails(true);
                    }}
                    className="px-3 py-1 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-colors"
                  >
                    {new Date(session.scheduled_at).toLocaleDateString()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-gradient-to-br from-pink-200 via-rose-200 to-purple-200 dark:bg-gray-800 rounded-xl shadow-lg p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search sessions by skill or mentor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Sessions</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending">Pending</option>
              </select>
              
              <button className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              
              <button className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-200 via-rose-200 to-purple-200 dark:bg-gray-800 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="bg-gradient-to-br from-pink-200 via-rose-200 to-purple-200 dark:bg-gray-800 rounded-xl p-12 text-center shadow-lg" data-testid="no-sessions">
            <div className="w-24 h-24 mx-auto bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Sessions Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {searchTerm || filter !== 'all' 
                ? "No sessions match your search criteria. Try adjusting your filters."
                : "You don't have any sessions yet. Start by exploring mentors and booking your first session!"}
            </p>
            <div className="flex gap-3 justify-center">
              <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Browse Mentors
              </button>
              {searchTerm && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setFilter('all');
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={`grid ${view === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
            {filteredSessions.map((session) => {
              const StatusIcon = getStatusIcon(session.status);
              const statusColors = getStatusColor(session.status);
              
              return (
                <div
                  key={session.id}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                  data-testid="session-card"
                >
                  {/* Card Header */}
                  <div className="relative h-32 bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="relative flex justify-between items-start">
                      <div>
                        <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-white text-sm">
                          Session #{session.id.slice(0, 8)}
                        </span>
                      </div>
                      <button className="p-2 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition-colors">
                        <MoreVertical className="w-4 h-4 text-white" />
                      </button>
                    </div>
                    <div className="relative mt-2">
                      <h3 className="text-xl font-bold text-white mb-1">{session.skill_name}</h3>
                      <p className="text-indigo-100 text-sm">with {session.mentor_name || 'Mentor'}</p>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    {/* Status Badge */}
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium mb-4 ${statusColors.bg} ${statusColors.text} border ${statusColors.border}`}>
                      <StatusIcon className="w-3 h-3" />
                      <span className="capitalize">{session.status}</span>
                    </div>

                                       {/* Session Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-3 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          Duration: {session.meeting_duration_minutes || session.duration_minutes || 60} minutes
                        </span>
                      </div>
                      
                      {/* Meeting Date/Time Display - Fixed to show meeting_date */}
                      <div className="flex items-center gap-3 text-sm">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {session.meeting_date 
                            ? new Date(session.meeting_date).toLocaleString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : session.scheduled_at 
                              ? new Date(session.scheduled_at).toLocaleString()
                              : 'Not scheduled'}
                        </span>
                      </div>

                      {session.meeting_link && (
                        <div className="flex items-center gap-3 text-sm">
                          <VideoIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400 truncate flex-1">
                            {session.meeting_link}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyLink(session.meeting_link);
                            }}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                          </button>
                        </div>
                      )}
                      
                      {/* Meeting Topic Display */}
                      {session.meeting_topic && (
                        <div className="flex items-center gap-3 text-sm">
                          <BookOpen className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {session.meeting_topic}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                     <div className="flex gap-2 flex-wrap">
                      {/* View Profile Button */}
                      {/* <button
                        onClick={() => {
                          setSelectedUserId(session.mentor_id || session.learner_id);
                          setShowProfileModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        data-testid="view-profile-button"
                      >
                        <User className="w-4 h-4" />
                        View Profile
                      </button> */}
                      {session.meeting_link && session.status === 'scheduled' && (
                        <a
                          href={session.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <Video className="w-4 h-4" />
                          Join Meeting
                        </a>
                      )}
                       {selectedSession && !selectedSession.meeting_link && selectedSession.role === 'mentor' && (
                    <button
                      onClick={() => {
                        setShowDetails(false);
                        openMeetingModal(selectedSession);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      data-testid="details-set-meeting-link-button"
                    >
                      <LinkIcon className="w-5 h-5" />
                      Set Meeting Link
                    </button>
                  )}
                       {!session.meeting_link && session.role === 'mentor' && (
                        <button
                          onClick={() => openMeetingModal(session)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                          data-testid="session-set-meeting-link-button"
                        >
                          <LinkIcon className="w-4 h-4" />
                          Set Meeting Link
                        </button>
                      )}
                      
                      
                      <button
                        onClick={() => {
                          setSelectedSession(session);
                          setShowDetails(true);
                        }}
                        className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Details
                      </button>

                           {/* Mark as Complete button for skill exchange sessions */}
                      {session.session_type === 'skill_exchange' && session.status === 'scheduled' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkComplete(session);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          data-testid="mark-complete-button"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Mark Complete
                        </button>
                      )}

                      {/* Rate Partner button for completed sessions */}
                      {session.status === 'completed' && session.session_type === 'skill_exchange' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRatePartner(session);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                          data-testid="rate-partner-button"
                        >
                          <Star className="w-4 h-4" />
                          Rate Partner
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Session Details Modal */}
        {showDetails && selectedSession && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDetails(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="relative h-32 bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative flex justify-between items-start">
                  <div>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-white text-sm">
                      Session Details
                    </span>
                  </div>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-2 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
                <div className="relative mt-4">
                  <h3 className="text-2xl font-bold text-white">{selectedSession.skill_name}</h3>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Session Info */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                      Session Information
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Status</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedSession.status === 'completed' ? 'bg-green-100 text-green-600' :
                          selectedSession.status === 'scheduled' ? 'bg-blue-100 text-blue-600' :
                          selectedSession.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                          'bg-yellow-100 text-yellow-600'
                        }`}>
                          {selectedSession.status}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Duration</span>
                        <span className="text-gray-900 dark:text-white">{selectedSession.duration_minutes} minutes</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Scheduled</span>
                        <span className="text-gray-900 dark:text-white">
                          {selectedSession.scheduled_at ? new Date(selectedSession.scheduled_at).toLocaleString() : 'Not scheduled'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Created</span>
                        <span className="text-gray-900 dark:text-white">
                          {new Date(selectedSession.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mentor Info */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <User className="w-5 h-5 text-indigo-600" />
                      Mentor Information
                    </h4>
                    
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {selectedSession.mentor_name?.charAt(0) || 'M'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{selectedSession.mentor_name || 'Mentor'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">ID: {selectedSession.mentor_id?.slice(0, 8)}</p>
                      </div>
                    </div>

                    {selectedSession.meeting_link && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Meeting Link</p>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <LinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                            {selectedSession.meeting_link}
                          </span>
                          <button
                            onClick={() => handleCopyLink(selectedSession.meeting_link)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                          >
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  {selectedSession.meeting_link && selectedSession.status === 'scheduled' && (
                    <a
                      href={selectedSession.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Video className="w-5 h-5" />
                      Join Meeting
                    </a>
                  )}

                     {selectedSession && !selectedSession.meeting_link && selectedSession.role === 'mentor' && (
                    <button
                      onClick={() => {
                        setShowDetails(false);
                        openMeetingModal(selectedSession);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      data-testid="details-set-meeting-link-button"
                    >
                      <LinkIcon className="w-5 h-5" />
                      Set Meeting Link
                    </button>
                  )}
                  
                  
                  
                  <button className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Reschedule
                  </button>
                  
                  {selectedSession.status !== 'cancelled' && (
                    <button className="px-4 py-3 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
          {meetingModal && selectedSession && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setMeetingModal(false)} data-testid="meeting-link-setup-modal">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
              <div className="relative h-24 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl p-6">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="relative flex justify-between items-start">
                  <h2 className="text-2xl font-bold text-white">Set Meeting Link</h2>
                  <button onClick={() => setMeetingModal(false)} className="p-2 bg-white/20 rounded-lg">
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Provider</label>
                  <select
                    value={meetingForm.provider}
                    onChange={(e) => setMeetingForm({ ...meetingForm, provider: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900"
                    data-testid="meeting-provider-select"
                  >
                    <option value="google_meet">Google Meet</option>
                    <option value="zoom">Zoom</option>
                    <option value="webrtc">WebRTC Room</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Date</label>
                    <input
                      type="date"
                      value={meetingForm.date}
                      onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900"
                      data-testid="meeting-date-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Time</label>
                    <input
                      type="time"
                      value={meetingForm.time}
                      onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900"
                      data-testid="meeting-time-input"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setMeetingModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl"
                    data-testid="meeting-modal-cancel-button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMeetingLink}
                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                    data-testid="meeting-modal-save-button"
                  >
                    Save Link
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
      `}</style>


      {/* Chat Modal for Sessions */}
      {showChat && chatSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl h-[600px]">
            <RealtimeChat
              roomType="session"
              roomId={chatSession.id}
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showProfileModal && selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          isOpen={showProfileModal}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedUserId(null);
          }}
        />
      )}
        {/* Rating Modal - Shows after session completion */}
      {showRatingModal && ratingSessionData && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setRatingSessionData(null);
          }}
          sessionId={ratingSessionData.sessionId}
          receiverId={ratingSessionData.receiverId}
          receiverName={ratingSessionData.receiverName}
          onSuccess={handleRatingSuccess}
        />
      )}
    </div>
  );
};

export default SessionBooking;