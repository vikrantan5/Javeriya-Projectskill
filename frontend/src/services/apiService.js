import api from './api';

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
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

export const skillService = {
  getSkills: async () => {
    const response = await api.get('/api/skills');
    return response.data;
  },

  addSkill: async (skillData) => {
    const response = await api.post('/api/skills', skillData);
    return response.data;
  },

  findMentors: async (skillName) => {
    const response = await api.get(`/api/skills/mentors/${skillName}`);
    return response.data;
  },

  verifySkill: async (skillId) => {
    const response = await api.post(`/api/skills/${skillId}/verify`);
    return response.data;
  },

  getRecommendations: async () => {
    const response = await api.get('/api/skills/recommendations');
    return response.data;
  },
};

export const taskService = {
  getTasks: async (status = 'all') => {
    const response = await api.get(`/api/tasks?status=${status}`);
    return response.data;
  },

  createTask: async (taskData) => {
    const response = await api.post('/api/tasks', taskData);
    return response.data;
  },

  acceptTask: async (taskId) => {
    const response = await api.post(`/api/tasks/${taskId}/accept`);
    return response.data;
  },

  submitTask: async (taskId, submissionData) => {
    const response = await api.post(`/api/tasks/${taskId}/submit`, submissionData);
    return response.data;
  },

  reviewSubmission: async (submissionId, reviewData) => {
    const response = await api.post(`/api/tasks/submissions/${submissionId}/review`, reviewData);
    return response.data;
  },
};

export const sessionService = {
  getSessions: async () => {
    const response = await api.get('/api/sessions');
    return response.data;
  },

  requestSession: async (sessionData) => {
    const response = await api.post('/api/sessions/request', sessionData);
    return response.data;
  },

  acceptRequest: async (requestId) => {
    const response = await api.post(`/api/sessions/request/${requestId}/accept`);
    return response.data;
  },

  rateSession: async (sessionId, ratingData) => {
    const response = await api.post(`/api/sessions/${sessionId}/rate`, ratingData);
    return response.data;
  },
};

export const chatService = {
  sendMessage: async (message, sessionId) => {
    const response = await api.post('/api/chat', { message, session_id: sessionId });
    return response.data;
  },

  getChatHistory: async (sessionId) => {
    const response = await api.get(`/api/chat/history/${sessionId}`);
    return response.data;
  },
};

export const paymentService = {
  createOrder: async (taskId, amount) => {
    const response = await api.post('/api/payments/create-order', { task_id: taskId, amount });
    return response.data;
  },

  verifyPayment: async (paymentData) => {
    const response = await api.post('/api/payments/verify', paymentData);
    return response.data;
  },
};

export const adminService = {
  getUsers: async () => {
    const response = await api.get('/api/admin/users');
    return response.data;
  },

  banUser: async (userId, reason) => {
    const response = await api.post(`/api/admin/users/${userId}/ban`, { reason });
    return response.data;
  },

  getAnalytics: async () => {
    const response = await api.get('/api/admin/analytics');
    return response.data;
  },

  getFraudLogs: async () => {
    const response = await api.get('/api/admin/fraud-logs');
    return response.data;
  },
};
