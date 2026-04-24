// backend/routes/users.js
const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const { protect, authorize } = require("../middleware/auth");

// Get all users (PL only)
router.get("/", protect, authorize("pl"), async (req, res) => {
  try {
    const db = req.db;
    const snapshot = await db.collection("users").get();
    const users = [];
    snapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all students (PL, PRL, Lecturer)
router.get("/students", protect, authorize("pl", "prl", "lecturer"), async (req, res) => {
  try {
    const db = req.db;
    const snapshot = await db
      .collection("users")
      .where("role", "==", "student")
      .get();

    const students = [];
    snapshot.forEach((doc) => {
      students.push({ id: doc.id, ...doc.data() });
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all lecturers (PL, PRL, Student — student needs this for rating screen)
router.get("/lecturers", protect, authorize("pl", "prl", "student"), async (req, res) => {
  try {
    const db = req.db;
    const snapshot = await db
      .collection("users")
      .where("role", "==", "lecturer")
      .get();

    const lecturers = [];
    snapshot.forEach((doc) => {
      lecturers.push({ id: doc.id, ...doc.data() });
    });
    res.json(lecturers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get students NOT enrolled in a specific course (PL, PRL, Lecturer)
router.get("/students-not-in-course/:courseId", protect, authorize("pl", "prl", "lecturer"), async (req, res) => {
  try {
    const db = req.db;
    const { courseId } = req.params;

    const courseDoc = await db.collection("courses").doc(courseId).get();
    const enrolledIds = courseDoc.exists
      ? courseDoc.data().studentIds || []
      : [];

    const snapshot = await db
      .collection("users")
      .where("role", "==", "student")
      .get();

    const students = [];
    snapshot.forEach((doc) => {
      if (!enrolledIds.includes(doc.id)) {
        students.push({ id: doc.id, ...doc.data() });
      }
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create lecturer (PL only)
router.post("/lecturers", protect, authorize("pl"), async (req, res) => {
  try {
    const { email, password, name, facultyName } = req.body;

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    const db = req.db;
    await db.collection("users").doc(userRecord.uid).set({
      id: userRecord.uid,
      name,
      email,
      role: "lecturer",
      facultyName: facultyName || "Faculty of ICT",
      status: "Active",
      createdAt: new Date().toISOString(),
      createdBy: req.user.uid,
    });

    res.status(201).json({
      success: true,
      message: "Lecturer created successfully",
      uid: userRecord.uid,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;