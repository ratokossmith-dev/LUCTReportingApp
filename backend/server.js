// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

dotenv.config();

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const app = express();

app.use(cors());
app.use(express.json());

// Attach db to every request so routes can use req.db
app.use((req, res, next) => {
  req.db = db;
  next();
});

// ============ ROUTES ============
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const classRoutes = require('./routes/classes');
const attendanceRoutes = require('./routes/attendance');
const reportRoutes = require('./routes/reports');
const ratingRoutes = require('./routes/ratings');
const userRoutes = require('./routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/users', userRoutes);

// ============ HEALTH CHECK ============
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// ============ 404 HANDLER ============
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ============ ERROR HANDLER ============
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});