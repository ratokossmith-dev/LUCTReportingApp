const admin = require("firebase-admin");

// Verify Firebase ID token from frontend
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ error: "Not authorized, no token" });
    }

    // Verify token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;

    // Get user role from Firestore
    const userDoc = await req.db
      .collection("users")
      .doc(decodedToken.uid)
      .get();

    if (userDoc.exists) {
      req.userRole = userDoc.data().role;
      req.userData = userDoc.data();
    } else {
      // User exists in Firebase Auth but not in Firestore
      console.warn(`[AUTH] User ${decodedToken.uid} not found in Firestore`);
      return res.status(403).json({ error: "User profile not found" });
    }

    // Debug log — shows uid, role, and which route is being hit
    console.log(
      `[AUTH] uid=${decodedToken.uid} | role=${req.userRole} | ${req.method} ${req.path}`
    );

    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    res.status(401).json({ error: "Not authorized, token failed" });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({ error: "No role assigned to this user" });
    }
    if (!roles.includes(req.userRole)) {
      console.warn(
        `[AUTHZ] DENIED — role="${req.userRole}" not in [${roles.join(", ")}] for ${req.method} ${req.path}`
      );
      return res
        .status(403)
        .json({ error: "Access denied. Insufficient permissions." });
    }
    next();
  };
};

module.exports = { protect, authorize };