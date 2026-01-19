/**
 * Firebase Cloud Messaging (FCM) Service
 * Handles push notification registration and token management
 */

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '../firebase/config';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

let messaging = null;

// Initialize messaging only in supported browsers
const initMessaging = () => {
    if (!messaging && typeof window !== 'undefined' && 'Notification' in window) {
        try {
            messaging = getMessaging(app);
        } catch (error) {
            console.error('Failed to initialize Firebase Messaging:', error);
        }
    }
    return messaging;
};

/**
 * Check if FCM is supported in this browser
 */
export const isFCMSupported = () => {
    return 'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;
};

/**
 * Request permission and get FCM token
 * @param {string} userId - The user's Firebase UID
 * @returns {Promise<string|null>} The FCM token or null
 */
export const requestFCMToken = async (userId) => {
    if (!isFCMSupported()) {
        console.warn('FCM is not supported in this browser');
        return null;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

    if (!vapidKey) {
        console.error('VAPID key not found. Add VITE_FIREBASE_VAPID_KEY to your .env file');
        return null;
    }

    try {
        // Request notification permission
        const permission = await Notification.requestPermission();

        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return null;
        }

        const msg = initMessaging();
        if (!msg) return null;

        // Get or refresh FCM token
        const token = await getToken(msg, {
            vapidKey: vapidKey,
            serviceWorkerRegistration: await navigator.serviceWorker.ready
        });

        if (token) {
            console.log('FCM Token obtained:', token.substring(0, 20) + '...');

            // Save token to Firestore
            await saveFCMToken(userId, token);

            return token;
        } else {
            console.log('No FCM token available');
            return null;
        }
    } catch (error) {
        console.error('Error getting FCM token:', error);
        return null;
    }
};

/**
 * Save FCM token to Firestore
 */
export const saveFCMToken = async (userId, token) => {
    if (!userId || !token) return;

    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            fcmToken: token,
            fcmTokenUpdatedAt: new Date().toISOString()
        });
        console.log('FCM token saved to Firestore');
    } catch (error) {
        console.error('Error saving FCM token:', error);
    }
};

/**
 * Save task reminders to Firestore (for Cloud Function to use)
 */
export const saveRemindersToFirestore = async (userId, taskReminders, tasks = []) => {
    if (!userId) return;

    try {
        const remindersRef = doc(db, 'users', userId, 'settings', 'reminders');

        // Add task names to reminders for notification messages
        const remindersWithNames = {};
        for (const [taskId, reminders] of Object.entries(taskReminders)) {
            const task = tasks.find(t => t.id === taskId);
            remindersWithNames[taskId] = reminders.map(r => ({
                ...r,
                taskName: task?.name || 'Unknown Task'
            }));
        }

        await setDoc(remindersRef, {
            taskReminders: remindersWithNames,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        console.log('Reminders saved to Firestore');
    } catch (error) {
        console.error('Error saving reminders to Firestore:', error);
    }
};

/**
 * Listen for foreground messages
 */
export const onForegroundMessage = (callback) => {
    const msg = initMessaging();
    if (!msg) return () => { };

    return onMessage(msg, (payload) => {
        console.log('Foreground message received:', payload);
        callback(payload);
    });
};

/**
 * Delete FCM token (on logout)
 */
export const deleteFCMToken = async (userId) => {
    if (!userId) return;

    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            fcmToken: null
        });
        console.log('FCM token removed from Firestore');
    } catch (error) {
        console.error('Error removing FCM token:', error);
    }
};
