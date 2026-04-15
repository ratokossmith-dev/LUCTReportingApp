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

// ─── USERS ───────────────────────────────────────
export const getUserProfile = async (uid) => {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (e) {
    return null;
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

export const getAllStudents = async () => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "student"));
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

// ─── REPORTS ─────────────────────────────────────
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
    });
  } catch (e) {
    throw e;
  }
};

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

// ─── RATINGS ─────────────────────────────────────
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
  }
};
