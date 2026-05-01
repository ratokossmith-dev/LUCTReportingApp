const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const { protect, authorize } = require("../middleware/auth");

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

router.get("/students", protect, authorize("pl", "prl", "lecturer"), async (req, res) => {
  try {
    const db = req.db;
    const snapshot = await db.collection("users").where("role", "==", "student").get();
    const students = [];
    snapshot.forEach((doc) => {
      students.push({ id: doc.id, ...doc.data() });
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/lecturers", protect, authorize("pl", "prl", "student"), async (req, res) => {
  try {
    const db = req.db;
    const snapshot = await db.collection("users").where("role", "==", "lecturer").get();
    const lecturers = [];
    snapshot.forEach((doc) => {
      lecturers.push({ id: doc.id, ...doc.data() });
    });
    res.json(lecturers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/students-not-in-course/:courseId", protect, authorize("pl", "prl", "lecturer"), async (req, res) => {
  try {
    const db = req.db;
    const { courseId } = req.params;

    const courseDoc = await db.collection("courses").doc(courseId).get();
    const enrolledIds = courseDoc.exists ? courseDoc.data().studentIds || [] : [];

    const snapshot = await db.collection("users").where("role", "==", "student").get();
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

router.delete("/:userId", protect, authorize("pl"), async (req, res) => {
  try {
    const db = req.db;
    const { userId } = req.params;

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    const userRole = userData.role;

    if (userRole === "lecturer") {
      const coursesSnapshot = await db.collection("courses").get();
      for (const courseDoc of coursesSnapshot.docs) {
        const course = courseDoc.data();
        if (course.lecturerIds && course.lecturerIds.includes(userId)) {
          const updatedIds = course.lecturerIds.filter(id => id !== userId);
          await db.collection("courses").doc(courseDoc.id).update({ lecturerIds: updatedIds });
        }
      }
      
      const reportsSnapshot = await db.collection("reports").where("lecturerId", "==", userId).get();
      for (const reportDoc of reportsSnapshot.docs) {
        await db.collection("reports").doc(reportDoc.id).delete();
      }
      
      const ratingsSnapshot = await db.collection("ratings").where("lecturerId", "==", userId).get();
      for (const ratingDoc of ratingsSnapshot.docs) {
        await db.collection("ratings").doc(ratingDoc.id).delete();
      }
    }

    if (userRole === "student") {
      const coursesSnapshot = await db.collection("courses").get();
      for (const courseDoc of coursesSnapshot.docs) {
        const course = courseDoc.data();
        if (course.studentIds && course.studentIds.includes(userId)) {
          const updatedIds = course.studentIds.filter(id => id !== userId);
          await db.collection("courses").doc(courseDoc.id).update({ studentIds: updatedIds });
        }
      }
      
      const enrollmentsSnapshot = await db.collection("enrollments").where("studentId", "==", userId).get();
      for (const enrollmentDoc of enrollmentsSnapshot.docs) {
        await db.collection("enrollments").doc(enrollmentDoc.id).delete();
      }
      
      const attendanceSnapshot = await db.collection("attendance").where("studentId", "==", userId).get();
      for (const attendanceDoc of attendanceSnapshot.docs) {
        await db.collection("attendance").doc(attendanceDoc.id).delete();
      }
      
      const ratingsSnapshot = await db.collection("ratings").where("studentId", "==", userId).get();
      for (const ratingDoc of ratingsSnapshot.docs) {
        await db.collection("ratings").doc(ratingDoc.id).delete();
      }
    }

    try {
      await admin.auth().deleteUser(userId);
    } catch (authError) {
      console.log("Auth user not found:", authError.message);
    }

    await userRef.delete();
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;