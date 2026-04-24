// config/firestore.js

import api from './api';


export const getAllCourses = () =>
  api.request('/courses');

export const getCoursesByLecturer = () =>
  api.request('/courses/my-courses');

export const getAvailableCoursesForLecturer = () =>
  api.request('/courses/my-courses');

export const getStudentCourses = () =>
  api.request('/courses/my-courses');

export const getAvailableCoursesForStudent = () =>
  api.request('/courses');

export const addCourse = (data) =>
  api.request('/courses', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const assignLecturersToCourse = (courseId, lecturerIds) =>
  api.request(`/courses/${courseId}/assign-lecturers`, {
    method: 'POST',
    body: JSON.stringify({ lecturerIds }),
  });

export const assignStudentsToCourse = (courseId, studentIds) =>
  api.request(`/courses/${courseId}/assign-students`, {
    method: 'POST',
    body: JSON.stringify({ studentIds }),
  });

export const addStudentToCourse = (courseId, studentId, name, email) =>
  api.request(`/courses/${courseId}/assign-students`, {
    method: 'POST',
    body: JSON.stringify({ studentIds: [studentId], name, email }),
  });


export const getAllClasses = () =>
  api.request('/classes');

export const getClassesByLecturer = () =>
  api.request('/classes/my-classes');

// Student - get classes they are enrolled in
export const getClassesByStudent = () =>
  api.request('/classes/my-classes');

export const addClass = (data) =>
  api.request('/classes', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const deleteClass = (classId) =>
  api.request(`/classes/${classId}`, {
    method: 'DELETE',
  });

export const getEnrollmentsByClass = (classId) =>
  api.request(`/attendance/class/${classId}`);

// ATTENDANCE 

export const saveAttendance = (data) =>
  api.request('/attendance', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getClassAttendance = (classId) =>
  api.request(`/attendance/class/${classId}`);

export const getStudentAttendance = () =>
  api.request('/attendance/my-attendance');

//REPORTS 
export const submitReport = (data) =>
  api.request('/reports', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getReportsByLecturer = () =>
  api.request('/reports/my-reports');

export const getAllReports = () =>
  api.request('/reports/all');

export const addFeedbackToReport = (reportId, feedback) =>
  api.request(`/reports/${reportId}/feedback`, {
    method: 'PUT',
    body: JSON.stringify({ feedback }),
  });

// RATINGS 
export const submitRating = (data) =>
  api.request('/ratings', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getRatingsByLecturer = () =>
  api.request('/ratings/my-ratings');

export const getStudentRatings = () =>
  api.request('/ratings/my-ratings');

export const getAllRatings = () =>
  api.request('/ratings/all');

// USERS 

export const getAllStudents = () =>
  api.request('/users/students');

export const getAllLecturers = () =>
  api.request('/users/lecturers');

export const addLecturer = (data) =>
  api.request('/users/lecturers', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getStudentsNotInCourse = (courseId) =>
  api.request(`/users/students-not-in-course/${courseId}`);

export const lecturerAddStudentToCourse = (courseId, studentId) =>
  api.request(`/courses/${courseId}/assign-students`, {
    method: 'POST',
    body: JSON.stringify({ studentIds: [studentId] }),
  });

export const addStudentToAllCourses = (uid, name, email) =>
  api.request('/courses/enroll-all', {
    method: 'POST',
    body: JSON.stringify({ uid, name, email }),
  });

export const enrollNewStudentInAllClasses = (uid, name, email) =>
  api.request('/classes/enroll-all', {
    method: 'POST',
    body: JSON.stringify({ uid, name, email }),
  });