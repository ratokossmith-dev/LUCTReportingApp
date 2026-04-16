import {
<<<<<<< HEAD
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

=======
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

// ─── USERS ───────────────────────────────────────
>>>>>>> 46e0c0d343859cd0b5abd6da7e5308c64cdfcba7
export const getUserProfile = async (uid) => {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (e) {
    return null;
  }
};

<<<<<<< HEAD
export const getAllStudents = async () => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "student"));
=======
export const getAllLecturers = async () => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "lecturer"));
>>>>>>> 46e0c0d343859cd0b5abd6da7e5308c64cdfcba7
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
};

<<<<<<< HEAD
export const getAllLecturers = async () => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "lecturer"));
=======
export const getAllStudents = async () => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "student"));
>>>>>>> 46e0c0d343859cd0b5abd6da7e5308c64cdfcba7
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

<<<<<<< HEAD
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

=======
// ─── REPORTS ─────────────────────────────────────
>>>>>>> 46e0c0d343859cd0b5abd6da7e5308c64cdfcba7
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

<<<<<<< HEAD
export const getStudentReports = async () => getAllReports();

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────

export const saveAttendance = async (data) => {
  try {
    return await addDoc(collection(db, "attendance"), {
      ...data,
      createdAt: serverTimestamp(),
=======
// ─── COURSES ─────────────────────────────────────
export const getAllCourses = async () => {
  try {
    const snap = await getDocs(collection(db, "courses"));
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
>>>>>>> 46e0c0d343859cd0b5abd6da7e5308c64cdfcba7
    });
  } catch (e) {
    throw e;
  }
};

<<<<<<< HEAD
// Get attendance records for a specific student by their Firebase UID
export const getStudentAttendance = async (studentId) => {
=======
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

export const updateCourse = async (courseId, data) => {
  try {
    await updateDoc(doc(db, "courses", courseId), data);
  } catch (e) {
    throw e;
  }
};

export const getStudentCourses = async (studentId) => {
  // You can filter by student's enrolled classes later
  return await getAllCourses();
};

// ─── CLASSES ─────────────────────────────────────
export const getAllClasses = async () => {
  try {
    const snap = await getDocs(collection(db, "classes"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
};

// Get classes for lecturer
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

// Add class AND automatically add registered students
export const addClass = async (classData) => {
  try {
    const newClassRef = await addDoc(collection(db, "classes"), {
      ...classData,
      createdAt: serverTimestamp(),
    });

    // Fetch all students and automatically “join” the class
    const students = await getAllStudents();
    const attendancePromises = students.map((stu) =>
      addDoc(collection(db, "attendance"), {
        classId: newClassRef.id,
        studentId: stu.id,
        present: false, // initially all absent
        timestamp: serverTimestamp(),
      }),
    );
    await Promise.all(attendancePromises);

    return newClassRef;
  } catch (e) {
    throw e;
  }
};

// ─── ATTENDANCE ───────────────────────────────────
export const saveAttendance = async (classId, attendanceData) => {
  try {
    // attendanceData: [{ studentId, present: true/false }]
    const promises = attendanceData.map(async (a) => {
      const q = query(
        collection(db, "attendance"),
        where("classId", "==", classId),
        where("studentId", "==", a.studentId),
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        await addDoc(collection(db, "attendance"), {
          classId,
          studentId: a.studentId,
          present: a.present,
          timestamp: serverTimestamp(),
        });
      } else {
        const docId = snap.docs[0].id;
        await updateDoc(doc(db, "attendance", docId), {
          present: a.present,
          timestamp: serverTimestamp(),
        });
      }
    });
    await Promise.all(promises);
  } catch (e) {
    throw e;
  }
};

export const getAttendanceByStudent = async (studentId) => {
>>>>>>> 46e0c0d343859cd0b5abd6da7e5308c64cdfcba7
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

<<<<<<< HEAD
// ─── RATINGS ──────────────────────────────────────────────────────────────────

=======
// ─── RATINGS ─────────────────────────────────────
>>>>>>> 46e0c0d343859cd0b5abd6da7e5308c64cdfcba7
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

<<<<<<< HEAD
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
=======
// ─── LECTURERS ────────────────────────────────────
export const addLecturer = async (lecturerData) => {
  try {
    return await addDoc(collection(db, "users"), {
      ...lecturerData,
      role: "lecturer",
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    throw e;
>>>>>>> 46e0c0d343859cd0b5abd6da7e5308c64cdfcba7
  }
};
