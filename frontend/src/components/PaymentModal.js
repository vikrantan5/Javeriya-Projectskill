import React, { useState, useEffect } from 'react';
import { X, CreditCard, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

const PaymentModal = ({ task, isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [razorpayKey, setRazorpayKey] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRazorpayKey();
      loadRazorpayScript();
    }
  }, [isOpen]);

  const loadRazorpayKey = async () => {
    try {
      const response = await api.get('/api/payments/key');
      setRazorpayKey(response.data.key_id);
    } catch (error) {
      console.error('Error loading Razorpay key:', error);
      setError('Failed to initialize payment');
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!task) return;

    setLoading(true);
    setError(null);

    try {
      // Create order
      const orderResponse = await api.post('/api/payments/create-order', {
        task_id: task.id,
        amount: task.price,
        currency: task.currency || 'INR'
      });

      const { order_id, amount, currency } = orderResponse.data;

      // Initialize Razorpay
      const options = {
        key: razorpayKey,
        amount: amount,
        currency: currency,
        name: 'TalentConnect',
        description: task.title,
        order_id: order_id,
        handler: async function (response) {
          setProcessingPayment(true);
          try {
            // Verify payment
            await api.post('/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            setProcessingPayment(false);
            onSuccess && onSuccess();
            onClose();
          } catch (error) {
            setProcessingPayment(false);
            setError('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: JSON.parse(localStorage.getItem('user') || '{}').full_name || '',
          email: JSON.parse(localStorage.getItem('user') || '{}').email || ''
        },
        theme: {
          color: '#4F46E5'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setLoading(false);
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.response?.data?.detail || 'Failed to create payment order');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="payment-modal">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Secure payment via Razorpay</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={loading || processingPayment}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Task Details */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">{task?.title}</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Amount</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{task?.price?.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-indigo-900 dark:text-indigo-200 font-medium">Secure Escrow Payment</p>
              <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">
                Your payment is held securely and will only be released when you approve the submitted work.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Processing Message */}
          {processingPayment && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
              <p className="text-sm text-blue-800 dark:text-blue-200">Verifying payment...</p>
            </div>
          )}

          {/* Payment Button */}
          <button
            onClick={handlePayment}
            disabled={loading || processingPayment || !razorpayKey}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            data-testid="pay-now-btn"
          >
            {loading || processingPayment ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Pay ₹{task?.price?.toFixed(2)}
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            By proceeding, you agree to our terms and conditions
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
