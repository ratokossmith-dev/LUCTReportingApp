// backend/routes/attendance.js
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");

// Save attendance (Lecturer only)
router.post("/", protect, authorize("lecturer"), async (req, res) => {
  try {
    const db = req.db;
    const { studentId, classId, date, present } = req.body;

    const existing = await db
      .collection("attendance")
      .where("studentId", "==", studentId)
      .where("classId", "==", classId)
      .where("date", "==", date)
      .get();

    if (!existing.empty) {
      await db.collection("attendance").doc(existing.docs[0].id).update({
        present,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await db.collection("attendance").add({
        studentId,
        classId,
        date,
        present,
        createdAt: new Date().toISOString(),
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get enrollments for a class — used by lecturer attendance screen
// Returns enrollments (not raw attendance) so lecturer can see who is enrolled
router.get("/class/:classId", protect, authorize("lecturer", "pl", "prl"), async (req, res) => {
  try {
    const db = req.db;
    const { classId } = req.params;

    // Return enrollments for this class so the lecturer sees who to mark
    const snapshot = await db
      .collection("enrollments")
      .where("classId", "==", classId)
      .get();

    const enrollments = [];
    snapshot.forEach((doc) => {
      enrollments.push({ id: doc.id, ...doc.data() });
    });

    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get student's own attendance (Student only)
router.get("/my-attendance", protect, authorize("student"), async (req, res) => {
  try {
    const db = req.db;
    const snapshot = await db
      .collection("attendance")
      .where("studentId", "==", req.user.uid)
      .get();

    const attendance = [];
    snapshot.forEach((doc) => {
      attendance.push({ id: doc.id, ...doc.data() });
    });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance records for a specific student (for student monitoring)
router.get("/student/:studentId", protect, authorize("student", "lecturer", "pl", "prl"), async (req, res) => {
  try {
    const db = req.db;
    const { studentId } = req.params;

    const snapshot = await db
      .collection("attendance")
      .where("studentId", "==", studentId)
      .get();

    const attendance = [];
    snapshot.forEach((doc) => {
      attendance.push({ id: doc.id, ...doc.data() });
    });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;