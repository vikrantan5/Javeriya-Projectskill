import api from './api';

// ============================================
// AUTH SERVICE
// ============================================
export const authService = {
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/api/users/me');
    return response.data;
  },
};

// ============================================
// SKILL SERVICE
// ============================================
export const skillService = {
  getMySkills: async () => {
    const response = await api.get('/api/skills/my-skills');
    return response.data;
  },

  addSkill: async (skillData) => {
    const response = await api.post('/api/skills/', skillData);
    return response.data;
  },

  deleteSkill: async (skillId) => {
    const response = await api.delete(`/api/skills/${skillId}`);
    return response.data;
  },

  searchSkills: async (skillName, skillType = 'offered') => {
    const response = await api.get(`/api/skills/search?skill_name=${encodeURIComponent(skillName)}&skill_type=${skillType}`);
    return response.data;
  },

  getUserSkills: async (userId) => {
    const response = await api.get(`/api/skills/user/${userId}`);
    return response.data;
  },
};

// ============================================
// SESSION SERVICE
// ============================================
export const sessionService = {
  createRequest: async (requestData) => {
    const response = await api.post('/api/sessions/request', requestData);
    return response.data;
  },

  getReceivedRequests: async () => {
    const response = await api.get('/api/sessions/requests/received');
    return response.data;
  },

  getSentRequests: async () => {
    const response = await api.get('/api/sessions/requests/sent');
    return response.data;
  },

  acceptRequest: async (requestId, sessionData) => {
    const response = await api.post(`/api/sessions/requests/${requestId}/accept`, sessionData);
    return response.data;
  },

  rejectRequest: async (requestId) => {
    const response = await api.post(`/api/sessions/requests/${requestId}/reject`);
    return response.data;
  },

  getMySessions: async () => {
    const response = await api.get('/api/sessions/my-sessions');
    return response.data;
  },

  updateSession: async (sessionId, updateData) => {
    const response = await api.patch(`/api/sessions/${sessionId}`, updateData);
    return response.data;
  },
  getMeetingProviders: async () => {
    const response = await api.get('/api/sessions/meeting-providers');
    return response.data;
  },

  generateMeetingLink: async (provider, sessionTopic) => {
    const response = await api.post('/api/sessions/generate-meeting-link', {
      provider,
      session_topic: sessionTopic,
    });
    return response.data;
  },
};

// ============================================
// TASK SERVICE
// ============================================
export const taskService = {
  getAllTasks: async (status = 'open') => {
    const response = await api.get(`/api/tasks/?status=${status}`);
    return response.data;
  },

  getMyTasks: async () => {
    const response = await api.get('/api/tasks/my-tasks');
    return response.data;
  },

  getAcceptedTasks: async () => {
    const response = await api.get('/api/tasks/accepted-tasks');
    return response.data;
  },

    getCompletedTasks: async () => {
    const response = await api.get('/api/tasks/?status=completed');
    return response.data;
  },

  getTaskById: async (taskId) => {
    const response = await api.get(`/api/tasks/${taskId}`);
    return response.data;
  },

  createTask: async (taskData) => {
    const response = await api.post('/api/tasks/', taskData);
    return response.data;
  },

  acceptTask: async (taskId) => {
    const response = await api.post(`/api/tasks/${taskId}/accept`);
    return response.data;
  },

  submitTask: async (taskId, submissionData) => {
    const response = await api.post(`/api/tasks/${taskId}/submit`, {
      submission_text: submissionData?.submission_text || submissionData?.message || '',
      submission_files: submissionData?.submission_files || submissionData?.attachments || [],
    });
    return response.data;
  },

  approveSubmission: async (taskId, reviewNotes) => {
    const response = await api.post(`/api/tasks/${taskId}/approve`, { review_notes: reviewNotes });
    return response.data;
  },

  deleteTask: async (taskId) => {
    const response = await api.delete(`/api/tasks/${taskId}`);
    return response.data;
  },
  createSkillExchangeTask: async (taskData) => {
    const response = await api.post('/api/tasks/exchange', taskData);
    return response.data;
  },

  getSkillExchangeTasks: async (statusFilter = 'open') => {
    const response = await api.get(`/api/tasks/exchange?status_filter=${statusFilter}`);
    return response.data;
  },

  getMySkillExchangeTasks: async () => {
    const response = await api.get('/api/tasks/exchange/my');
    return response.data;
  },

  acceptSkillExchangeTask: async (taskId, reciprocalTaskId = null) => {
    const response = await api.post(`/api/tasks/exchange/${taskId}/accept`, {
      reciprocal_task_id: reciprocalTaskId,
    });
    return response.data;
  },
};

// ============================================
// REVIEW SERVICE
// ============================================
export const reviewService = {
  createReview: async (reviewData) => {
    const response = await api.post('/api/reviews/', reviewData);
    return response.data;
  },

  getUserReviews: async (userId) => {
    const response = await api.get(`/api/reviews/user/${userId}`);
    return response.data;
  },

  getSessionReviews: async (sessionId) => {
    const response = await api.get(`/api/reviews/session/${sessionId}`);
    return response.data;
  },
};

// ============================================
// PAYMENT SERVICE
// ============================================
export const paymentService = {
    getRazorpayKey: async () => {
    const response = await api.get('/api/payments/key');
    return response.data;
  },
  createOrder: async (taskId, amount, currency = 'INR') => {
    const response = await api.post('/api/payments/create-order', {
      task_id: taskId,
      amount: amount,
      currency: currency
    });
    return response.data;
  },

  verifyPayment: async (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
    const response = await api.post('/api/payments/verify', {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature
    });
    return response.data;
  },

   getTaskPaymentStatus: async (taskId) => {
    const response = await api.get(`/api/payments/task/${taskId}/status`);
    return response.data;
  },

  releasePayment: async (paymentId) => {
    const response = await api.post(`/api/payments/release/${paymentId}`);
    return response.data;
  },

  getMyPayments: async () => {
    const response = await api.get('/api/payments/my-payments');
    return response.data;
  },
};

// ============================================
// AI SERVICE
// ============================================
export const aiService = {
  chat: async (message, sessionId = null) => {
    const response = await api.post('/api/ai/chatbot', {
      message: message,
      session_id: sessionId
    });
    return response.data;
  },
   // Alias for chat method to maintain compatibility
  sendMessage: async (message, sessionId = null) => {
    const response = await api.post('/api/ai/chatbot', {
      message: message,
      session_id: sessionId
    });
    return response.data;
  },

  getChatHistory: async (sessionId) => {
    const response = await api.get(`/api/ai/chat-history/${sessionId}`);
    return response.data;
  },

  matchMentors: async (skillName, limit = 5) => {
    const response = await api.post('/api/ai/match-mentors', {
      skill_name: skillName,
      limit: limit
    });
    return response.data;
  },

  recommendSkills: async (userSkills, limit = 5) => {
    const response = await api.post('/api/ai/recommend-skills', {
      user_skills: userSkills,
      limit: limit
    });
    return response.data;
  },

  generateQuiz: async (skillName, skillLevel) => {
    const response = await api.get(`/api/ai/generate-quiz/${encodeURIComponent(skillName)}?skill_level=${skillLevel}`);
    return response.data;
  },

  submitQuiz: async (testId, answers) => {
    const response = await api.post(`/api/ai/submit-quiz/${testId}`, { answers: answers });
    return response.data;
  },
};

// ============================================
// NOTIFICATION SERVICE
// ============================================
export const notificationService = {
  getAll: async () => {
    const response = await api.get('/api/notifications/');
    return response.data;
  },

  getUnread: async () => {
    const response = await api.get('/api/notifications/unread');
    return response.data;
  },

  getCount: async () => {
    const response = await api.get('/api/notifications/count');
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await api.post(`/api/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.post('/api/notifications/mark-all-read');
    return response.data;
  },

  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/api/notifications/${notificationId}`);
    return response.data;
  },
};

// ============================================
// USER SERVICE
// ============================================
export const userService = {
  getMyProfile: async () => {
    const response = await api.get('/api/users/me');
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await api.get(`/api/users/${userId}`);
    return response.data;
  },

  updateProfile: async (updateData) => {
    const response = await api.patch('/api/users/me', updateData);
    return response.data;
  },
};

// ============================================
// ADMIN SERVICE
// ============================================
export const adminService = {
  getAllUsers: async () => {
    const response = await api.get('/api/admin/users');
    return response.data;
  },

  banUser: async (userId, reason, durationDays = null) => {
    const response = await api.post(`/api/admin/users/${userId}/ban`, {
      reason: reason,
      duration_days: durationDays
    });
    return response.data;
  },

  unbanUser: async (userId) => {
    const response = await api.post(`/api/admin/users/${userId}/unban`);
    return response.data;
  },

  getAllTasks: async () => {
    const response = await api.get('/api/admin/tasks');
    return response.data;
  },

  getAllSessions: async () => {
    const response = await api.get('/api/admin/sessions');
    return response.data;
  },

  getFraudLogs: async () => {
    const response = await api.get('/api/admin/fraud-logs');
    return response.data;
  },

  getAnalytics: async () => {
    const response = await api.get('/api/admin/analytics');
    return response.data;
  },

  createPlatformMessage: async (messageData) => {
    const response = await api.post('/api/admin/messages', messageData);
    return response.data;
  },
};



// ============================================
// ROADMAP SERVICE
// ============================================
export const roadmapService = {
  generate: async (careerGoal, currentSkills = []) => {
    const response = await api.post('/api/roadmap/generate', {
      career_goal: careerGoal,
      current_skills: currentSkills
    });
    return response.data;
  },

  getMyRoadmaps: async (activeOnly = true) => {
    const response = await api.get(`/api/roadmap/my-roadmaps?active_only=${activeOnly}`);
    return response.data;
  },

  getRoadmapById: async (roadmapId) => {
    const response = await api.get(`/api/roadmap/${roadmapId}`);
    return response.data;
  },

  updateProgress: async (roadmapId, currentStep, completionPercentage) => {
    const response = await api.patch(`/api/roadmap/${roadmapId}/progress`, {
      current_step: currentStep,
      completion_percentage: completionPercentage
    });
    return response.data;
  },

  complete: async (roadmapId) => {
    const response = await api.post(`/api/roadmap/${roadmapId}/complete`);
    return response.data;
  },
};

// ============================================
// REALTIME SERVICE
// ============================================
export const realtimeService = {
  getHistory: async (roomType, roomId) => {
    const response = await api.get(`/api/realtime/history/${roomType}/${roomId}`);
    return response.data;
  },

  buildWebSocketUrl: (roomType, roomId, token) => {
    const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
    const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const baseUrl = API_BASE_URL.replace(/^https?:\/\//, '');
    return `${wsProtocol}://${baseUrl}/api/realtime/ws/${roomType}/${roomId}?token=${token}`;
  },
};