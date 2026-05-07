import api from './api';

export const getAllCourses = () => api.getAllCourses();

export const getCoursesByLecturer = () => api.getMyCourses();

export const getAvailableCoursesForLecturer = async (lecturerId) => {
  const allCourses = await api.getAllCourses();
  const myCourses = await api.getMyCourses();
  const myCourseIds = myCourses.map(c => c.id);
  return allCourses.filter(c => !myCourseIds.includes(c.id));
};

export const getMyCourses = () =>
  api.request('/courses/my-courses');

export const getStudentCourses = () => api.getMyCourses();

export const getAvailableCoursesForStudent = () => api.getAllCourses();

export const addCourse = (data) => api.createCourse(data);

export const assignLecturersToCourse = (courseId, lecturerIds) => 
  api.assignLecturersToCourse(courseId, lecturerIds);

export const assignStudentsToCourse = (courseId, studentIds) => 
  api.assignStudentsToCourse(courseId, studentIds);

export const addStudentToCourse = (courseId, studentId, name, email) => 
  api.assignStudentsToCourse(courseId, [studentId]);

export const deleteCourse = (courseId) => api.deleteCourse(courseId);

export const getAllClasses = () => api.getAllClasses();

export const getClassesByLecturer = () => api.getMyClasses();

export const getClassesByStudent = () => api.getMyClasses();

export const addClass = (data) => api.createClass(data);

export const deleteClass = (classId) => api.deleteClass(classId);

export const getEnrollmentsByClass = (classId) => api.getClassAttendance(classId);

export const saveAttendance = (data) => api.saveAttendance(data);

export const getClassAttendance = (classId) => api.getClassAttendance(classId);

export const getStudentAttendance = () => api.getMyAttendance();

export const submitReport = (data) => api.submitReport(data);

export const getReportsByLecturer = () => api.getMyReports();

export const getAllReports = () => api.getAllReports();

export const addFeedbackToReport = (reportId, feedback) => 
  api.addReportFeedback(reportId, feedback);

export const deleteReport = (reportId) => api.deleteReport(reportId);

export const submitRating = (data) => api.submitRating(data);

export const getRatingsByLecturer = () => api.getMyRatings();

export const getStudentRatings = () => api.getMyRatings();

export const getAllRatings = () => api.getAllRatings();

export const getAllStudents = () => api.getAllStudents();

export const getAllLecturers = () => api.getAllLecturers();

export const addLecturer = (data) => api.createLecturer(data);

export const deleteUser = (userId) => api.deleteUser(userId);

export const getStudentsNotInCourse = (courseId) => api.getStudentsNotInCourse(courseId);

export const lecturerAddStudentToCourse = (courseId, studentId) => 
  api.assignStudentsToCourse(courseId, [studentId]);