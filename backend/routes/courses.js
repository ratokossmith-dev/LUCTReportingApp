const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const db = req.db;
    const snapshot = await db.collection('courses').get();
    const courses = [];
    snapshot.forEach((doc) => courses.push({ id: doc.id, ...doc.data() }));
    res.json(courses);
  } catch (error) {
    console.error('Get all courses error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/my-courses', protect, async (req, res) => {
  try {
    const db = req.db;
    const role = req.userRole;
    let snapshot;

    if (role === 'lecturer') {
      snapshot = await db
        .collection('courses')
        .where('lecturerIds', 'array-contains', req.user.uid)
        .get();
    } else if (role === 'student') {
      snapshot = await db
        .collection('courses')
        .where('studentIds', 'array-contains', req.user.uid)
        .get();
    } else {
      snapshot = await db.collection('courses').get();
    }

    const courses = [];
    snapshot.forEach((doc) => courses.push({ id: doc.id, ...doc.data() }));
    res.json(courses);
  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/available-for-lecturer/:lecturerId', protect, authorize('lecturer'), async (req, res) => {
  try {
    const db = req.db;
    const { lecturerId } = req.params;

    const snapshot = await db
      .collection('courses')
      .where('lecturerIds', 'array-contains', lecturerId)
      .get();

    const courses = [];
    snapshot.forEach((doc) => courses.push({ id: doc.id, ...doc.data() }));
    res.json(courses);
  } catch (error) {
    console.error('Get available courses for lecturer error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', protect, authorize('pl'), async (req, res) => {
  try {
    const db = req.db;
    const { courseName, courseCode, semester, lecturerIds, studentIds } = req.body;

    const newCourse = {
      courseName,
      courseCode,
      semester: semester || 1,
      lecturerIds: lecturerIds || [],
      studentIds: studentIds || [],
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection('courses').add(newCourse);
    res.status(201).json({ id: docRef.id, ...newCourse });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:courseId', protect, authorize('pl'), async (req, res) => {
  try {
    const db = req.db;
    const { courseId } = req.params;
    await db.collection('courses').doc(courseId).update({
      ...req.body,
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:courseId/assign-lecturers', protect, authorize('pl'), async (req, res) => {
  try {
    const db = req.db;
    const { courseId } = req.params;
    const { lecturerIds } = req.body;
    await db.collection('courses').doc(courseId).update({
      lecturerIds,
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Assign lecturers error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:courseId/assign-students', protect, authorize('pl', 'lecturer'), async (req, res) => {
  try {
    const db = req.db;
    const { courseId } = req.params;
    const { studentIds } = req.body;

    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const existing = courseDoc.data().studentIds || [];
    const merged = [...new Set([...existing, ...studentIds])];

    await db.collection('courses').doc(courseId).update({
      studentIds: merged,
      updatedAt: new Date().toISOString(),
    });

    for (const studentId of studentIds) {
      const student = await db.collection('users').doc(studentId).get();
      if (student.exists) {
        const classesSnapshot = await db
          .collection('classes')
          .where('courseId', '==', courseId)
          .get();

        for (const classDoc of classesSnapshot.docs) {
          const existingEnrollment = await db
            .collection('enrollments')
            .where('studentId', '==', studentId)
            .where('classId', '==', classDoc.id)
            .get();

          if (existingEnrollment.empty) {
            await db.collection('enrollments').add({
              studentId,
              studentName: student.data().name,
              studentEmail: student.data().email,
              classId: classDoc.id,
              className: classDoc.data().className,
              courseId,
              courseName: courseDoc.data().courseName,
              courseCode: courseDoc.data().courseCode,
              lecturerId: classDoc.data().lecturerId,
              lecturerName: classDoc.data().lecturerName,
              enrolledAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Assign students error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:courseId', protect, authorize('pl'), async (req, res) => {
  try {
    const db = req.db;
    const { courseId } = req.params;

    const courseRef = db.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();

    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const classesSnapshot = await db
      .collection('classes')
      .where('courseId', '==', courseId)
      .get();

    for (const classDoc of classesSnapshot.docs) {
      const attendanceSnapshot = await db
        .collection('attendance')
        .where('classId', '==', classDoc.id)
        .get();

      for (const attendanceDoc of attendanceSnapshot.docs) {
        await db.collection('attendance').doc(attendanceDoc.id).delete();
      }

      const enrollmentsSnapshot = await db
        .collection('enrollments')
        .where('classId', '==', classDoc.id)
        .get();

      for (const enrollmentDoc of enrollmentsSnapshot.docs) {
        await db.collection('enrollments').doc(enrollmentDoc.id).delete();
      }

      const reportsSnapshot = await db
        .collection('reports')
        .where('classId', '==', classDoc.id)
        .get();

      for (const reportDoc of reportsSnapshot.docs) {
        await db.collection('reports').doc(reportDoc.id).delete();
      }

      await db.collection('classes').doc(classDoc.id).delete();
    }

    await courseRef.delete();
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;