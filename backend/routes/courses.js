// backend/routes/courses.js
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");

// Get all courses (any authenticated user)
router.get("/", protect, async (req, res) => {
  try {
    const db = req.db;
    const snapshot = await db.collection("courses").get();
    const courses = [];
    snapshot.forEach((doc) => {
      courses.push({ id: doc.id, ...doc.data() });
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get courses for the logged in user based on their role
router.get("/my-courses", protect, async (req, res) => {
  try {
    const db = req.db;
    const role = req.userRole;
    let snapshot;

    if (role === "lecturer") {
      snapshot = await db
        .collection("courses")
        .where("lecturerIds", "array-contains", req.user.uid)
        .get();
    } else if (role === "student") {
      snapshot = await db
        .collection("courses")
        .where("studentIds", "array-contains", req.user.uid)
        .get();
    } else {
      snapshot = await db.collection("courses").get();
    }

    const courses = [];
    snapshot.forEach((doc) => {
      courses.push({ id: doc.id, ...doc.data() });
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create course (PL only)
router.post("/", protect, authorize("pl"), async (req, res) => {
  try {
    const db = req.db;
    const { courseName, courseCode, semester, lecturerIds, studentIds } =
      req.body;

    const newCourse = {
      courseName,
      courseCode,
      semester: semester || 1,
      lecturerIds: lecturerIds || [],
      studentIds: studentIds || [],
      status: "Active",
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("courses").add(newCourse);
    res.status(201).json({ id: docRef.id, ...newCourse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update course (PL only)
router.put("/:courseId", protect, authorize("pl"), async (req, res) => {
  try {
    const db = req.db;
    const { courseId } = req.params;
    await db
      .collection("courses")
      .doc(courseId)
      .update({ ...req.body, updatedAt: new Date().toISOString() });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign lecturers to course (PL only)
router.post("/:courseId/assign-lecturers", protect, authorize("pl"), async (req, res) => {
  try {
    const db = req.db;
    const { courseId } = req.params;
    const { lecturerIds } = req.body;
    await db.collection("courses").doc(courseId).update({
      lecturerIds,
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign students to course (PL, Lecturer, or Student joining themselves)
router.post("/:courseId/assign-students", protect, authorize("pl", "lecturer", "student"), async (req, res) => {
  try {
    const db = req.db;
    const { courseId } = req.params;
    const { studentIds } = req.body;

    // If student role, they can only add themselves
    const idsToAdd =
      req.userRole === "student" ? [req.user.uid] : studentIds || [];

    const courseDoc = await db.collection("courses").doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: "Course not found" });
    }

    const existing = courseDoc.data().studentIds || [];
    const merged = [...new Set([...existing, ...idsToAdd])];

    await db.collection("courses").doc(courseId).update({
      studentIds: merged,
      updatedAt: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;