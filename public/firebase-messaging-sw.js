// Firebase Messaging Service Worker
// This file handles background push notifications from FCM

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase configuration (same as your frontend config)
firebase.initializeApp({
    apiKey: "AIzaSyAhU0LE1snNBrAoId7q4XhjV_WVcDal9aA",
    authDomain: "habit-tracker-774cb.firebaseapp.com",
    projectId: "habit-tracker-774cb",
    storageBucket: "habit-tracker-774cb.firebasestorage.app",
    messagingSenderId: "934144278995",
    appId: "1:934144278995:web:637d1cc5c9e5811d47af26"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'Habit Tracker';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a reminder!',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        vibrate: [100, 50, 100],
        data: payload.data,
        requireInteraction: true,
        actions: [
            { action: 'open', title: 'Open App' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification clicked:', event);

    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    // Open the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // If a window is already open, focus it
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise open a new window
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
    );
});
