import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toastSuccess, toastError, toastInfo } from '../Toast/Toast';
import {
    showNotification,
    requestNotificationPermission,
    getNotificationPermission,
    isNotificationSupported
} from '../../services/notificationService';
import './ReminderModal.css';

function ReminderModal({ isOpen, onClose }) {
    const [permission, setPermission] = useState('default');
    const [enabled, setEnabled] = useState(false);
    const [time, setTime] = useState('09:00');
    const [isLoading, setIsLoading] = useState(false);

    // Check notification support and permission
    useEffect(() => {
        if (isOpen) {
            const currentPermission = getNotificationPermission();
            setPermission(currentPermission);

            const storedEnabled = localStorage.getItem('reminderEnabled') === 'true';
            const storedTime = localStorage.getItem('reminderTime') || '09:00';
            setEnabled(storedEnabled);
            setTime(storedTime);
        }
    }, [isOpen]);

    const handleRequestPermission = async () => {
        if (!isNotificationSupported()) {
            toastError('Notifications are not supported in this browser');
            return;
        }

        setIsLoading(true);
        try {
            const result = await requestNotificationPermission();
            setPermission(result.permission || 'denied');

            if (result.granted) {
                toastSuccess('Notifications enabled! You will now receive reminders.');
            } else {
                toastInfo('Notifications blocked. Please enable them in your browser/device settings.');
                setEnabled(false);
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            toastError('Failed to request permission.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async () => {
        if (!enabled) {
            // Turning on
            if (permission !== 'granted') {
                await handleRequestPermission();
                if (getNotificationPermission() === 'granted') {
                    setEnabled(true);
                    toastSuccess('Reminders enabled');
                }
            } else {
                setEnabled(true);
                toastSuccess('Reminders enabled');
            }
        } else {
            // Turning off
            setEnabled(false);
            toastInfo('Reminders disabled');
        }
    };

    const handleSave = () => {
        if (enabled && permission !== 'granted') {
            toastError('Please allow notifications first');
            return;
        }

        localStorage.setItem('reminderEnabled', enabled.toString());
        localStorage.setItem('reminderTime', time);

        if (enabled) {
            toastSuccess(`Reminder set for ${time} daily!`);
        }

        onClose();
    };

    const sendTestNotification = async () => {
        if (permission !== 'granted') {
            await handleRequestPermission();
            return;
        }

        setIsLoading(true);
        try {
            const success = await showNotification(
                '🔔 Test Reminder',
                'This is how your daily reminder will look! Great job setting up notifications! 📝',
                {
                    tag: 'test-notification',
                    requireInteraction: false
                }
            );

            if (success) {
                toastSuccess('Test notification sent! Check your notifications.');
            } else {
                toastError('Failed to send notification. Try enabling notifications in your device settings.');
            }
        } catch (error) {
            console.error('Test notification error:', error);
            toastError('Failed to send test notification');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const notSupported = !isNotificationSupported();

    return createPortal(
        <div className="reminder-overlay" onClick={onClose}>
            <div className="reminder-modal" onClick={e => e.stopPropagation()}>
                <div className="reminder-header">
                    <div className="header-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                    </div>
                    <h3>Daily Reminders</h3>
                    <button className="close-btn" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="reminder-content">
                    {notSupported ? (
                        <div className="not-supported-message">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <p>Notifications are not supported in this browser. Try using Chrome, Safari, or install the app as a PWA.</p>
                        </div>
                    ) : (
                        <>
                            <p className="reminder-description">
                                Get a daily nudge to build your habits and stay consistent.
                            </p>

                            <div className="setting-row">
                                <div className="setting-info">
                                    <label>Enable Reminders</label>
                                    <span className={`setting-status ${permission === 'granted' ? 'granted' : ''}`}>
                                        {permission === 'granted'
                                            ? '✓ Permissions granted'
                                            : permission === 'denied'
                                                ? '✗ Permissions blocked'
                                                : 'Permissions needed'}
                                    </span>
                                </div>
                                <button
                                    className={`toggle-switch ${enabled ? 'active' : ''}`}
                                    onClick={handleToggle}
                                    disabled={isLoading}
                                >
                                    <div className="toggle-thumb" />
                                </button>
                            </div>

                            {permission === 'denied' && (
                                <div className="permission-help">
                                    <p>To enable notifications:</p>
                                    <ol>
                                        <li>Open your device/browser settings</li>
                                        <li>Find this app or website</li>
                                        <li>Enable notifications</li>
                                        <li>Refresh this page</li>
                                    </ol>
                                </div>
                            )}

                            <div className={`time-selector ${!enabled ? 'disabled' : ''}`}>
                                <label>Reminder Time</label>
                                <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    disabled={!enabled}
                                />
                            </div>

                            <button
                                className={`test-notification-btn ${isLoading ? 'loading' : ''}`}
                                onClick={sendTestNotification}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="btn-spinner" />
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                )}
                                {isLoading ? 'Sending...' : 'Test Notification'}
                            </button>

                            <p className="test-hint">
                                Tap to send a test notification and verify it's working
                            </p>
                        </>
                    )}
                </div>

                <div className="reminder-footer">
                    <button className="cancel-btn" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="save-btn"
                        onClick={handleSave}
                        disabled={notSupported}
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default ReminderModal;
