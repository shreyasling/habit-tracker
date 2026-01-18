import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toastSuccess, toastError, toastInfo } from '../Toast/Toast';
import './ReminderModal.css';

function ReminderModal({ isOpen, onClose }) {
    const [permission, setPermission] = useState(Notification.permission);
    const [enabled, setEnabled] = useState(false);
    const [time, setTime] = useState('09:00');

    // Load settings from localStorage
    useEffect(() => {
        const storedEnabled = localStorage.getItem('reminderEnabled') === 'true';
        const storedTime = localStorage.getItem('reminderTime') || '09:00';

        setEnabled(storedEnabled);
        setTime(storedTime);
    }, [isOpen]);

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            toastError('This browser does not support desktop notifications');
            return;
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                toastSuccess('Notifications enabled! You will now receive reminders.');
            } else {
                toastInfo('Notifications blocked. Please enable them in your browser settings.');
                setEnabled(false);
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            toastError('Failed to request permission.');
        }
    };

    const handleToggle = async () => {
        if (!enabled) {
            // Turning on
            if (permission !== 'granted') {
                await requestPermission();
            } else {
                toastSuccess('Reminders enabled');
            }
            setEnabled(true);
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

        localStorage.setItem('reminderEnabled', enabled);
        localStorage.setItem('reminderTime', time);

        if (enabled) {
            // Schedule validation (just for feedback)
            toastSuccess(`Reminder set for ${time} daily!`);

            // Send a test notification immediately if it's the first setup
            if (!localStorage.getItem('notificationTested')) {
                new Notification('Productivity Tracker', {
                    body: 'Reminders are set up! We\'ll notify you at ' + time,
                    icon: '/icons/icon-192.png'
                });
                localStorage.setItem('notificationTested', 'true');
            }
        }

        onClose();
    };

    const sendTestNotification = () => {
        if (permission === 'granted') {
            new Notification('Test Reminder', {
                body: 'This is how your daily reminder will look! 📝',
                icon: '/icons/icon-192.png'
            });
            toastSuccess('Test notification sent!');
        } else {
            requestPermission();
        }
    };

    if (!isOpen) return null;

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
                    <p className="reminder-description">
                        Get a daily nudge to build your habits and stay consistent.
                    </p>

                    <div className="setting-row">
                        <div className="setting-info">
                            <label>Enable Reminders</label>
                            <span className="setting-status">
                                {permission === 'granted' ? 'Permissions granted' : 'Permissions needed'}
                            </span>
                        </div>
                        <button
                            className={`toggle-switch ${enabled ? 'active' : ''}`}
                            onClick={handleToggle}
                        >
                            <div className="toggle-thumb" />
                        </button>
                    </div>

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
                        className="test-notification-btn"
                        onClick={sendTestNotification}
                        disabled={permission !== 'granted'}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        Test Notification
                    </button>
                </div>

                <div className="reminder-footer">
                    <button className="cancel-btn" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="save-btn" onClick={handleSave}>
                        Save Changes
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default ReminderModal;
