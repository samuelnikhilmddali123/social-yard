const admin = require('firebase-admin');

let firebaseAdminReady = false;

try {
  if (admin.apps.length === 0) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('🔥 Firebase Admin SDK initialized with Service Account');
    } else {
      admin.initializeApp({
        projectId: 'ledscreens-8b0ba'
      });
      console.log('🔥 Firebase Admin SDK initialized with default credentials / Project ID');
    }
  }
  firebaseAdminReady = true;
} catch (err) {
  console.warn('⚠️ Firebase Admin SDK initialization warning:', err.message);
  // Fail-soft: allow server to boot even if Firebase credentials aren't set
}

module.exports = { admin, firebaseAdminReady };
