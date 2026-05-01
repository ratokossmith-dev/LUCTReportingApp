const express = require("express");
const admin = require("firebase-admin");
const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password, name, role, facultyName } = req.body;
    const db = req.db;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Please provide all required fields" });
    }

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    await db.collection("users").doc(userRecord.uid).set({
      id: userRecord.uid,
      name,
      email,
      role: role || "student",
      facultyName: facultyName || "Faculty of ICT",
      createdAt: new Date().toISOString(),
      status: "Active",
    });

    if (role === "student") {
      const coursesSnapshot = await db.collection("courses").get();

      for (const courseDoc of coursesSnapshot.docs) {
        const course = courseDoc.data();
        const studentIds = course.studentIds || [];

        if (!studentIds.includes(userRecord.uid)) {
          await db.collection("courses").doc(courseDoc.id).update({
            studentIds: [...studentIds, userRecord.uid],
          });

          const classesSnapshot = await db
            .collection("classes")
            .where("courseId", "==", courseDoc.id)
            .get();

          for (const classDoc of classesSnapshot.docs) {
            const existingEnrollment = await db
              .collection("enrollments")
              .where("studentId", "==", userRecord.uid)
              .where("classId", "==", classDoc.id)
              .get();

            if (existingEnrollment.empty) {
              await db.collection("enrollments").add({
                studentId: userRecord.uid,
                studentName: name,
                studentEmail: email,
                classId: classDoc.id,
                className: classDoc.data().className,
                courseId: courseDoc.id,
                courseName: course.courseName,
                courseCode: course.courseCode,
                lecturerId: classDoc.data().lecturerId,
                lecturerName: classDoc.data().lecturerName,
                enrolledAt: new Date().toISOString(),
              });
            }
          }
        }
      }
    }

    const token = await admin.auth().createCustomToken(userRecord.uid);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      uid: userRecord.uid,
      token: token,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(400).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = req.db;

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(401).json({ error: data.error.message });
    }

    const userDoc = await db.collection("users").doc(data.localId).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    if (!userData) {
      return res.status(404).json({ error: "User profile not found" });
    }

    res.json({
      success: true,
      token: data.idToken,
      refreshToken: data.refreshToken,
      uid: data.localId,
      user: {
        id: data.localId,
        email: data.email,
        name: userData.name,
        role: userData.role,
        facultyName: userData.facultyName,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/me", async (req, res) => {
  try {
    const db = req.db;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const idToken = authHeader.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(idToken);

    const userDoc = await db.collection("users").doc(decoded.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User profile not found" });
    }

    const userData = userDoc.data();

    res.json({
      success: true,
      user: {
        id: decoded.uid,
        email: decoded.email,
        name: userData.name,
        role: userData.role,
        facultyName: userData.facultyName,
        status: userData.status,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

module.exports = router;