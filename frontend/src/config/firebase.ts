import { initializeApp, FirebaseApp } from "firebase/app";
import { getMessaging, Messaging } from "firebase/messaging";
import { getAnalytics, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// VAPID Key for Web Push Notifications
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

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
