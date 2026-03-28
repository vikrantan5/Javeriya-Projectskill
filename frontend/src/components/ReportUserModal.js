import React, { useState } from 'react';
import { X, Flag, AlertTriangle, Upload } from 'lucide-react';
import { Button } from './ui/button';
import axios from 'axios';

const REPORT_TYPES = [
  { value: 'fraud', label: '🚫 Fraud / Scam' },
  { value: 'incomplete', label: '📋 Incomplete Work' },
  { value: 'harassing', label: '😡 Harassment / Abusive Behavior' },
  { value: 'payment_issue', label: '💰 Payment Related Issue' },
  { value: 'dispute', label: '⚖️ Work Quality Dispute' },
  { value: 'general', label: '📢 Other / General Report' }
];

const ReportUserModal = ({ isOpen, onClose, reportedUser, entityType, entityId, onSuccess }) => {
  const [reportType, setReportType] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
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
      
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://escrow-payment-1.preview.emergentagent.com';
      const token = localStorage.getItem('token');

      // Upload attachments if any
      let attachmentUrls = [];
      if (attachments.length > 0) {
        // TODO: Implement file upload
        // attachmentUrls = await uploadFiles(attachments);
      }

      const response = await axios.post(
        `${backendUrl}/api/reports`,
        {
          reported_entity_type: entityType,
          reported_entity_id: entityId,
          reported_user_id: reportedUser?.id,
          report_type: reportType,
          reason: reportType,
          description: description,
          attachments: attachmentUrls
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      onSuccess?.(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-red-500/30 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-pink-600 px-6 py-4 flex items-center justify-between border-b border-red-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Flag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Report User</h3>
              <p className="text-red-100 text-sm">Help us maintain a safe platform</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* User Info */}
          {reportedUser && (
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <h4 className="font-semibold text-white mb-1">Reporting User</h4>
              <p className="text-slate-400 text-sm">{reportedUser.username || reportedUser.full_name || 'Unknown User'}</p>
            </div>
          )}

          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Report Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {REPORT_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    reportType === type.value
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportType"
                    value={type.value}
                    checked={reportType === type.value}
                    onChange={(e) => setReportType(e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-white text-sm font-medium">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
              rows="5"
              placeholder="Please provide as much detail as possible about the issue. Include dates, specific incidents, and any relevant information..."
              required
            />
            <p className="text-slate-500 text-xs mt-2">Minimum 20 characters</p>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Attachments (Screenshots, Evidence)
            </label>
            <div className="space-y-3">
              {/* File Input */}
              <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-xl cursor-pointer transition-all">
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-slate-400 text-sm">Click to upload files</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="sr-only"
                />
              </label>

              {/* File List */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-white text-sm truncate flex-1">{file.name}</span>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-400 mb-1">Your Report Matters</h4>
                <p className="text-slate-400 text-sm">
                  Our admin team will review your report within 24-48 hours. False reports may result in account penalties.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading || !reportType || !description.trim() || description.length < 20}
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
        </div>
      </div>
    </div>
  );
};

export default ReportUserModal;