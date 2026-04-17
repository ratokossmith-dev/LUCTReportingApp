import { createUserWithEmailAndPassword } from "firebase/auth";
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
import { auth } from "./auth";
import { db } from "./firebase";

// ───────────────── USERS ─────────────────

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getAllStudents = async () => {
  const q = query(collection(db, "users"), where("role", "==", "student"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getAllLecturers = async () => {
  const q = query(collection(db, "users"), where("role", "==", "lecturer"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getAllRegisteredStudents = async () => {
  const q = query(collection(db, "users"), where("role", "==", "student"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ───────────────── LECTURER MANAGEMENT (PL SIDE) ─────────────────

// Helper function to generate temporary password
const generateTempPassword = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Add lecturer with Firebase Auth account
export const addLecturer = async (lecturerData) => {
  try {
    // Generate a temporary password
    const tempPassword = generateTempPassword();

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      lecturerData.email.trim(),
      tempPassword,
    );

    const uid = userCredential.user.uid;

    // Save to Firestore
    await setDoc(doc(db, "users", uid), {
      name: lecturerData.name.trim(),
      email: lecturerData.email.trim(),
      role: "lecturer",
      facultyName: lecturerData.facultyName || "Faculty of ICT",
      status: "Active",
      createdAt: serverTimestamp(),
      createdBy: "pl",
      tempPassword: tempPassword,
    });

    return {
      success: true,
      uid,
      tempPassword,
      message: `Lecturer added successfully!`,
    };
  } catch (error) {
    console.log("Add lecturer error:", error);
    if (error.code === "auth/email-already-in-use") {
      throw new Error(
        "This email is already registered. Please use a different email.",
      );
    }
    throw error;
  }
};

// Update lecturer status (activate/deactivate)
export const updateLecturerStatus = async (lecturerId, status) => {
  await updateDoc(doc(db, "users", lecturerId), {
    status,
    updatedAt: serverTimestamp(),
  });
};

// Get lecturer by ID with full details
export const getLecturerById = async (lecturerId) => {
  const snap = await getDoc(doc(db, "users", lecturerId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// ───────────────── COURSES ─────────────────

export const getAllCourses = async () => {
  const snap = await getDocs(collection(db, "courses"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getCourseById = async (courseId) => {
  const snap = await getDoc(doc(db, "courses", courseId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getCoursesByLecturer = async (lecturerId) => {
  const q = query(
    collection(db, "courses"),
    where("lecturerIds", "array-contains", lecturerId),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getAvailableCoursesForLecturer = async (lecturerId) => {
  const q = query(
    collection(db, "courses"),
    where("lecturerIds", "array-contains", lecturerId),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getCoursesByPL = async () => {
  const snap = await getDocs(collection(db, "courses"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const addCourse = async (courseData) => {
  return await addDoc(collection(db, "courses"), {
    ...courseData,
    lecturerIds: courseData.lecturerIds || [],
    studentIds: courseData.studentIds || [],
    createdAt: serverTimestamp(),
    status: "Active",
  });
};

export const assignLecturersToCourse = async (courseId, lecturers) => {
  await updateDoc(doc(db, "courses", courseId), {
    lecturerIds: lecturers,
  });
};

export const assignStudentsToCourse = async (courseId, studentIds) => {
  await updateDoc(doc(db, "courses", courseId), {
    studentIds,
  });
};

export const attachLecturerAndStudentsToCourse = async (
  courseId,
  lecturerIds,
  studentIds,
) => {
  await updateDoc(doc(db, "courses", courseId), {
    lecturerIds,
    studentIds,
  });
};

// ───────────────── STUDENT SPECIFIC FUNCTIONS ─────────────────

export const getStudentCourses = async (studentId) => {
  const coursesSnap = await getDocs(collection(db, "courses"));
  const courses = coursesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const studentCourses = courses.filter(
    (course) => course.studentIds && course.studentIds.includes(studentId),
  );

  const enriched = await Promise.all(
    studentCourses.map(async (course) => {
      const lecturers = [];
      if (course.lecturerIds && course.lecturerIds.length > 0) {
        for (const lecturerId of course.lecturerIds) {
          const lecturerSnap = await getDoc(doc(db, "users", lecturerId));
          if (lecturerSnap.exists()) {
            lecturers.push(lecturerSnap.data().name);
          }
        }
      }
      return {
        ...course,
        lecturerName: lecturers.join(", ") || "Not Assigned",
      };
    }),
  );

  return enriched;
};

export const getStudentAttendance = async (studentId) => {
  const q = query(
    collection(db, "attendance"),
    where("studentId", "==", studentId),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getStudentRatings = async (studentId) => {
  const q = query(
    collection(db, "ratings"),
    where("studentId", "==", studentId),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const submitRating = async (ratingData) => {
  return await addDoc(collection(db, "ratings"), {
    ...ratingData,
    createdAt: serverTimestamp(),
  });
};

export const getClassesByStudent = async (studentId) => {
  const q = query(
    collection(db, "enrollments"),
    where("studentId", "==", studentId),
  );
  const snap = await getDocs(q);
  const enrollments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const classes = [];
  for (const enrollment of enrollments) {
    const classSnap = await getDoc(doc(db, "classes", enrollment.classId));
    if (classSnap.exists()) {
      classes.push({ id: classSnap.id, ...classSnap.data() });
    }
  }

  return classes;
};

// ───────────────── CLASSES ─────────────────

export const addClass = async (classData) => {
  const docRef = await addDoc(collection(db, "classes"), {
    ...classData,
    createdAt: serverTimestamp(),
  });

  const courseSnap = await getDoc(doc(db, "courses", classData.courseId));

  if (courseSnap.exists()) {
    const course = courseSnap.data();
    const studentIds = course.studentIds || [];

    for (const studentId of studentIds) {
      const studentSnap = await getDoc(doc(db, "users", studentId));
      if (studentSnap.exists()) {
        const student = studentSnap.data();
        await enrollStudentInClass({
          studentId: studentId,
          studentName: student.name,
          studentEmail: student.email,
          classId: docRef.id,
          className: classData.className,
          courseId: classData.courseId,
          courseName: classData.courseName,
          courseCode: classData.courseCode,
          lecturerId: classData.lecturerId,
          lecturerName: classData.lecturerName,
        });
      }
    }
  }

  return docRef;
};

export const getClassesByLecturer = async (lecturerId) => {
  const q = query(
    collection(db, "classes"),
    where("lecturerId", "==", lecturerId),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getAllClasses = async () => {
  const snap = await getDocs(collection(db, "classes"));
  const classes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const enriched = await Promise.all(
    classes.map(async (cls) => {
      const enrollments = await getEnrollmentsByClass(cls.id);
      return { ...cls, totalStudents: enrollments.length };
    }),
  );
  return enriched;
};

export const getClassById = async (classId) => {
  const snap = await getDoc(doc(db, "classes", classId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// ───────────────── ENROLLMENTS ─────────────────

export const enrollStudentInClass = async (data) => {
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
};

export const enrollNewStudentInAllClasses = async (
  studentId,
  studentName,
  studentEmail,
) => {
  const classesSnap = await getDocs(collection(db, "classes"));
  const classes = classesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  for (const cls of classes) {
    const existing = await getDocs(
      query(
        collection(db, "enrollments"),
        where("studentId", "==", studentId),
        where("classId", "==", cls.id),
      ),
    );

    if (existing.empty) {
      await addDoc(collection(db, "enrollments"), {
        studentId,
        studentName,
        studentEmail,
        classId: cls.id,
        className: cls.className,
        courseId: cls.courseId,
        courseName: cls.courseName,
        courseCode: cls.courseCode,
        lecturerId: cls.lecturerId,
        lecturerName: cls.lecturerName,
        enrolledAt: serverTimestamp(),
      });
    }
  }
};

export const getEnrollmentsByClass = async (classId) => {
  const q = query(
    collection(db, "enrollments"),
    where("classId", "==", classId),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getStudentsByClass = async (classId) => {
  const enrollments = await getEnrollmentsByClass(classId);
  return enrollments.map((e) => ({
    studentId: e.studentId,
    studentName: e.studentName,
    studentEmail: e.studentEmail,
  }));
};

export const getEnrolledStudentsWithDetails = async (classId) => {
  const enrollments = await getEnrollmentsByClass(classId);
  const students = [];

  for (const enrollment of enrollments) {
    const userSnap = await getDoc(doc(db, "users", enrollment.studentId));
    if (userSnap.exists()) {
      students.push({
        id: enrollment.studentId,
        name: enrollment.studentName,
        email: enrollment.studentEmail,
        ...userSnap.data(),
      });
    } else {
      students.push({
        id: enrollment.studentId,
        name: enrollment.studentName,
        email: enrollment.studentEmail,
      });
    }
  }

  return students;
};

export const manuallyEnrollStudentsInClass = async (classId, students) => {
  const classSnap = await getDoc(doc(db, "classes", classId));
  const classData = classSnap.data();

  for (const student of students) {
    const existing = await getDocs(
      query(
        collection(db, "enrollments"),
        where("studentId", "==", student.id),
        where("classId", "==", classId),
      ),
    );

    if (existing.empty) {
      await addDoc(collection(db, "enrollments"), {
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        classId,
        className: classData.className,
        courseId: classData.courseId,
        courseName: classData.courseName,
        courseCode: classData.courseCode,
        lecturerId: classData.lecturerId,
        lecturerName: classData.lecturerName,
        enrolledAt: serverTimestamp(),
      });
    }
  }
};

// ───────────────── ATTENDANCE ─────────────────

export const saveAttendance = async (data) => {
  const existing = await getDocs(
    query(
      collection(db, "attendance"),
      where("studentId", "==", data.studentId),
      where("classId", "==", data.classId),
      where("date", "==", data.date),
    ),
  );

  if (!existing.empty) {
    const existingDoc = existing.docs[0];
    await updateDoc(doc(db, "attendance", existingDoc.id), {
      present: data.present,
      updatedAt: serverTimestamp(),
    });
    return existingDoc.id;
  }

  return await addDoc(collection(db, "attendance"), {
    ...data,
    createdAt: serverTimestamp(),
  });
};

export const getAttendanceByClass = async (classId) => {
  const q = query(
    collection(db, "attendance"),
    where("classId", "==", classId),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getAttendanceByClassAndDate = async (classId, date) => {
  const q = query(
    collection(db, "attendance"),
    where("classId", "==", classId),
    where("date", "==", date),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getAttendanceByStudent = async (studentId) => {
  const q = query(
    collection(db, "attendance"),
    where("studentId", "==", studentId),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ───────────────── REPORTS ─────────────────

export const submitReport = async (reportData) => {
  return await addDoc(collection(db, "reports"), {
    ...reportData,
    status: "Pending",
    prlFeedback: null,
    reviewedAt: null,
    createdAt: serverTimestamp(),
  });
};

export const getReportsByLecturer = async (lecturerId) => {
  const q = query(
    collection(db, "reports"),
    where("lecturerId", "==", lecturerId),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getAllReports = async () => {
  const snap = await getDocs(collection(db, "reports"));
  const reports = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return reports.sort((a, b) => {
    if (a.createdAt && b.createdAt) {
      return b.createdAt.seconds - a.createdAt.seconds;
    }
    return 0;
  });
};

export const getReportsByClass = async (classId) => {
  const q = query(collection(db, "reports"), where("classId", "==", classId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getPendingReports = async () => {
  const q = query(collection(db, "reports"), where("status", "==", "Pending"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const updateReportStatus = async (reportId, status, feedback = "") => {
  await updateDoc(doc(db, "reports", reportId), {
    status,
    prlFeedback: feedback,
    reviewedAt: serverTimestamp(),
  });
};

// 🔥 CRITICAL: Function used by PRLReports.js
export const addFeedbackToReport = async (reportId, feedback) => {
  await updateDoc(doc(db, "reports", reportId), {
    prlFeedback: feedback,
    status: "Reviewed",
    reviewedAt: serverTimestamp(),
  });
};

// ───────────────── RATINGS (ENHANCED) ─────────────────

export const getRatingsByLecturer = async (lecturerId) => {
  const q = query(
    collection(db, "ratings"),
    where("lecturerId", "==", lecturerId),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getAllRatings = async () => {
  const snap = await getDocs(collection(db, "ratings"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getAverageRatingByLecturer = async (lecturerId) => {
  const ratings = await getRatingsByLecturer(lecturerId);
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
  return (sum / ratings.length).toFixed(1);
};

// ───────────────── DASHBOARD STATS ─────────────────

export const getSystemStats = async () => {
  const usersSnap = await getDocs(collection(db, "users"));
  const coursesSnap = await getDocs(collection(db, "courses"));
  const classesSnap = await getDocs(collection(db, "classes"));
  const reportsSnap = await getDocs(collection(db, "reports"));
  const ratingsSnap = await getDocs(collection(db, "ratings"));

  const users = usersSnap.docs.map((d) => d.data());

  return {
    totalStudents: users.filter((u) => u.role === "student").length,
    totalLecturers: users.filter((u) => u.role === "lecturer").length,
    totalCourses: coursesSnap.size,
    totalClasses: classesSnap.size,
    totalReports: reportsSnap.size,
    totalRatings: ratingsSnap.size,
    pendingReports: (await getPendingReports()).length,
  };
};
