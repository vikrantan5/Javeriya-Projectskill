import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, User, Star, Award, MessageSquare, Loader2, Users, Eye, Sparkles } from 'lucide-react';
import { taskService } from '../services/apiService';
import UserProfileModal from './UserProfileModal';
import AIDecisionModal from './AIDecisionModal';

const TaskApplicantsModal = ({ task, isOpen, onClose, onApplicantAssigned }) => {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(null);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState(null);
  const [aiDecisionUser, setAIDecisionUser] = useState(null);

  useEffect(() => {
    if (isOpen && task?.id) {
      loadApplicants();
    }
  }, [isOpen, task]);

  const loadApplicants = async () => {
    setLoading(true);
    try {
      const data = await taskService.getTaskAcceptors(task.id);
      setApplicants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading applicants:', error);
      setApplicants([]);
    }
    setLoading(false);
  };

  const handleAssign = async (applicantUserId) => {

    setAssigning(applicantUserId);
    try {
      await taskService.assignTask(task.id, applicantUserId);
      
      if (onApplicantAssigned) {
        onApplicantAssigned();
      }
      
      onClose();
    } catch (error) {
      console.error('Error assigning task:', error);
      alert('Failed to assign task: ' + (error.response?.data?.detail || error.message));
    }
    setAssigning(null);
  };


  
  const handleViewProfile = (userId) => {
    setSelectedProfileUserId(userId);
  };

  const handleAskAI = (user) => {
    setAIDecisionUser(user);
  };

  const handleAIDecisionComplete = async (decision) => {
    // AI decision made, now ask for confirmation
    if (decision.decision === 'recommended') {
      if (window.confirm(`AI recommends this candidate with ${decision.confidence}% confidence. Proceed with assignment?`)) {
        await handleAssign(aiDecisionUser.id);
      }
    } else if (decision.decision === 'not_recommended') {
      if (window.confirm(`AI does NOT recommend this candidate (${decision.confidence}% confidence). Do you still want to assign?`)) {
        await handleAssign(aiDecisionUser.id);
      }
    } else {
      if (window.confirm(`AI gives a neutral assessment (${decision.confidence}% confidence). Proceed with assignment?`)) {
        await handleAssign(aiDecisionUser.id);
      }
    }
    setAIDecisionUser(null);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      data-testid="task-applicants-modal"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative h-24 bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
          <div className="absolute inset-0 bg-black/20 rounded-t-2xl"></div>
          <div className="relative flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-bold text-white">Task Applicants</h2>
              </div>
              <p className="text-indigo-100 text-sm">{task?.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition-colors"
              data-testid="close-applicants-modal"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading applicants...</p>
            </div>
          ) : applicants.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Applicants Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No one has applied for this task yet. Check back later!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {applicants.length} {applicants.length === 1 ? 'person has' : 'people have'} applied for this task
              </p>

              {applicants.map((applicant) => {
                const user = applicant.user;
                const isPending = applicant.status === 'pending';
                const isAssigned = applicant.status === 'assigned';
                const isRejected = applicant.status === 'rejected';

                return (
                  <div
                    key={applicant.id}
                    className={`border rounded-xl p-5 transition-all ${
                      isAssigned
                        ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700'
                        : isRejected
                        ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700'
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                    data-testid="applicant-card"
                  >
                    <div className="flex items-start gap-4">
                      {/* Profile Photo */}
                      <div className="flex-shrink-0">
                        {user?.profile_photo ? (
                          <img
                            src={user.profile_photo}
                            alt={user.full_name || user.username}
                            className="w-16 h-16 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                            {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                              {user?.full_name || user?.username || 'Unknown User'}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              @{user?.username || 'anonymous'}
                            </p>
                          </div>
                          
                          {/* Status Badge */}
                          {isAssigned && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Assigned
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-medium flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              Rejected
                            </span>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {user?.average_rating?.toFixed(1) || '0.0'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {user?.total_tasks_completed || 0} tasks completed
                            </span>
                          </div>
                        </div>

                        {/* Application Message */}
                        {applicant.message && (
                          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              "{applicant.message}"
                            </p>
                          </div>
                        )}

                        {/* Application Time */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                          Applied {new Date(applicant.accepted_at).toLocaleString()}
                        </p>

                        {/* Action Buttons */}
                        {isPending && (
                          <div className="flex flex-col gap-2">
                            {/* Primary Actions */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewProfile(user.id)}
                                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                                data-testid="view-profile-button"
                              >
                                <Eye className="w-4 h-4" />
                                View Profile
                              </button>
                              <button
                                onClick={() => handleAskAI(user)}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2"
                                data-testid="ask-ai-button"
                              >
                                <Sparkles className="w-4 h-4" />
                                Ask AI
                              </button>
                            </div>
                            {/* Assignment Button */}
                            <button
                              onClick={() => handleAskAI(user)}
                              disabled={assigning === user.id}
                              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2.5 rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-green-600/25 flex items-center justify-center gap-2"
                              data-testid="assign-applicant-button"
                            >
                              {assigning === user.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Assigning...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4" />
                                  Ask AI & Assign Task
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
           {/* Profile Modal */}
      <UserProfileModal
        userId={selectedProfileUserId}
        isOpen={!!selectedProfileUserId}
        onClose={() => setSelectedProfileUserId(null)}
      />

      {/* AI Decision Modal */}
      <AIDecisionModal
        taskId={task?.id}
        userId={aiDecisionUser?.id}
        userName={aiDecisionUser?.full_name || aiDecisionUser?.username}
        isOpen={!!aiDecisionUser}
        onClose={() => setAIDecisionUser(null)}
        onDecisionComplete={handleAIDecisionComplete}
      />
    </div>
  );
};

export default TaskApplicantsModal;
