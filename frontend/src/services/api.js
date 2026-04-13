import axios from 'axios';

// const API_URL = '/api';
const API_URL = import.meta.env?.VITE_API_URL || '/api'


const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');0
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isBanned = error.response?.status === 403 && error.response?.data?.message === 'Your account has been restricted';
    
    if (error.response?.status === 401 || isBanned) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Only redirect if user is already logged in
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      
      if (isBanned && typeof window !== 'undefined') {
          // A bit hacky since toast isn't imported here, but native alert works for critical bans
          alert("Your account has been banned by an administrator.");
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
  registerAdminPublic: (data) => api.post('/auth/register-admin-public', data),
  requestOtp: (data) => api.post('/auth/request-otp', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};


// News APIs (User)
export const newsAPI = {
  getAll: (params) => api.get('/news', { params }),
  getBySlug: (slug) => api.get(`/news/${slug}`),
  getFeatured: (limit) => api.get('/news/featured', { params: { limit } }),
  getTrending: (limit) => api.get('/news/trending', { params: { limit } }),
  getByCategory: (category, params) => api.get(`/news/category/${category}`, { params }),
  getRelated: (id) => api.get(`/news/${id}/related`),
  getCategories: () => api.get('/news/categories'),
  toggleLike: (id) => api.post(`/news/${id}/like`),
  toggleFavorite: (id) => api.post(`/news/${id}/favorite`),
  getFavorites: (params) => api.get('/news/user/favorites', { params }),
  getComments: (newsId, params) => api.get(`/news/${newsId}/comments`, { params }),
  addComment: (newsId, data) => api.post(`/news/${newsId}/comments`, data)
};

// Comment APIs
export const commentAPI = {
  update: (id, data) => api.put(`/comments/${id}`, data),
  delete: (id) => api.delete(`/comments/${id}`),
  toggleLike: (id) => api.post(`/comments/${id}/like`)
};

// Admin APIs
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getNews: (params) => api.get('/admin/news', { params }),
  getNewsById: (id) => api.get(`/admin/news/${id}`),
  createNews: (data) => api.post('/admin/news', data),
  updateNews: (id, data) => api.put(`/admin/news/${id}`, data),
  deleteNews: (id) => api.delete(`/admin/news/${id}`),
  toggleFeatured: (id) => api.patch(`/admin/news/${id}/featured`),
  uploadImage: (formData) => api.post('/admin/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  registerPublisher: (data) => api.post('/auth/register-publisher', data),
  getPublishers: () => api.get('/auth/publishers')
};

// Report APIs
export const reportAPI = {
  create: (newsId, data) => api.post(`/reports/${newsId}`, data),
  getAll: (params) => api.get('/reports', { params }),
  updateStatus: (id, status) => api.put(`/reports/${id}/status`, { status }),
  removeArticle: (newsId) => api.delete(`/reports/${newsId}/article`),
};

// Comment Report APIs
export const commentReportAPI = {
  create: (commentId, data) => api.post(`/comment-reports/${commentId}`, data),
  getAll: (params) => api.get('/comment-reports', { params }),
  updateStatus: (id, status) => api.put(`/comment-reports/${id}/status`, { status }),
  deleteComment: (commentId) => api.delete(`/comment-reports/${commentId}/comment`),
  warnUser: (userId) => api.post(`/comment-reports/user/${userId}/warn`),
  banUser: (userId) => api.post(`/comment-reports/user/${userId}/ban`),
};

export default api;
