// Import and configure the Firebase SDK inside the service worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing the same config
firebase.initializeApp({
  apiKey: "AIzaSyD7wKQGFidjNCtPTlZUh8jpFgV-siTwlzU",
  authDomain: "ledscreens-8b0ba.firebaseapp.com",
  projectId: "ledscreens-8b0ba",
  storageBucket: "ledscreens-8b0ba.firebasestorage.app",
  messagingSenderId: "768694909660",
  appId: "1:768694909660:web:68b340dff4037de598d219",
  measurementId: "G-1Y0RHTGQVD"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || '🚨 E3Di Booking Alert';
  const notificationOptions = {
    body: payload.notification?.body || 'New campaign ad slot booked successfully.',
    icon: '/favicon.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
