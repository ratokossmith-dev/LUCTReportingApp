import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCUCbie6-sNH1dPJypq-E_J6TjedP-hy1M",
  authDomain: "luctreportingapp-5d944.firebaseapp.com",
  projectId: "luctreportingapp-5d944",
  storageBucket: "luctreportingapp-5d944.firebasestorage.app",
  messagingSenderId: "266506519604",
  appId: "1:266506519604:web:212e5f9c882ceb5907f661",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export default app;
