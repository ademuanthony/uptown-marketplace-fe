import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Check if we're in development mode with demo config
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
const hasValidConfig = 
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'demo-api-key';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: any = null;
let auth: any = null;
let db: any = null;

// Only initialize Firebase if we have valid config
if (hasValidConfig) {
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    
    // Initialize Firebase Authentication and get a reference to the service
    auth = getAuth(app);
    
    // Initialize Cloud Firestore and get a reference to the service
    db = getFirestore(app);
    
    // Connect to emulators in development if configured
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      connectAuthEmulator(auth, 'http://localhost:9099');
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
} else if (isDevMode) {
  console.warn('🔧 Firebase not configured - running in development mode with mock auth');
} else {
  console.error('❌ Firebase configuration missing. Please check your environment variables.');
}

export { auth, db };
export default app;
export { isDevMode, hasValidConfig };