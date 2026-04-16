import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── USERS ────────────────────────────────────────────────────────────────────

export const getUserProfile = async (uid) => {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (e) {
    return null;
  }
};

export const getAllStudents = async () => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "student"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
};

export const getAllLecturers = async () => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "lecturer"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
};

export const getAllUsers = async () => {
  try {
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
};

// ─── COURSES ──────────────────────────────────────────────────────────────────

export const getAllCourses = async () => {
  try {
    const snap = await getDocs(collection(db, "courses"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
};

// Get courses assigned to a specific lecturer by their Firebase UID
export const getCoursesByLecturer = async (lecturerId) => {
  try {
    const q = query(
      collection(db, "courses"),
      where("lecturerId", "==", lecturerId),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
};

export const addCourse = async (courseData) => {
  try {
    return await addDoc(collection(db, "courses"), {
      ...courseData,
      createdAt: serverTimestamp(),
      status: "Active",
    });
  } catch (e) {
    throw e;
  }
};

// IMPORTANT: saves lecturerId (Firebase UID) AND lecturerName
export const assignLecturerToCourse = async (
  courseId,
  lecturerId,
  lecturerName,
) => {
  try {
    await updateDoc(doc(db, "courses", courseId), {
      lecturerId,
      lecturerName,
    });
  } catch (e) {
    throw e;
  }
};

export const updateCourse = async (courseId, data) => {
  try {
    await updateDoc(doc(db, "courses", courseId), data);
  } catch (e) {
    throw e;
  }
};

// Get courses a student is enrolled in via their enrollments
export const getStudentCourses = async (studentId) => {
  try {
    const enrollments = await getEnrollmentsByStudent(studentId);
    if (enrollments.length === 0) return [];
    const courseIds = [
      ...new Set(enrollments.map((e) => e.courseId).filter(Boolean)),
    ];
    const courses = [];
    for (const courseId of courseIds) {
      const snap = await getDoc(doc(db, "courses", courseId));
      if (snap.exists()) courses.push({ id: snap.id, ...snap.data() });
    }
    return courses;
  } catch (e) {
    return [];
  }
};

// ─── CLASSES ──────────────────────────────────────────────────────────────────

export const getAllClasses = async () => {
  try {
    const snap = await getDocs(collection(db, "classes"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
};

// Get classes for a specific lecturer by Firebase UID
export const getClassesByLecturer = async (lecturerId) => {
  try {
    const q = query(
      collection(db, "classes"),
      where("lecturerId", "==", lecturerId),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
};

// Get classes a student is enrolled in
export const getClassesByStudent = async (studentId) => {
  try {
    const enrollments = await getEnrollmentsByStudent(studentId);
    if (enrollments.length === 0) return [];
    const classIds = [
      ...new Set(enrollments.map((e) => e.classId).filter(Boolean)),
    ];
    const classes = [];
    for (const classId of classIds) {
      const snap = await getDoc(doc(db, "classes", classId));
      if (snap.exists()) classes.push({ id: snap.id, ...snap.data() });
    }
    return classes;
  } catch (e) {
    return [];
  }
};

// Add a class — auto-enrolls ALL registered students
export const addClass = async (classData) => {
  try {
    const docRef = await addDoc(collection(db, "classes"), {
      ...classData,
      createdAt: serverTimestamp(),
    });
    // Auto-enroll all existing students
    const students = await getAllStudents();
    if (students.length > 0) {
      await Promise.all(
        students.map((s) =>
          enrollStudentInClass({
            studentId: s.id,
            studentName: s.name || "",
            studentEmail: s.email || "",
            classId: docRef.id,
            className: classData.className || "",
            courseId: classData.courseId || "",
            courseName: classData.courseName || "",
            courseCode: classData.courseCode || "",
            lecturerId: classData.lecturerId || "",
            lecturerName: classData.lecturerName || "",
          }),
        ),
      );
    }
    return docRef;
  } catch (e) {
    throw e;
  }
};

// ─── ENROLLMENTS ──────────────────────────────────────────────────────────────

export const enrollStudentInClass = async (data) => {
  try {
    // Prevent duplicate enrollments
    const existing = await getDocs(
      query(
        collection(db, "enrollments"),
        where("studentId", "==", data.studentId),
        where("classId", "==", data.classId),
      ),
    );
    if (existing.empty) {
      return await addDoc(collection(db, "enrollments"), {
        ...data,
        enrolledAt: serverTimestamp(),
      });
    }
  } catch (e) {
    console.log("enrollStudentInClass error:", e);
  }
};

export const getEnrollmentsByStudent = async (studentId) => {
  try {
    const q = query(
      collection(db, "enrollments"),
      where("studentId", "==", studentId),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
};

export const getEnrollmentsByClass = async (classId) => {
  try {
    const q = query(
      collection(db, "enrollments"),
      where("classId", "==", classId),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
};

// When a NEW student registers — enroll them in ALL existing classes
export const enrollNewStudentInAllClasses = async (
  studentId,
  studentName,
  studentEmail,
) => {
  try {
    const classes = await getAllClasses();
    if (classes.length === 0) return;
    await Promise.all(
      classes.map((cls) =>
        enrollStudentInClass({
          studentId,
          studentName: studentName || "",
          studentEmail: studentEmail || "",
          classId: cls.id,
          className: cls.className || "",
          courseId: cls.courseId || "",
          courseName: cls.courseName || "",
          courseCode: cls.courseCode || "",
          lecturerId: cls.lecturerId || "",
          lecturerName: cls.lecturerName || "",
        }),
      ),
    );
  } catch (e) {
    console.log("enrollNewStudentInAllClasses error:", e);
  }
};

// ─── REPORTS ──────────────────────────────────────────────────────────────────

export const submitReport = async (reportData) => {
  try {
    return await addDoc(collection(db, "reports"), {
      ...reportData,
      createdAt: serverTimestamp(),
      status: "Pending",
      prlFeedback: "",
    });
  } catch (e) {
    throw e;
  }
};

export const getReportsByLecturer = async (lecturerId) => {
  try {
    const q = query(
      collection(db, "reports"),
      where("lecturerId", "==", lecturerId),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
};

export const getAllReports = async () => {
  try {
    const snap = await getDocs(collection(db, "reports"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
};

export const addFeedbackToReport = async (reportId, feedback) => {
  try {
    await updateDoc(doc(db, "reports", reportId), {
      prlFeedback: feedback,
      status: "Reviewed",
    });
  } catch (e) {
    throw e;
  }
};

export const getStudentReports = async () => getAllReports();

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────

export const saveAttendance = async (data) => {
  try {
    return await addDoc(collection(db, "attendance"), {
      ...data,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    throw e;
  }
};

// Get attendance records for a specific student by their Firebase UID
export const getStudentAttendance = async (studentId) => {
  try {
    const q = query(
      collection(db, "attendance"),
      where("studentId", "==", studentId),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
};

export const getAttendanceByClass = async (classId) => {
  try {
    const q = query(
      collection(db, "attendance"),
      where("classId", "==", classId),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
};

// ─── RATINGS ──────────────────────────────────────────────────────────────────

export const submitRating = async (ratingData) => {
  try {
    return await addDoc(collection(db, "ratings"), {
      ...ratingData,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    throw e;
  }
};

export const getRatingsByLecturer = async (lecturerId) => {
  try {
    const q = query(
      collection(db, "ratings"),
      where("lecturerId", "==", lecturerId),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
};

export const getAllRatings = async () => {
  try {
    const snap = await getDocs(collection(db, "ratings"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
};

export const getStudentRatings = async (studentId) => {
  try {
    const q = query(
      collection(db, "ratings"),
      where("studentId", "==", studentId),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
};
