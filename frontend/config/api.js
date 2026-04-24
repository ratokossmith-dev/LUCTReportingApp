// frontend/config/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  } else if (Platform.OS === 'ios') {
    return 'http://localhost:5000/api';
  } else {
    // Web browser on same machine as backend
    return 'http://localhost:5000/api';
  }
};

const API_URL = getBaseUrl();

console.log('API URL:', API_URL);

const api = {
  // Get stored token
  getToken: async () => {
    return await AsyncStorage.getItem('authToken');
  },

  // Save token
  setToken: async (token) => {
    await AsyncStorage.setItem('authToken', token);
  },

  // Remove token on logout
  removeToken: async () => {
    await AsyncStorage.removeItem('authToken');
  },

  // Generic request method
  request: async (endpoint, options = {}) => {
    const token = await api.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.log('API Error:', error);
      throw error;
    }
  },

  
  register: (userData) => api.request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),

  login: (email, password) => api.request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),

  // Get profile using Firebase ID token (token already set via setToken)
  getMe: () => api.request('/auth/me'),

  
  getAllCourses: () => api.request('/courses'),

  getMyCourses: () => api.request('/courses/my-courses'),

  createCourse: (courseData) => api.request('/courses', {
    method: 'POST',
    body: JSON.stringify(courseData),
  }),

  assignLecturersToCourse: (courseId, lecturerIds) => api.request(`/courses/${courseId}/assign-lecturers`, {
    method: 'POST',
    body: JSON.stringify({ lecturerIds }),
  }),

  assignStudentsToCourse: (courseId, studentIds) => api.request(`/courses/${courseId}/assign-students`, {
    method: 'POST',
    body: JSON.stringify({ studentIds }),
  }),

  
  getAllClasses: () => api.request('/classes'),

  getMyClasses: () => api.request('/classes/my-classes'),

  createClass: (classData) => api.request('/classes', {
    method: 'POST',
    body: JSON.stringify(classData),
  }),

  deleteClass: (classId) => api.request(`/classes/${classId}`, {
    method: 'DELETE',
  }),

  
  saveAttendance: (attendanceData) => api.request('/attendance', {
    method: 'POST',
    body: JSON.stringify(attendanceData),
  }),

  getMyAttendance: () => api.request('/attendance/my-attendance'),

  getClassAttendance: (classId) => api.request(`/attendance/class/${classId}`),

  
  submitReport: (reportData) => api.request('/reports', {
    method: 'POST',
    body: JSON.stringify(reportData),
  }),

  getMyReports: () => api.request('/reports/my-reports'),

  getAllReports: () => api.request('/reports/all'),

  addReportFeedback: (reportId, feedback) => api.request(`/reports/${reportId}/feedback`, {
    method: 'PUT',
    body: JSON.stringify({ feedback }),
  }),

  
  submitRating: (ratingData) => api.request('/ratings', {
    method: 'POST',
    body: JSON.stringify(ratingData),
  }),

  getMyRatings: () => api.request('/ratings/my-ratings'),

  getAllRatings: () => api.request('/ratings/all'),

  
  getAllStudents: () => api.request('/users/students'),

  getAllLecturers: () => api.request('/users/lecturers'),

  createLecturer: (lecturerData) => api.request('/users/lecturers', {
    method: 'POST',
    body: JSON.stringify(lecturerData),
  }),
};

export default api;