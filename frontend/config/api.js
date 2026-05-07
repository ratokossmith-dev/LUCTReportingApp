import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './firebase';

const API_URL = 'https://luct-reporting-backend-2uum.onrender.com/api';

const api = {
  getToken: async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken(false);
        await AsyncStorage.setItem('authToken', token);
        return token;
      }
      return await AsyncStorage.getItem('authToken');
    } catch (e) {
      console.log('Token error:', e);
      return await AsyncStorage.getItem('authToken');
    }
  },

  setToken: async (token) => {
    await AsyncStorage.setItem('authToken', token);
  },

  removeToken: async () => {
    await AsyncStorage.removeItem('authToken');
  },

  request: async (endpoint, options = {}) => {
    const token = await api.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn(`[API] No token for ${endpoint} — user may not be logged in`);
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        console.log(`[API] ${response.status} on ${endpoint}:`, data.error);
        throw new Error(data.error || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.log(`[API] Request failed (${endpoint}):`, error.message);
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
  deleteCourse: (courseId) => api.request(`/courses/${courseId}`, {
    method: 'DELETE',
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
  deleteReport: (reportId) => api.request(`/reports/${reportId}`, {
    method: 'DELETE',
  }),

  submitRating: (ratingData) => api.request('/ratings', {
    method: 'POST',
    body: JSON.stringify(ratingData),
  }),
  getMyRatings: () => api.request('/ratings/my-ratings'),
  getAllRatings: () => api.request('/ratings/all'),

  getAllStudents: () => api.request('/users/students'),
  getAllLecturers: () => api.request('/users/lecturers'),
  getStudentsNotInCourse: (courseId) => api.request(`/users/students-not-in-course/${courseId}`),
  createLecturer: (lecturerData) => api.request('/users/lecturers', {
    method: 'POST',
    body: JSON.stringify(lecturerData),
  }),
  deleteUser: (userId) => api.request(`/users/${userId}`, {
    method: 'DELETE',
  }),
};

export default api;