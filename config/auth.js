import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
<<<<<<< HEAD

// Only import these for React Native
import { Platform } from "react-native";

let auth;
=======
import { getFirestore } from "firebase/firestore";
>>>>>>> 46e0c0d343859cd0b5abd6da7e5308c64cdfcba7

const firebaseConfig = {
  apiKey: "AIzaSyCUCbie6-sNH1dPJypq-E_J6TjedP-hy1M",
  authDomain: "luctreportingapp-5d944.firebaseapp.com",
  projectId: "luctreportingapp-5d944",
  storageBucket: "luctreportingapp-5d944.firebasestorage.app",
  messagingSenderId: "266506519604",
  appId: "1:266506519604:web:212e5f9c882ceb5907f661",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

<<<<<<< HEAD
// ✅ FIX: Different setup for web vs mobile
if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  const {
    initializeAuth,
    getReactNativePersistence,
  } = require("firebase/auth");
  const AsyncStorage =
    require("@react-native-async-storage/async-storage").default;

  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { auth };
=======
export const auth = getAuth(app);
export const db = getFirestore(app);

>>>>>>> 46e0c0d343859cd0b5abd6da7e5308c64cdfcba7
export default app;
