// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAhU0LE1snNBrAoId7q4XhjV_WVcDal9aA",
    authDomain: "habit-tracker-774cb.firebaseapp.com",
    projectId: "habit-tracker-774cb",
    storageBucket: "habit-tracker-774cb.firebasestorage.app",
    messagingSenderId: "934144278995",
    appId: "1:934144278995:web:637d1cc5c9e5811d47af26",
    measurementId: "G-Q16P07G3L8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);

// Initialize Firestore with persistent cache for faster loading
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
});

export const googleProvider = new GoogleAuthProvider();

// Export app for messaging
export { app };
export default app;

