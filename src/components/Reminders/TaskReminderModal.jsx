import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toastSuccess, toastError, toastInfo } from '../Toast/Toast';
import { showNotification, requestNotificationPermission, getNotificationPermission, isNotificationSupported } from '../../services/notificationService';
import { requestFCMToken, saveRemindersToFirestore, isFCMSupported } from '../../services/fcmService';
import './TaskReminderModal.css';

// Helper to generate unique reminder ID
const generateReminderId = () => `reminder_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

function TaskReminderModal({ isOpen, onClose, tasks, userId }) {
    const [permission, setPermission] = useState('default');
    const [selectedTaskId, setSelectedTaskId] = useState('');
    const [reminderTime, setReminderTime] = useState('09:00');
    const [taskReminders, setTaskReminders] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [fcmEnabled, setFcmEnabled] = useState(false);

    // Load reminders from localStorage and check permission
    useEffect(() => {
        if (isOpen) {
            const currentPermission = getNotificationPermission();
            setPermission(currentPermission);

            // Load existing reminders
            const storedReminders = localStorage.getItem('taskReminders');
            if (storedReminders) {
                setTaskReminders(JSON.parse(storedReminders));
            }

            // Select first task by default
            if (tasks.length > 0 && !selectedTaskId) {
                setSelectedTaskId(tasks[0].id);
            }

            // Check if FCM is already enabled
            const fcmToken = localStorage.getItem('fcmToken');
            setFcmEnabled(!!fcmToken);
        }
    }, [isOpen, tasks]);

    // Save reminders to localStorage and Firestore
    const saveReminders = async (reminders) => {
        localStorage.setItem('taskReminders', JSON.stringify(reminders));
        setTaskReminders(reminders);

        // Also save to Firestore for Cloud Function to use
        if (userId && fcmEnabled) {
            await saveRemindersToFirestore(userId, reminders, tasks);
        }
    };

    const handleRequestPermission = async () => {
        if (!isNotificationSupported()) {
            toastError('Notifications are not supported in this browser');
            return false;
        }

        setIsLoading(true);
        try {
            const result = await requestNotificationPermission();
            setPermission(result.permission || 'denied');
            if (result.granted) {
                toastSuccess('Notifications enabled!');

                // Try to get FCM token for background notifications
                if (userId && isFCMSupported()) {
                    const token = await requestFCMToken(userId);
                    if (token) {
                        localStorage.setItem('fcmToken', token);
                        setFcmEnabled(true);
                        toastSuccess('Background notifications enabled!');
                    }
                }

                return true;
            } else {
                toastInfo('Notifications blocked. Enable them in browser settings.');
                return false;
            }
        } catch (error) {
            toastError('Failed to request permission.');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnableBackgroundNotifications = async () => {
        if (!userId) {
            toastError('Please sign in to enable background notifications');
            return;
        }

        setIsLoading(true);
        try {
            const token = await requestFCMToken(userId);
            if (token) {
                localStorage.setItem('fcmToken', token);
                setFcmEnabled(true);

                // Sync existing reminders to Firestore
                if (Object.keys(taskReminders).length > 0) {
                    await saveRemindersToFirestore(userId, taskReminders, tasks);
                }

                toastSuccess('Background notifications enabled! Reminders will work even when app is closed.');
            } else {
                toastError('Failed to enable background notifications');
            }
        } catch (error) {
            console.error('FCM error:', error);
            toastError('Failed to enable background notifications');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetReminder = async () => {
        if (!selectedTaskId) {
            toastError('Please select a task');
            return;
        }

        if (permission !== 'granted') {
            const granted = await handleRequestPermission();
            if (!granted) return;
        }

        const task = tasks.find(t => t.id === selectedTaskId);
        if (!task) return;

        const newReminder = {
            id: generateReminderId(),
            time: reminderTime,
            enabled: true,
            createdAt: Date.now()
        };

        // Replace any existing reminder for this task (one reminder per task)
        const updatedReminders = {
            ...taskReminders,
            [selectedTaskId]: [newReminder]
        };

        await saveReminders(updatedReminders);
        toastSuccess(`Daily reminder set for "${task.name}" at ${reminderTime}`);
    };

    const handleRemoveReminder = async (taskId) => {
        const updatedReminders = { ...taskReminders };
        delete updatedReminders[taskId];
        await saveReminders(updatedReminders);
        toastInfo('Reminder removed');
    };

    const handleToggleReminder = async (taskId) => {
        const reminders = taskReminders[taskId] || [];
        if (reminders.length === 0) return;

        const updatedReminders = {
            ...taskReminders,
            [taskId]: reminders.map(r => ({ ...r, enabled: !r.enabled }))
        };
        await saveReminders(updatedReminders);
    };

    const handleTestReminder = async () => {
        const task = tasks.find(t => t.id === selectedTaskId);
        if (!task) return;

        const reminder = taskReminders[selectedTaskId]?.[0];

        setIsLoading(true);
        try {
            const success = await showNotification(
                `🔔 ${task.name}`,
                `Time to complete your task!${reminder ? ` (Daily at ${reminder.time})` : ''}`,
                { tag: `test-${selectedTaskId}` }
            );
            if (success) {
                toastSuccess('Test notification sent!');
            } else {
                toastError('Failed to send notification');
            }
        } catch (error) {
            toastError('Failed to send test notification');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const notSupported = !isNotificationSupported();
    const selectedTask = tasks.find(t => t.id === selectedTaskId);
    const currentReminder = selectedTaskId ? taskReminders[selectedTaskId]?.[0] : null;

    return createPortal(
        <div className="task-reminder-overlay" onClick={onClose}>
            <div className="task-reminder-modal" onClick={e => e.stopPropagation()}>
                <div className="task-reminder-header">
                    <div className="header-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                    </div>
                    <h3>Task Reminders</h3>
                    <button className="close-btn" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="task-reminder-content">
                    {notSupported ? (
                        <div className="not-supported-message">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <p>Notifications not supported. Try Chrome, Safari, or install as PWA.</p>
                        </div>
                    ) : (
                        <>
                            {/* Permission Status */}
                            <div className={`permission-status ${permission === 'granted' ? 'granted' : ''}`}>
                                <span className="status-icon">
                                    {permission === 'granted' ? '✓' : '⚠'}
                                </span>
                                <span>
                                    {permission === 'granted'
                                        ? 'Notifications enabled'
                                        : permission === 'denied'
                                            ? 'Notifications blocked - enable in settings'
                                            : 'Notification permission needed'}
                                </span>
                                {permission !== 'granted' && (
                                    <button
                                        className="enable-btn"
                                        onClick={handleRequestPermission}
                                        disabled={isLoading}
                                    >
                                        Enable
                                    </button>
                                )}
                            </div>

                            {/* Background Notifications Status */}
                            {permission === 'granted' && (
                                <div className={`fcm-status ${fcmEnabled ? 'enabled' : ''}`}>
                                    <span className="status-icon">
                                        {fcmEnabled ? '🔔' : '📱'}
                                    </span>
                                    <span>
                                        {fcmEnabled
                                            ? 'Background notifications active'
                                            : 'Enable for notifications when app is closed'}
                                    </span>
                                    {!fcmEnabled && userId && (
                                        <button
                                            className="enable-btn"
                                            onClick={handleEnableBackgroundNotifications}
                                            disabled={isLoading}
                                        >
                                            Enable
                                        </button>
                                    )}
                                </div>
                            )}

                            <p className="reminder-description">
                                Set a daily reminder for any task. You'll be notified at the set time.
                            </p>

                            {fcmEnabled ? (
                                <div className="reminder-note success">
                                    <span className="note-icon">✅</span>
                                    <span>Reminders work even when app is closed!</span>
                                </div>
                            ) : (
                                <div className="reminder-note">
                                    <span className="note-icon">💡</span>
                                    <span>Enable background notifications for reminders when app is closed.</span>
                                </div>
                            )}

                            {/* Task Selection */}
                            <div className="form-group">
                                <label>Select Task</label>
                                <select
                                    value={selectedTaskId}
                                    onChange={(e) => setSelectedTaskId(e.target.value)}
                                    className="task-select"
                                >
                                    {tasks.length === 0 ? (
                                        <option value="">No tasks available</option>
                                    ) : (
                                        tasks.map(task => (
                                            <option key={task.id} value={task.id}>
                                                {task.name} {taskReminders[task.id]?.[0] ? `(⏰ ${taskReminders[task.id][0].time})` : ''}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            {/* Current Reminder Status for Selected Task */}
                            {selectedTask && (
                                <div className="selected-task-reminder">
                                    {currentReminder ? (
                                        <div className="current-reminder-card">
                                            <div className="reminder-info-row">
                                                <div className="reminder-details">
                                                    <span className="reminder-label">Daily reminder at</span>
                                                    <span className="reminder-time-display">{currentReminder.time}</span>
                                                </div>
                                                <div className="reminder-controls">
                                                    <button
                                                        className={`toggle-btn ${currentReminder.enabled ? 'active' : ''}`}
                                                        onClick={() => handleToggleReminder(selectedTaskId)}
                                                        title={currentReminder.enabled ? 'Disable' : 'Enable'}
                                                    >
                                                        <div className="toggle-thumb" />
                                                    </button>
                                                    <button
                                                        className="remove-btn"
                                                        onClick={() => handleRemoveReminder(selectedTaskId)}
                                                        title="Remove reminder"
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="3 6 5 6 21 6" />
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                            <button
                                                className="test-notification-btn"
                                                onClick={handleTestReminder}
                                                disabled={!currentReminder.enabled || isLoading}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polygon points="5 3 19 12 5 21 5 3" />
                                                </svg>
                                                Test Notification
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="set-reminder-section">
                                            <div className="form-group">
                                                <label>Reminder Time</label>
                                                <input
                                                    type="time"
                                                    value={reminderTime}
                                                    onChange={(e) => setReminderTime(e.target.value)}
                                                    className="time-input"
                                                />
                                            </div>
                                            <button
                                                className="set-reminder-btn"
                                                onClick={handleSetReminder}
                                                disabled={!selectedTaskId || isLoading || tasks.length === 0}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                                </svg>
                                                Set Daily Reminder
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="task-reminder-footer">
                    <button className="done-btn" onClick={onClose}>
                        Done
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default TaskReminderModal;
