import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/sessions
});

// Add a request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


// Auth API service
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/signup', userData),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get(`/auth/me`),
};


// User API service
export const userApi = {
  updateUser: (userData) => {
    // If userData is FormData, don't set content-type (browser will set it with boundary)
    const headers = userData instanceof FormData ? {} : { 'Content-Type': 'application/json' };
    return api.put('/users/profile', userData, { headers });
  },
  updateProfilePicture: (file) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    return api.post('/users/profile/picture', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
      }
    });
  },
  updateCoverPicture: (file) => {
    const formData = new FormData();
    formData.append('coverPhoto', file);
    return api.post('/users/profile/cover', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
      }
    });
  },
  getUser: () => api.get(`/users/me`),
  getUserById: (userId) => api.get(`/users/${userId}`),
  updateUser: (userData) => api.put('/users/profile', userData),
  followUser: (userId) => api.post(`/users/${userId}/follow`),
  unfollowUser: (userId) => api.delete(`/users/${userId}/follow`),
  getSuggestedUsers: () => api.get('/users/suggested'),
// Fix these methods in the userApi object
getUserFollowers: (userId) => api.get(`/users/${userId}/followers`),
getUserFollowing: (userId) => api.get(`/users/${userId}/following`),

};


// Post API service
export const postApi = {
  createPost: (postData) => {
    const formData = new FormData();
    formData.append('content', postData.content);
    
    // Convert skills array to single skillCategory string if available
    const skillCategory = postData.skills && postData.skills.length > 0 
      ? postData.skills.join(', ') 
      : '';
    formData.append('skillCategory', skillCategory);
    
    // Handle files if they exist
    if (postData.files && postData.files.length > 0) {
      for (let i = 0; i < postData.files.length; i++) {
        formData.append('files', postData.files[i]);
      }
    }
    
    return api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getPost: (postId) => api.get(`/posts/${postId}`),
  updatePost: (postId, postData) => {
    // Ensure we're sending all necessary fields
    const formattedData = {
      content: postData.content,
      skillCategory: postData.skillCategory || '',
      mediaUrls: postData.mediaUrls || []
    };
    return api.put(`/posts/${postId}`, formattedData);
  },  
  deletePost: (postId) => api.delete(`/posts/${postId}`),
  getFeed: () => api.get('/posts/feed'),
  getExploreFeed: () => api.get('/posts/explore'),
  getUserPosts: (userId) => api.get(`/posts/user/${userId}`),
  likePost: (postId) => api.post(`/posts/${postId}/like`),
  unlikePost: (postId) => api.post(`/posts/${postId}/unlike`),
  savePost: (postId) => api.post(`/posts/${postId}/save`),
  unsavePost: (postId) => api.delete(`/posts/${postId}/save`),
  getSavedPosts: () => api.get('/users/me/saved-posts'),
  getComments: (postId) => {
    console.log(`Getting comments for post ${postId}`);
    return api.get(`/posts/${postId}/comments`);
  },  
  createComment: (postId, comment) => {
    console.log(`Adding comment to post ${postId}:`, comment);
    // Make sure we're sending the expected structure
    const data = typeof comment === 'string' 
      ? { content: comment } 
      : comment;
    
    return api.post(`/posts/${postId}/comments`, data);
  },
  deleteComment: (postId, commentId) => {
    console.log(`Deleting comment ${commentId} from post ${postId}`);
    return api.delete(`/posts/${postId}/comments/${commentId}`);
  },  
  searchPosts: (query) => api.get('/posts/search', { params: { q: query } }),
};


// Comment API service
export const commentApi = {
  getComment: (commentId) => api.get(`/comments/${commentId}`),
  updateComment: (commentId, commentData) => {
    console.log(`Updating comment ${commentId}:`, commentData);
    return api.put(`/comments/${commentId}`, commentData);
  },
  deleteComment: (commentId) => {
    console.log(`Deleting comment ${commentId}`);
    return api.delete(`/comments/${commentId}`);
  }
};


// Learning Plan API service
export const learningPlanApi = {
  createPlan: (planData) => {
    // Ensure skills is properly formatted
    const formattedData = {
      ...planData,
      // If skills is a string, convert it to an array
      skills: typeof planData.skills === 'string' 
        ? [planData.skills] 
        : planData.skills
    };
    return api.post('/learning-plans', formattedData);
  },
  updatePlan: (planId, planData) => {
    // Ensure skills is properly formatted
    const formattedData = {
      ...planData,
      // If skills is a string, convert it to an array
      skills: typeof planData.skills === 'string' 
        ? [planData.skills] 
        : planData.skills
    };
    // Don't send steps in the update if they're not being edited
    if (!formattedData.steps) {
      delete formattedData.steps;
    }
    return api.put(`/learning-plans/${planId}`, formattedData);
  },  
  // Rest of the methods remain the same
  getPlan: (planId) => api.get(`/learning-plans/${planId}`),
  deletePlan: (planId) => api.delete(`/learning-plans/${planId}`),
  getUserPlans: (userId) => api.get(`/learning-plans/user/${userId}`),
  addPlanStep: (planId, stepData) => {
    // Create a proper step object with content field
    const step = {
      title: stepData.content,
      description: stepData.content,
      completed: false
    };
    return api.post(`/learning-plans/${planId}/steps`, step);
  },
  updatePlanStep: (planId, stepId, stepData) => {
    // Handle both content updates and completion status updates
    const updatedStep = {};
    
    if (stepData.content !== undefined) {
      updatedStep.title = stepData.content;
      updatedStep.description = stepData.content;
    }
    
    if (stepData.completed !== undefined) {
      updatedStep.completed = stepData.completed;
    }
    
    return api.put(`/learning-plans/${planId}/steps/${stepId}`, updatedStep);
  },
  deletePlanStep: (planId, stepId) => api.delete(`/learning-plans/${planId}/steps/${stepId}`),
  reorderPlanStep: (planId, stepId, direction) => 
    api.put(`/learning-plans/${planId}/steps/${stepId}/reorder`, { direction }),
  updateProgress: (planId, progress) => 
    api.put(`/learning-plans/${planId}/progress`, { progress }),
};


export const skillApi = {
  getTrendingSkills: () => api.get('/skills/trending'),
  searchSkills: (query) => api.get('/skills/search', { params: { q: query } }),
  getUserSkills: (userId) => api.get(`/users/${userId}/skills`),
  addUserSkill: (skillName) => api.post('/users/me/skills', { name: skillName }),
  removeUserSkill: (skillName) => api.delete(`/users/me/skills/${encodeURIComponent(skillName)}`),
};


export const learningProgressApi = {
  createProgress: (progressData) => {
    // Ensure skills is properly formatted
    const formattedData = {
      ...progressData,
      // If skills is a string, convert it to an array
      skills: typeof progressData.skills === 'string' 
        ? [progressData.skills] 
        : progressData.skills
    };
    return api.post('/learning-progress', formattedData);
  },
  
  updateProgress: (progressId, progressData) => {
    // Ensure skills is properly formatted
    const formattedData = {
      ...progressData,
      // If skills is a string, convert it to an array
      skills: typeof progressData.skills === 'string' 
        ? [progressData.skills] 
        : progressData.skills
    };
    return api.put(`/learning-progress/${progressId}`, formattedData);
  },
  
  getProgress: (progressId) => api.get(`/learning-progress/${progressId}`),
  
  deleteProgress: (progressId) => api.delete(`/learning-progress/${progressId}`),
  
  getUserProgress: (userId) => api.get(`/learning-progress/user/${userId}`),
  
  getProgressBySkill: (skill) => api.get(`/learning-progress/skill/${skill}`),
};


export const notificationApi = {
  getNotifications: (page = 0, size = 10) => 
    api.get(`/notifications?page=${page}&size=${size}`),
  
  getUnreadCount: () => 
    api.get('/notifications/count'),
  
  markAsRead: (notificationId) => 
    api.put(`/notifications/${notificationId}/read`),
  
  markAllAsRead: () => 
    api.put('/notifications/mark-all-read')
};