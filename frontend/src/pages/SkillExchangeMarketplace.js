import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import RealtimeChat from '../components/RealtimeChat';
import UserProfileModal from '../components/UserProfileModal';
import { taskService, sessionService } from '../services/apiService';
import { ArrowLeftRight, Plus, RefreshCw, CheckCircle, AlertCircle, MessageSquare, Calendar, X, User } from 'lucide-react';

const initialForm = {
  skill_offered: '',
  skill_requested: '',
  description: '',
};

const SkillExchangeMarketplace = () => {
    const { user } = useAuth();
    const getErrorMessage = (error, fallbackMessage) => {
    const detail = error?.response?.data?.detail;

    if (Array.isArray(detail)) {
      const joined = detail
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && item.msg) return item.msg;
          return null;
        })
        .filter(Boolean)
        .join(' | ');

      return joined || fallbackMessage;
    }

    if (typeof detail === 'string') return detail;
    if (detail && typeof detail === 'object') {
      return detail.msg || fallbackMessage;
    }

    if (typeof error?.message === 'string' && error.message.trim()) {
      return error.message;
    }

    return fallbackMessage;
  };
  const [marketplaceTasks, setMarketplaceTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('marketplace');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });


   // Chat and Meeting states
  const [showChat, setShowChat] = useState(false);
  const [chatTask, setChatTask] = useState(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingTask, setMeetingTask] = useState(null);
  const [meetingForm, setMeetingForm] = useState({
    meeting_date: '',
    meeting_topic: '',
   meeting_duration_minutes: 60,
    meeting_link: ''  // Add Google Meet link field
  });


    const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const showToast = (message, type = 'success') => {
    const safeMessage = typeof message === 'string' ? message : String(message ?? 'Unexpected error');
     setToast({ show: true, message: safeMessage, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [marketData, mineData] = await Promise.all([
        taskService.getSkillExchangeTasks('open'),
        taskService.getMySkillExchangeTasks(),
      ]);
      setMarketplaceTasks(Array.isArray(marketData) ? marketData : []);
      setMyTasks(Array.isArray(mineData) ? mineData : []);
    } catch (error) {
     showToast(getErrorMessage(error, 'Failed to load exchange tasks'), 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await taskService.createSkillExchangeTask(form);
      setForm(initialForm);
      showToast('Skill exchange task created successfully');
      await loadData();
      setActiveTab('my');
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to create exchange task'), 'error');
    }
    setLoading(false);
  };

  const handleAccept = async (taskId) => {
    setLoading(true);
    try {
      await taskService.acceptSkillExchangeTask(taskId);
      showToast('Exchange matched successfully');
      await loadData();
    } catch (error) {
     showToast(getErrorMessage(error, 'Unable to accept exchange task'), 'error');
    }
    setLoading(false);
  };


  const handleOpenChat = (task) => {
    setChatTask(task);
    setShowChat(true);
  };

  const handleOpenMeeting = (task) => {
    setMeetingTask(task);
    setMeetingForm({
      meeting_date: '',
      meeting_topic: `${task.skill_offered} ↔ ${task.skill_requested} Session`,
      meeting_duration_minutes: 60,
      meeting_link: ''  // Reset Google Meet link
    });
    setShowMeetingModal(true);
  };

  const handleScheduleMeeting = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sessionService.createSkillExchangeSession(
        meetingTask.id,
        meetingForm.meeting_date,
        meetingForm.meeting_topic,
        meetingForm.meeting_duration_minutes,
        meetingForm.meeting_link  // Pass Google Meet link
      );
      showToast('Meeting scheduled successfully!');
      setShowMeetingModal(false);
      setMeetingTask(null);
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to schedule meeting'), 'error');
    }
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-pink-100 to-purple-100 dark:from-gray-900 dark:via-sky-950 dark:to-emerald-950" data-testid="skill-exchange-page">
      <Navbar />

      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-lg text-white flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`} data-testid="skill-exchange-toast">
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white" data-testid="exchange-page-title">Skill Exchange Marketplace</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Create exact swap listings: I teach X, I want Y.</p>
          </div>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            data-testid="exchange-refresh-button"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleCreate} className="lg:col-span-1 bg-gradient-to-br from-pink-200 via-rose-200 to-purple-200 dark:bg-gray-800 rounded-2xl p-6 shadow-lg space-y-4" data-testid="exchange-create-form">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Exchange Task
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skill You Offer</label>
              <input
                value={form.skill_offered}
                onChange={(e) => setForm({ ...form, skill_offered: e.target.value })}
                className="w-full px-4 py-2 border rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                placeholder="Python"
                required
                data-testid="exchange-offered-skill-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skill You Want</label>
              <input
                value={form.skill_requested}
                onChange={(e) => setForm({ ...form, skill_requested: e.target.value })}
                className="w-full px-4 py-2 border rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                placeholder="Flutter"
                required
                data-testid="exchange-requested-skill-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                placeholder="I can teach loops, APIs, and projects. Need Flutter basics in return."
                data-testid="exchange-description-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 text-white font-medium disabled:opacity-50"
              data-testid="exchange-create-submit-button"
            >
              <ArrowLeftRight className="w-4 h-4" />
              Publish Exchange
            </button>
          </form>

          <div className="lg:col-span-2 bg-gradient-to-br from-pink-200 via-rose-200 to-purple-200 dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-3">
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`px-4 py-2 rounded-lg ${activeTab === 'marketplace' ? 'bg-sky-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                data-testid="exchange-marketplace-tab"
              >
                Marketplace
              </button>
              <button
                onClick={() => setActiveTab('my')}
                className={`px-4 py-2 rounded-lg ${activeTab === 'my' ? 'bg-sky-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                data-testid="exchange-my-tab"
              >
                My Listings
              </button>
            </div>

            {loading ? (
              <div className="text-gray-500" data-testid="exchange-loading-state">Loading...</div>
            ) : (
              <div className="space-y-4" data-testid="exchange-task-list">
                {(activeTab === 'marketplace' ? marketplaceTasks : myTasks).length === 0 ? (
                  <div className="p-8 text-center text-gray-500" data-testid="exchange-empty-state">
                    No exchange tasks found.
                  </div>
                ) : (
                                    (activeTab === 'marketplace' ? marketplaceTasks : myTasks).map((item) => {
                    const exchangeTask = item.task || item;
                    const creator = item.creator;
                    const isMatched = exchangeTask.status === 'matched';
                    const isMyTask = exchangeTask.creator_id === user?.id;
                    return (
                      <div key={exchangeTask.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4" data-testid="exchange-task-card">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-xs uppercase text-gray-500 mb-2" data-testid="exchange-task-status">{exchangeTask.status}</p>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white" data-testid="exchange-skill-pair">
                              {exchangeTask.skill_offered} ↔ {exchangeTask.skill_requested}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1" data-testid="exchange-description-text">{exchangeTask.description || 'No description provided.'}</p>
                            {creator && (
                              <p className="text-xs text-gray-500 mt-2" data-testid="exchange-creator-text">
                                by {creator.full_name || creator.username}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2">
                              {/* View Profile Button - Always show for other users */}
                          {creator && !isMyTask && (
                            <button
                              onClick={() => {
                                setSelectedUserId(creator.id || exchangeTask.creator_id);
                                setShowProfileModal(true);
                              }}
                              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2 whitespace-nowrap"
                              data-testid="exchange-view-profile-button"
                            >
                              <User className="w-4 h-4" />
                              View Profile
                            </button>
                          )}
  {activeTab === 'marketplace' && exchangeTask.status === 'open' && !isMyTask && (
                              <button
                                onClick={() => handleAccept(exchangeTask.id)}
                                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 whitespace-nowrap"
                                data-testid="exchange-accept-button"
                              >
                                Accept Match
                              </button>
                            )}
                            
                             {isMatched && (
                              <>
                                <button
                                  onClick={() => handleOpenChat(exchangeTask)}
                                  className="px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 flex items-center gap-2 whitespace-nowrap"
                                  data-testid="exchange-chat-button"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  Chat
                                </button>
                                <button
                                  onClick={() => handleOpenMeeting(exchangeTask)}
                                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2 whitespace-nowrap"
                                  data-testid="exchange-schedule-button"
                                >
                                  <Calendar className="w-4 h-4" />
                                  Schedule
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
         {/* Chat Modal for Skill Exchange */}
      {showChat && chatTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-testid="exchange-chat-modal">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl h-[600px]">
            <RealtimeChat
              roomType="task"
              roomId={chatTask.id}
              onClose={() => setShowChat(false)}
            />
          </div>
        </div>
      )}

      {/* Meeting Scheduling Modal */}
      {showMeetingModal && meetingTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowMeetingModal(false)} data-testid="exchange-meeting-modal">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="relative h-24 bg-gradient-to-r from-indigo-600 to-sky-600 rounded-t-2xl p-6">
              <div className="absolute inset-0 bg-black/20 rounded-t-2xl"></div>
              <div className="relative flex justify-between items-start">
                <h2 className="text-2xl font-bold text-white">Schedule Meeting</h2>
                <button
                  onClick={() => setShowMeetingModal(false)}
                  className="p-2 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition-colors"
                  data-testid="meeting-modal-close"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleScheduleMeeting} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Meeting Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={meetingForm.meeting_date}
                  onChange={(e) => setMeetingForm({ ...meetingForm, meeting_date: e.target.value })}
                  data-testid="meeting-date-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Meeting Topic *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={meetingForm.meeting_topic}
                  onChange={(e) => setMeetingForm({ ...meetingForm, meeting_topic: e.target.value })}
                  data-testid="meeting-topic-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (minutes)
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={meetingForm.meeting_duration_minutes}
                  onChange={(e) => setMeetingForm({ ...meetingForm, meeting_duration_minutes: parseInt(e.target.value) })}
                  data-testid="meeting-duration-select"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>120 minutes</option>
                </select>
              </div>

              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Google Meet Link *
                </label>
                <input
                  type="url"
                  required
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  value={meetingForm.meeting_link}
                  onChange={(e) => setMeetingForm({ ...meetingForm, meeting_link: e.target.value })}
                  data-testid="meeting-link-input"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Create a Google Meet link and paste it here
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMeetingModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  data-testid="meeting-cancel-button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-sky-600 text-white px-4 py-3 rounded-xl hover:from-indigo-700 hover:to-sky-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                  data-testid="meeting-schedule-button"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      Schedule Meeting
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                📅 After scheduling, you can use Google Meet or any other platform for your session.
              </p>
            </form>
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
    </div>
  );
};

export default SkillExchangeMarketplace;