const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('lecturer'), async (req, res) => {
  try {
    const db = req.db;
    const reportData = {
      ...req.body,
      lecturerId: req.user.uid,
      lecturerName: req.userData.name,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    const docRef = await db.collection('reports').add(reportData);
    res.status(201).json({ id: docRef.id, ...reportData });
  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/my-reports', protect, authorize('lecturer'), async (req, res) => {
  try {
    const db = req.db;
    const snapshot = await db
      .collection('reports')
      .where('lecturerId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();

    const reports = [];
    snapshot.forEach((doc) => reports.push({ id: doc.id, ...doc.data() }));
    res.json(reports);
  } catch (error) {
    console.error('Get my reports error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/all', protect, authorize('prl', 'pl'), async (req, res) => {
  try {
    const db = req.db;
    const snapshot = await db
      .collection('reports')
      .orderBy('createdAt', 'desc')
      .get();

    const reports = [];
    snapshot.forEach((doc) => reports.push({ id: doc.id, ...doc.data() }));
    res.json(reports);
  } catch (error) {
    console.error('Get all reports error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:reportId/feedback', protect, authorize('prl'), async (req, res) => {
  try {
    const db = req.db;
    const { reportId } = req.params;
    const { feedback } = req.body;

    await db.collection('reports').doc(reportId).update({
      prlFeedback: feedback,
      status: 'Reviewed',
      reviewedAt: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Add feedback error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:reportId', protect, authorize('pl', 'prl'), async (req, res) => {
  try {
    const db = req.db;
    const { reportId } = req.params;

    const reportRef = db.collection('reports').doc(reportId);
    const reportDoc = await reportRef.get();

    if (!reportDoc.exists) {
      return res.status(404).json({ error: 'Report not found' });
    }

    await reportRef.delete();
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;