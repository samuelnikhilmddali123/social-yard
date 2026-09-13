import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import type { User } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD7wKQGFidjNCtPTlZUh8jpFgV-siTwlzU",
  authDomain: "ledscreens-8b0ba.firebaseapp.com",
  projectId: "ledscreens-8b0ba",
  storageBucket: "ledscreens-8b0ba.firebasestorage.app",
  messagingSenderId: "768694909660",
  appId: "1:768694909660:web:68b340dff4037de598d219",
  measurementId: "G-1Y0RHTGQVD"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

let analytics;
try {
  analytics = getAnalytics(app);
} catch {
  // Analytics may be unavailable (SSR, blocked cookies, unsupported env)
}
export { analytics };

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Google Sign-In Function
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Error during Google Sign-In:", error.message);
    throw error;
  }
};

import { getMessaging, getToken } from "firebase/messaging";

// Logout Function
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error("Error during Logout:", error.message);
    throw error;
  }
};

// Request FCM Device Registration Token
export const requestFcmToken = async () => {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Notifications not supported in this browser.');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted.');
      return null;
    }

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: 'BM-XhYV_XvDkWp-c6N47j6z4WpB2oQ_1xY9W5W5W5W5W5W5W5W5W5W5' // public VAPID key placeholder or empty
    });
    return token;
  } catch (err: any) {
    console.warn('FCM token request warning:', err.message);
    return null;
  }
};

export { onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber };
export type { User };
