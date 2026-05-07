const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  req.db = db;
  next();
});

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});