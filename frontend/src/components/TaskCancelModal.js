import React, { useState } from 'react';
import { X, AlertTriangle, Flag } from 'lucide-react';
import { Button } from './ui/button';
import { taskService } from '../services/apiService';

const CANCEL_REASONS = [
  { value: 'work_not_as_described', label: 'Work not as described' },
  { value: 'incomplete_work', label: 'Incomplete work' },
  { value: 'fake_submission', label: 'Fake submission' },
  { value: 'delay_beyond_deadline', label: 'Delay beyond deadline' },
  { value: 'poor_quality', label: 'Poor quality' },
  { value: 'other', label: 'Other (specify below)' }
];

const TaskCancelModal = ({ isOpen, onClose, task, onSuccess }) => {
  const [cancelReason, setCancelReason] = useState('');
  const [cancelDetails, setCancelDetails] = useState('');
  const [showReportOption, setShowReportOption] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCancel = async () => {
    try {
      setError('');
      
      // Validate mandatory reason
      if (!cancelReason) {
        setError('⚠️ WARNING: You MUST select a cancellation reason. Cancelling without a reason will result in IMMEDIATE ACCOUNT BLOCKING.');
        return;
      }

      if (cancelReason === 'other' && !cancelDetails.trim()) {
        setError('Please provide details for "Other" reason');
        return;
      }

      setLoading(true);
      
      const response = await taskService.cancelTask(task.id, {
        cancel_reason: cancelReason,
        cancel_details: cancelDetails
      });

      onSuccess(response);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to cancel task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-red-500/30 shadow-2xl shadow-red-500/20">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4 flex items-center justify-between border-b border-red-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Cancel Task</h3>
              <p className="text-red-100 text-sm">This action requires a valid reason</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="m-6 p-4 bg-red-500/10 border-2 border-red-500 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-red-400 mb-2">⚠️ CRITICAL WARNING</h4>
              <p className="text-red-300 text-sm leading-relaxed">
                Cancelling a task <strong>WITHOUT selecting a valid reason</strong> will result in <strong className="text-red-500">IMMEDIATE AUTOMATIC ACCOUNT BLOCKING</strong>. 
                This is a strict platform policy to prevent abuse.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-6">
          {/* Task Info */}
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <h4 className="font-semibold text-white mb-2">Task: {task?.title}</h4>
            <p className="text-slate-400 text-sm">Amount: ₹{task?.price}</p>
            {task?.acceptor_id && (
              <p className="text-yellow-400 text-sm mt-2">⚠️ This task has an assigned worker</p>
            )}
          </div>

          {/* Cancel Reason Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Select Cancellation Reason <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {CANCEL_REASONS.map((reason) => (
                <label
                  key={reason.value}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    cancelReason === reason.value
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value={reason.value}
                    checked={cancelReason === reason.value}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-4 h-4 text-red-500"
                  />
                  <span className="text-white font-medium">{reason.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Details (required for "other") */}
          {cancelReason === 'other' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Provide Details <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelDetails}
                onChange={(e) => setCancelDetails(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                rows="4"
                placeholder="Please explain the reason for cancellation..."
                required
              />
            </div>
          )}

          {/* Optional Details for other reasons */}
          {cancelReason && cancelReason !== 'other' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Additional Details (Optional)
              </label>
              <textarea
                value={cancelDetails}
                onChange={(e) => setCancelDetails(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-slate-600 focus:ring-2 focus:ring-slate-600/20 transition-all"
                rows="3"
                placeholder="Any additional information..."
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Report Option */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <Flag className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-blue-400 mb-1">Need to report the task acceptor?</h4>
                <p className="text-slate-400 text-sm mb-3">
                  If you're experiencing fraud, harassment, or other serious issues, you can report the user.
                </p>
                <button
                  onClick={() => setShowReportOption(true)}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium underline"
                >
                  Report User →
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all"
              disabled={loading}
            >
              Go Back
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading || !cancelReason}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Confirm Cancellation'
              )}
            </button>
          </div>

          {/* Refund Info */}
          {cancelReason && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <p className="text-green-400 text-sm">
                ✅ A refund of ₹{task?.price} will be initiated to your account after cancellation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCancelModal;