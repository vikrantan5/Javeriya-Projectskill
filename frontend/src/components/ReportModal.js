import React, { useState } from 'react';
import { X, Flag, AlertTriangle, Upload, FileText } from 'lucide-react';
import { reportService } from '../services/apiService';

const REPORT_TYPES = [
  { value: 'fraud', label: '🚨 Fraud / Scam', description: 'Fraudulent behavior or scam attempts' },
  { value: 'incomplete', label: '📦 Incomplete Work', description: 'Work not completed as agreed' },
  { value: 'harassing', label: '⚠️ Harassment', description: 'Abusive or threatening behavior' },
  { value: 'payment_issue', label: '💰 Payment Issues', description: 'Payment-related disputes' },
  { value: 'dispute', label: '⚖️ Dispute', description: 'General dispute or disagreement' },
  { value: 'other', label: '📝 Other', description: 'Other issues not listed above' }
];

const ReportModal = ({ isOpen, onClose, reportedUser, task, onSuccess }) => {
  const [reportType, setReportType] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      
      if (!reportType) {
        setError('Please select a report type');
        return;
      }

      if (!description.trim()) {
        setError('Please provide a detailed description');
        return;
      }

      setLoading(true);

      const reportData = {
        reported_entity_type: task ? 'task' : 'user',
        reported_entity_id: task ? task.id : reportedUser.id,
        reported_user_id: reportedUser.id,
        report_type: reportType,
        reason: reason || REPORT_TYPES.find(t => t.value === reportType)?.label,
        description: description,
        attachments: attachments,
        screenshots: attachments
      };

      const response = await reportService.createReport(reportData);
      
      onSuccess && onSuccess(response);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    // In production, you'd upload these files
    setAttachments(files.map(f => f.name));
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" data-testid="report-modal">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-orange-500/30 shadow-2xl shadow-orange-500/20">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 flex items-center justify-between border-b border-orange-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Flag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Report User</h3>
              <p className="text-orange-100 text-sm">Help us maintain platform integrity</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* User Info */}
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <h4 className="font-semibold text-white mb-2">Reporting:</h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold">
                {reportedUser?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-white font-medium">{reportedUser?.full_name || reportedUser?.username}</p>
                <p className="text-slate-400 text-sm">@{reportedUser?.username}</p>
              </div>
            </div>
            {task && (
              <p className="text-yellow-400 text-sm mt-3">
                📋 Related to task: {task.title}
              </p>
            )}
          </div>

          {/* Report Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Type of Issue <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {REPORT_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    reportType === type.value
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportType"
                    value={type.value}
                    checked={reportType === type.value}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-4 h-4 text-orange-500 mt-1"
                  />
                  <div className="flex-1">
                    <span className="text-white font-medium block">{type.label}</span>
                    <span className="text-slate-400 text-sm">{type.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              rows="5"
              placeholder="Please provide as much detail as possible about the issue. Include dates, specific incidents, and any other relevant information..."
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Minimum 20 characters required. Be specific and factual.
            </p>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Evidence / Screenshots (Optional)
            </label>
            <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-slate-600 transition-all">
              <input
                type="file"
                id="report-files"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="report-files" className="cursor-pointer">
                <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Click to upload evidence</p>
                <p className="text-slate-600 text-xs mt-1">Images or PDF files</p>
              </label>
              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 px-3 py-2 rounded-lg">
                      <FileText className="w-4 h-4" />
                      {file}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Warning Notice */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-blue-400 mb-1">Important Notice</h4>
                <p className="text-slate-400 text-sm">
                  False reports may result in action against your account. Please ensure all information is accurate and truthful.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading || !reportType || !description.trim() || description.trim().length < 20}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Flag className="w-5 h-5" />
                  Submit Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
