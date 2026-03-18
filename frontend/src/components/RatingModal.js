import React, { useState } from 'react';
import { X, Star, Send, Loader2 } from 'lucide-react';
import { ratingService } from '../services/apiService';

const RatingModal = ({ 
  isOpen, 
  onClose, 
  receiverId, 
  receiverName, 
  taskId = null, 
  sessionId = null,
  onSuccess 
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await ratingService.addRating({
        receiver_id: receiverId,
        task_id: taskId,
        session_id: sessionId,
        rating: rating,
        review: review.trim() || null
      });

      // Success
      if (onSuccess) onSuccess();
      onClose();
      
      // Reset form
      setRating(0);
      setReview('');
    } catch (err) {
      console.error('Rating submission error:', err);
      setError(err.response?.data?.detail || 'Failed to submit rating. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setRating(0);
      setReview('');
      setError('');
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative h-24 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-t-2xl p-6">
          <div className="absolute inset-0 bg-black/20 rounded-t-2xl"></div>
          <div className="relative flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white">Rate Experience</h2>
              <p className="text-white/90 text-sm mt-1">
                How was your experience with {receiverName}?
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-2 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Star Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
              Select Rating *
            </label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                  data-testid={`star-${star}`}
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                {rating === 5 && '⭐ Excellent!'}
                {rating === 4 && '👍 Very Good'}
                {rating === 3 && '😊 Good'}
                {rating === 2 && '😐 Fair'}
                {rating === 1 && '👎 Poor'}
              </p>
            )}
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Write a Review (Optional)
            </label>
            <textarea
              rows="4"
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Share your experience..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              maxLength="500"
              data-testid="review-textarea"
            ></textarea>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {review.length}/500 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || rating === 0}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-3 rounded-xl hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 transition-all shadow-lg shadow-yellow-500/25 flex items-center justify-center gap-2"
              data-testid="submit-rating-button"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Rating
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;
