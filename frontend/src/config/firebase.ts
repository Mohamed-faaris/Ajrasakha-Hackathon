import { initializeApp, FirebaseApp } from "firebase/app";
import { getMessaging, Messaging } from "firebase/messaging";
import { getAnalytics, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD1hg6i8bJDMP2Q5dx2F_2EPLwI-l9DZt4",
  authDomain: "mandi-insights.firebaseapp.com",
  projectId: "mandi-insights",
  storageBucket: "mandi-insights.firebasestorage.app",
  messagingSenderId: "705013637720",
  appId: "1:705013637720:web:5c6df09621188786c7202d",
  measurementId: "G-WLT1BXNFFN"
};

// VAPID Key for Web Push Notifications
// Get this from Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
// Example: "BFCZJ..."
export const VAPID_KEY = "YOUR_VAPID_KEY_HERE";

let app: FirebaseApp;
let messaging: Messaging | null = null;
let analytics: Analytics | null = null;

try {
  app = initializeApp(firebaseConfig);
  
  messaging = getMessaging(app);
  
  analytics = getAnalytics(app);
} catch (error) {
  if (error instanceof Error && !error.message.includes("already exists")) {
    console.error("Firebase initialization error:", error);
  }
  throw error;
}

export { app, messaging, analytics };
