/**
 * Task Notification Service for Tomorrow Plans
 * Handles "5 minutes before" notifications for scheduled tasks
 * Works on mobile PWA using Service Workers
 */

import { showNotification, getNotificationPermission, requestNotificationPermission } from '../../../services/notificationService';

// Store scheduled timeouts
let scheduledNotifications = new Map();
let checkInterval = null;

/**
 * Convert time string (HH:MM) to today's Date object
 */
const timeToDate = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
};

/**
 * Get milliseconds until 5 minutes before start time
 */
const getNotifyTime = (startTime) => {
    const taskDate = timeToDate(startTime);
    const notifyDate = new Date(taskDate.getTime() - 5 * 60 * 1000); // 5 minutes before
    return notifyDate;
};

/**
 * Schedule a notification for a specific task
 */
const scheduleTaskNotification = (task) => {
    // Skip if notifications not enabled for this task
    if (!task.notificationEnabled) return;

    // Skip if already completed
    if (task.status === 'completed') return;

    // Cancel any existing notification for this task
    if (scheduledNotifications.has(task.id)) {
        clearTimeout(scheduledNotifications.get(task.id));
        scheduledNotifications.delete(task.id);
    }

    const notifyTime = getNotifyTime(task.startTime);
    const now = new Date();
    const delay = notifyTime.getTime() - now.getTime();

    // Only schedule if the notify time is in the future
    if (delay > 0) {
        console.log(`[TaskNotify] Scheduling "${task.title}" notification in ${Math.round(delay / 1000 / 60)} minutes`);

        const timeoutId = setTimeout(async () => {
            await showNotification(
                `⏰ Starting in 5 min: ${task.title}`,
                task.description || `Get ready for your ${task.startTime} - ${task.endTime} task!`,
                {
                    tag: `task-5min-${task.id}`,
                    requireInteraction: true,
                    vibrate: [200, 100, 200, 100, 200],
                    data: { taskId: task.id }
                }
            );

            scheduledNotifications.delete(task.id);
        }, delay);

        scheduledNotifications.set(task.id, timeoutId);
    } else {
        console.log(`[TaskNotify] Skipped "${task.title}" - notification time already passed`);
    }
};

/**
 * Clear all scheduled notifications
 */
export const clearAllTaskNotifications = () => {
    scheduledNotifications.forEach((timeoutId) => {
        clearTimeout(timeoutId);
    });
    scheduledNotifications.clear();
    console.log('[TaskNotify] Cleared all scheduled notifications');
};

/**
 * Schedule notifications for all tasks
 */
export const scheduleAllTaskNotifications = (tasks) => {
    // Clear existing schedules
    clearAllTaskNotifications();

    if (!tasks || tasks.length === 0) {
        console.log('[TaskNotify] No tasks to schedule');
        return;
    }

    // Check permission first
    const permission = getNotificationPermission();
    if (permission !== 'granted') {
        console.warn('[TaskNotify] Notifications not permitted');
        return;
    }

    // Schedule each task
    tasks.forEach(task => {
        if (task.startTime && task.notificationEnabled) {
            scheduleTaskNotification(task);
        }
    });

    console.log(`[TaskNotify] Scheduled ${scheduledNotifications.size} notifications`);
};

/**
 * Alternative: Polling-based notification checker (for background checks)
 * This runs every 30 seconds and checks if any task is about to start
 */
export const startTaskNotificationChecker = (getTasks) => {
    if (checkInterval) {
        clearInterval(checkInterval);
    }

    const checkAndNotify = () => {
        const tasks = getTasks();
        if (!tasks || tasks.length === 0) return;

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const firedToday = JSON.parse(sessionStorage.getItem('firedTaskNotifications') || '[]');

        tasks.forEach(task => {
            if (!task.notificationEnabled || task.status === 'completed') return;
            if (firedToday.includes(task.id)) return;

            const [hours, minutes] = task.startTime.split(':').map(Number);
            const taskMinutes = hours * 60 + minutes;
            const notifyMinutes = taskMinutes - 5; // 5 minutes before

            // Check if current time is within the notification window (exact minute or 1 min after)
            if (currentMinutes >= notifyMinutes && currentMinutes <= notifyMinutes + 1) {
                console.log(`[TaskNotify] Firing notification for "${task.title}"`);

                showNotification(
                    `⏰ Starting in 5 min: ${task.title}`,
                    task.description || `Get ready for your ${task.startTime} - ${task.endTime} task!`,
                    {
                        tag: `task-5min-${task.id}`,
                        requireInteraction: true,
                        vibrate: [200, 100, 200, 100, 200]
                    }
                );

                // Mark as fired for today
                firedToday.push(task.id);
                sessionStorage.setItem('firedTaskNotifications', JSON.stringify(firedToday));
            }
        });
    };

    // Check immediately
    checkAndNotify();

    // Check every 30 seconds
    checkInterval = setInterval(checkAndNotify, 30000);

    console.log('[TaskNotify] Started notification checker (polling every 30s)');

    return () => {
        if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
        }
    };
};

/**
 * Stop the notification checker
 */
export const stopTaskNotificationChecker = () => {
    if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
        console.log('[TaskNotify] Stopped notification checker');
    }
};

/**
 * Request notification permission and return status
 */
export const ensureNotificationPermission = async () => {
    const currentPermission = getNotificationPermission();

    if (currentPermission === 'granted') {
        return { granted: true };
    }

    if (currentPermission === 'denied') {
        return { granted: false, reason: 'Notifications are blocked. Enable them in browser settings.' };
    }

    // Request permission
    return await requestNotificationPermission();
};

/**
 * Test notification (for debugging)
 */
export const sendTestNotification = async () => {
    const permission = await ensureNotificationPermission();

    if (!permission.granted) {
        console.error('[TaskNotify] Cannot send test - permission not granted');
        return false;
    }

    return await showNotification(
        '✅ Notifications Working!',
        'Task reminders are set up correctly. You\'ll get notified 5 minutes before each task.',
        {
            tag: 'test-notification',
            vibrate: [100, 50, 100]
        }
    );
};
