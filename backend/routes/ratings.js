// backend/routes/ratings.js
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");

// Submit rating (Student only)
router.post("/", protect, authorize("student"), async (req, res) => {
  try {
    const db = req.db;
    const ratingData = {
      ...req.body,
      studentId: req.user.uid,
      studentName: req.userData.name,
      createdAt: new Date().toISOString(),
    };
    const docRef = await db.collection("ratings").add(ratingData);
    res.status(201).json({ id: docRef.id, ...ratingData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get my ratings — Lecturer gets ratings given TO them, Student gets ratings THEY submitted
router.get("/my-ratings", protect, authorize("lecturer", "student"), async (req, res) => {
  try {
    const db = req.db;
    let snapshot;

    if (req.userRole === "lecturer") {
      snapshot = await db
        .collection("ratings")
        .where("lecturerId", "==", req.user.uid)
        .get();
    } else {
      // student
      snapshot = await db
        .collection("ratings")
        .where("studentId", "==", req.user.uid)
        .get();
    }

    const ratings = [];
    snapshot.forEach((doc) => {
      ratings.push({ id: doc.id, ...doc.data() });
    });
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all ratings (PRL, PL)
router.get("/all", protect, authorize("prl", "pl"), async (req, res) => {
  try {
    const db = req.db;
    const snapshot = await db.collection("ratings").get();
    const ratings = [];
    snapshot.forEach((doc) => {
      ratings.push({ id: doc.id, ...doc.data() });
    });
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;