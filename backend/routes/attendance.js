const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('lecturer'), async (req, res) => {
  try {
    const db = req.db;
    const { studentId, classId, date, present, studentName, className, courseName, courseCode, lecturerId, lecturerName } = req.body;

    const existing = await db
      .collection('attendance')
      .where('studentId', '==', studentId)
      .where('classId', '==', classId)
      .where('date', '==', date)
      .get();

    const attendanceData = {
      studentId,
      studentName: studentName || '',
      classId,
      className: className || '',
      courseName: courseName || '',
      courseCode: courseCode || '',
      lecturerId: lecturerId || req.user.uid,
      lecturerName: lecturerName || req.userData.name,
      date,
      present,
      updatedAt: new Date().toISOString(),
    };

    if (!existing.empty) {
      await db.collection('attendance').doc(existing.docs[0].id).update(attendanceData);
    } else {
      attendanceData.createdAt = new Date().toISOString();
      await db.collection('attendance').add(attendanceData);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Save attendance error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/class/:classId', protect, authorize('lecturer', 'pl', 'prl'), async (req, res) => {
  try {
    const db = req.db;
    const { classId } = req.params;

    const snapshot = await db
      .collection('enrollments')
      .where('classId', '==', classId)
      .get();

    const enrollments = [];
    snapshot.forEach((doc) => {
      enrollments.push({ id: doc.id, ...doc.data() });
    });

    res.json(enrollments);
  } catch (error) {
    console.error('Get class enrollments error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/my-attendance', protect, authorize('student'), async (req, res) => {
  try {
    const db = req.db;
    const snapshot = await db
      .collection('attendance')
      .where('studentId', '==', req.user.uid)
      .get();

    const attendance = [];
    snapshot.forEach((doc) => {
      attendance.push({ id: doc.id, ...doc.data() });
    });

    res.json(attendance);
  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/student/:studentId', protect, authorize('student', 'lecturer', 'pl', 'prl'), async (req, res) => {
  try {
    const db = req.db;
    const { studentId } = req.params;

    const snapshot = await db
      .collection('attendance')
      .where('studentId', '==', studentId)
      .get();

    const attendance = [];
    snapshot.forEach((doc) => {
      attendance.push({ id: doc.id, ...doc.data() });
    });

    res.json(attendance);
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;