import React, { useState } from 'react';
import { X, Sparkles, TrendingUp, Star, CheckCircle, AlertCircle, Loader2, Brain, Award, Clock, Target } from 'lucide-react';
import api from '../services/api';

const AIDecisionModal = ({ taskId, userId, userName, isOpen, onClose, onDecisionComplete }) => {
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState(null);
  const [error, setError] = useState(null);

  const getAIDecision = async () => {
    setLoading(true);
    setError(null);
    setDecision(null);

    try {
      const response = await api.post('/api/ai/assignment-decision', {
        task_id: taskId,
        user_id: userId
      });
      setDecision(response.data);
    } catch (err) {
      console.error('Error getting AI decision:', err);
       
      // Handle different error formats
      let errorMessage = 'Failed to get AI recommendation';
      
      if (err.response?.data) {
        const errorData = err.response.data;
        
        // Handle Pydantic validation errors (array of error objects)
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(e => 
            typeof e === 'object' ? e.msg || JSON.stringify(e) : e
          ).join(', ');
        } 
        // Handle string error message
        else if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        }
        // Handle object error
        else if (typeof errorData.detail === 'object') {
          errorMessage = JSON.stringify(errorData.detail);
        }
      }
      
      setError(errorMessage);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    if (isOpen && taskId && userId && !decision && !loading) {
      getAIDecision();
    }
  }, [isOpen, taskId, userId]);

  const handleClose = () => {
    setDecision(null);
    setError(null);
    onClose();
  };

  const handleProceed = () => {
    if (onDecisionComplete) {
      onDecisionComplete(decision);
    }
    handleClose();
  };

  if (!isOpen) return null;

  const getDecisionColor = (decisionType) => {
    switch (decisionType) {
      case 'recommended':
        return {
          bg: 'from-green-500 to-emerald-500',
          text: 'text-green-700 dark:text-green-400',
          bgLight: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          icon: CheckCircle
        };
      case 'not_recommended':
        return {
          bg: 'from-red-500 to-rose-500',
          text: 'text-red-700 dark:text-red-400',
          bgLight: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          icon: AlertCircle
        };
      default:
        return {
          bg: 'from-yellow-500 to-orange-500',
          text: 'text-yellow-700 dark:text-yellow-400',
          bgLight: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          icon: AlertCircle
        };
    }
  };

  const decisionColors = decision ? getDecisionColor(decision.decision) : null;
  const DecisionIcon = decisionColors?.icon;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
      data-testid="ai-decision-modal"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`relative h-24 bg-gradient-to-r ${decisionColors?.bg || 'from-indigo-600 to-purple-600'} p-6`}>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Assignment Recommendation</h2>
                <p className="text-white/90 text-sm mt-1">for {userName}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition-colors"
              data-testid="close-ai-decision-modal"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">Analyzing candidate...</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Evaluating skills, history, and reliability
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Error Getting Recommendation
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={getAIDecision}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : decision ? (
            <div>
              {/* Decision Badge */}
              <div className={`${decisionColors.bgLight} ${decisionColors.border} border-2 rounded-xl p-6 mb-6`}>
                <div className="flex items-center gap-3 mb-3">
                  <DecisionIcon className={`w-8 h-8 ${decisionColors.text}`} />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                      {decision.decision.replace('_', ' ')}
                    </h3>
                    <p className={`text-sm ${decisionColors.text} font-medium`}>
                      Confidence Score: {decision.confidence}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Score Breakdown</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Skill Match
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {decision.breakdown.skill_match_score}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                        style={{ width: `${decision.breakdown.skill_match_score}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Reliability
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {decision.breakdown.reliability_score}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                        style={{ width: `${decision.breakdown.reliability_score}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Rating
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {decision.breakdown.rating_score}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all"
                        style={{ width: `${decision.breakdown.rating_score}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Stats Summary */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tasks Completed</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {decision.user_stats_summary.tasks_completed}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Success Rate</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {decision.user_stats_summary.success_rate}%
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Rating</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {decision.user_stats_summary.avg_rating.toFixed(1)}/5
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">On-Time</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {decision.user_stats_summary.on_time_percentage}%
                  </p>
                </div>
              </div>

              {/* Strengths */}
              {decision.strengths && decision.strengths.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Strengths
                  </h4>
                  <ul className="space-y-2">
                    {decision.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Flags/Concerns */}
              {decision.flags && decision.flags.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    Concerns
                  </h4>
                  <ul className="space-y-2">
                    {decision.flags.map((flag, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="text-orange-600 mt-0.5">⚠</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI Analysis */}
              {decision.reason && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    AI Analysis
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {decision.reason}
                  </p>
                </div>
              )}

              {/* Additional AI Analysis from Groq */}
              {decision.ai_analysis && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-600" />
                    Expert AI Insight
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {decision.ai_analysis}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {decision && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleProceed}
              className={`flex-1 px-4 py-3 rounded-xl text-white transition-all ${
                decision.decision === 'recommended'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                  : decision.decision === 'not_recommended'
                  ? 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
              }`}
            >
              {decision.decision === 'recommended' ? 'Proceed with Assignment' : 'Assign Anyway'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDecisionModal;
