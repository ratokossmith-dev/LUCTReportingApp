// backend/routes/classes.js
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");

// Get all classes (PL, PRL)
router.get("/", protect, async (req, res) => {
  try {
    const db = req.db;
    const snapshot = await db.collection("classes").get();
    const classes = [];

    for (const doc of snapshot.docs) {
      const classData = { id: doc.id, ...doc.data() };
      const enrollments = await db
        .collection("enrollments")
        .where("classId", "==", doc.id)
        .get();
      classData.totalStudents = enrollments.size;
      classes.push(classData);
    }
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get classes for the logged in user
// Lecturer gets classes they teach, Student gets classes they are enrolled in
router.get("/my-classes", protect, async (req, res) => {
  try {
    const db = req.db;
    const role = req.userRole;

    if (role === "lecturer") {
      const snapshot = await db
        .collection("classes")
        .where("lecturerId", "==", req.user.uid)
        .get();

      const classes = [];
      snapshot.forEach((doc) => {
        classes.push({ id: doc.id, ...doc.data() });
      });
      return res.json(classes);
    }

    if (role === "student") {
      // Get enrollments for this student then fetch the class details
      const enrollSnapshot = await db
        .collection("enrollments")
        .where("studentId", "==", req.user.uid)
        .get();

      const classes = [];
      enrollSnapshot.forEach((doc) => {
        classes.push({ id: doc.id, ...doc.data() });
      });
      return res.json(classes);
    }

    // PL/PRL get all classes
    const snapshot = await db.collection("classes").get();
    const classes = [];
    snapshot.forEach((doc) => {
      classes.push({ id: doc.id, ...doc.data() });
    });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create class (Lecturer only)
router.post("/", protect, authorize("lecturer"), async (req, res) => {
  try {
    const db = req.db;
    const {
      className, courseId, courseName,
      courseCode, venue, scheduledTime, day,
    } = req.body;

    const newClass = {
      className, courseId, courseName, courseCode,
      venue, scheduledTime, day,
      lecturerId: req.user.uid,
      lecturerName: req.userData.name,
      totalStudents: 0,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("classes").add(newClass);

    // Auto-enroll students already in the course
    const course = await db.collection("courses").doc(courseId).get();
    const studentIds = course.data()?.studentIds || [];

    for (const studentId of studentIds) {
      const student = await db.collection("users").doc(studentId).get();
      if (student.exists) {
        await db.collection("enrollments").add({
          studentId,
          studentName: student.data().name,
          studentEmail: student.data().email,
          classId: docRef.id,
          className,
          courseId,
          courseName,
          courseCode,
          lecturerId: req.user.uid,
          lecturerName: req.userData.name,
          enrolledAt: new Date().toISOString(),
        });
      }
    }

    res.status(201).json({ id: docRef.id, ...newClass });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete class (Lecturer only)
router.delete("/:classId", protect, authorize("lecturer"), async (req, res) => {
  try {
    const db = req.db;
    const { classId } = req.params;

    const enrollments = await db
      .collection("enrollments")
      .where("classId", "==", classId)
      .get();
    for (const doc of enrollments.docs) {
      await db.collection("enrollments").doc(doc.id).delete();
    }

    const attendance = await db
      .collection("attendance")
      .where("classId", "==", classId)
      .get();
    for (const doc of attendance.docs) {
      await db.collection("attendance").doc(doc.id).delete();
    }

    await db.collection("classes").doc(classId).delete();
    res.json({ success: true, message: "Class deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;