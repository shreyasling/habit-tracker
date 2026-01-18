// Notification service for PWA
// Uses Service Worker for mobile PWA compatibility

let swRegistration = null;

// Register the service worker
export const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });

            swRegistration = registration;
            console.log('Service Worker registered successfully:', registration.scope);

            // Wait for the service worker to be ready
            await navigator.serviceWorker.ready;
            console.log('Service Worker is ready');

            return registration;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            return null;
        }
    } else {
        console.warn('Service Workers not supported in this browser');
        return null;
    }
};

// Check if notifications are supported
export const isNotificationSupported = () => {
    return 'Notification' in window;
};

// Get current permission status
export const getNotificationPermission = () => {
    if (!isNotificationSupported()) return 'unsupported';
    return Notification.permission;
};

// Request notification permission
export const requestNotificationPermission = async () => {
    if (!isNotificationSupported()) {
        return { granted: false, reason: 'Notifications not supported' };
    }

    try {
        const permission = await Notification.requestPermission();
        return {
            granted: permission === 'granted',
            permission,
            reason: permission === 'denied' ? 'Permission denied by user' : null
        };
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return { granted: false, reason: error.message };
    }
};

// Show a notification (works in both PWA and browser)
export const showNotification = async (title, body, options = {}) => {
    const permission = getNotificationPermission();

    if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return false;
    }

    // Use PNG icons for better notification compatibility
    const icon = options.icon || '/icons/icon-192.png';
    const badge = options.badge || '/icons/icon-72.png';

    try {
        // Try Service Worker notification first (works in PWA)
        if (swRegistration || navigator.serviceWorker?.controller) {
            const registration = swRegistration || await navigator.serviceWorker.ready;

            await registration.showNotification(title, {
                body,
                icon: icon,
                badge: badge,
                vibrate: options.vibrate || [100, 50, 100],
                tag: options.tag || 'habit-reminder',
                requireInteraction: options.requireInteraction || false,
                ...options
            });

            console.log('Notification shown via Service Worker');
            return true;
        }

        // Fallback to regular Notification API (desktop browsers)
        if ('Notification' in window) {
            new Notification(title, {
                body,
                icon: options.icon || '/icons/icon-192.png',
                ...options
            });
            console.log('Notification shown via Notification API');
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error showing notification:', error);

        // Last resort fallback - try posting message to service worker
        if (navigator.serviceWorker?.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SHOW_NOTIFICATION',
                title,
                body,
                icon: options.icon
            });
            console.log('Notification sent via postMessage to Service Worker');
            return true;
        }

        return false;
    }
};

// Schedule a notification for a specific time (uses localStorage to persist)
export const scheduleNotification = (time, message) => {
    // Store the schedule in localStorage
    const schedule = {
        time,
        message,
        enabled: true
    };

    localStorage.setItem('notificationSchedule', JSON.stringify(schedule));

    // Calculate next notification time
    checkAndShowScheduledNotification();
};

// Check if it's time to show a scheduled notification
export const checkAndShowScheduledNotification = () => {
    const scheduleStr = localStorage.getItem('notificationSchedule');
    if (!scheduleStr) return;

    const schedule = JSON.parse(scheduleStr);
    if (!schedule.enabled) return;

    const [hours, minutes] = schedule.time.split(':').map(Number);
    const now = new Date();
    const targetTime = new Date();
    targetTime.setHours(hours, minutes, 0, 0);

    // If the time has passed today, check if we already notified
    const lastNotified = localStorage.getItem('lastNotificationDate');
    const today = now.toDateString();

    if (now >= targetTime && lastNotified !== today) {
        showNotification(
            'Productivity Tracker',
            schedule.message || "Don't forget to update your habits today! 📝"
        );
        localStorage.setItem('lastNotificationDate', today);
    }
};

// Get the service worker registration (for external use)
export const getServiceWorkerRegistration = () => swRegistration;
