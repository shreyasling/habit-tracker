import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getMonthName, getPreviousMonth, getNextMonth, getCurrentDate } from '../../utils/dateUtils';
import { getMotivationalQuote } from '../../services/geminiService';
import ReminderModal from '../Reminders/ReminderModal';
import './Header.css';

function Header({ year, month, onMonthChange, onAnalyzeClick, user, onLogout }) {
    const currentDate = getCurrentDate();
    const isCurrentMonth = year === currentDate.year && month === currentDate.month;
    const [quote, setQuote] = useState('"The secret of getting ahead is getting started." - Mark Twain');
    const [isLoadingQuote, setIsLoadingQuote] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showReminders, setShowReminders] = useState(false);
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'dark';
    });

    // ... existing useEffects and functions ...

    // Apply theme on mount and when changed
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Fetch motivational quote on mount (use cache)
    useEffect(() => {
        fetchQuote(false);
    }, []);

    const fetchQuote = async (forceRefresh = true) => {
        setIsLoadingQuote(true);
        try {
            const newQuote = await getMotivationalQuote(forceRefresh);
            setQuote(newQuote);
        } catch (error) {
            console.error('Failed to fetch quote:', error);
        } finally {
            setIsLoadingQuote(false);
        }
    };

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
    };

    const handlePrevMonth = () => {
        const prev = getPreviousMonth(year, month);
        onMonthChange(prev.year, prev.month);
    };

    const handleNextMonth = () => {
        const next = getNextMonth(year, month);
        onMonthChange(next.year, next.month);
    };

    const handleGoToToday = () => {
        onMonthChange(currentDate.year, currentDate.month);
    };

    return (
        <header className="header">
            <div className="header-container">
                <div className="header-top">
                    <div className="header-brand">
                        <div className="brand-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <div className="brand-text">
                            <h1>Productivity Tracker</h1>
                            <p>Track your daily habits & progress</p>
                        </div>
                    </div>

                    <div className="header-actions">
                        <button
                            className="icon-btn"
                            onClick={() => setShowReminders(true)}
                            title="Daily Reminders"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                        </button>

                        <button
                            className="icon-btn"
                            onClick={toggleTheme}
                            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                        >
                            {theme === 'dark' ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="5" />
                                    <line x1="12" y1="1" x2="12" y2="3" />
                                    <line x1="12" y1="21" x2="12" y2="23" />
                                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                    <line x1="1" y1="12" x2="3" y2="12" />
                                    <line x1="21" y1="12" x2="23" y2="12" />
                                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                </svg>
                            )}
                        </button>
                        <button
                            className="analyze-btn"
                            onClick={onAnalyzeClick}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                            <span>AI Analysis</span>
                        </button>

                        {user && (
                            <div className="user-menu">
                                {user.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt={user.displayName || 'User'}
                                        className="user-avatar"
                                        title={user.displayName || user.email}
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="user-avatar-fallback" title={user.displayName || user.email}>
                                        {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <button
                                    className="logout-btn"
                                    onClick={() => setShowLogoutConfirm(true)}
                                    title="Sign out"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                </button>

                                {showLogoutConfirm && createPortal(
                                    <div className="logout-confirm-overlay" onClick={() => setShowLogoutConfirm(false)}>
                                        <div className="logout-confirm-dialog" onClick={(e) => e.stopPropagation()}>
                                            <p>Are you sure you want to sign out?</p>
                                            <div className="logout-confirm-buttons">
                                                <button
                                                    className="confirm-yes"
                                                    onClick={() => {
                                                        setShowLogoutConfirm(false);
                                                        onLogout();
                                                    }}
                                                >
                                                    Yes, Sign Out
                                                </button>
                                                <button
                                                    className="confirm-no"
                                                    onClick={() => setShowLogoutConfirm(false)}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>,
                                    document.body
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="motivation-bar">
                    <div className={`quote-text ${isLoadingQuote ? 'loading' : ''}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span>{quote}</span>
                    </div>
                    <button
                        className="refresh-quote-btn"
                        onClick={fetchQuote}
                        disabled={isLoadingQuote}
                        title="Get new quote"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isLoadingQuote ? 'spinning' : ''}>
                            <polyline points="23 4 23 10 17 10" />
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                    </button>
                </div>

                <div className="header-nav">
                    <button
                        className="nav-btn"
                        onClick={handlePrevMonth}
                        aria-label="Previous month"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>

                    <div className="current-month">
                        <span className="month-name">{getMonthName(month)}</span>
                        <span className="year">{year}</span>
                    </div>

                    <button
                        className="nav-btn"
                        onClick={handleNextMonth}
                        aria-label="Next month"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>

                    {!isCurrentMonth && (
                        <button
                            className="today-btn"
                            onClick={handleGoToToday}
                        >
                            Today
                        </button>
                    )}
                </div>
            </div>

            <ReminderModal
                isOpen={showReminders}
                onClose={() => setShowReminders(false)}
            />
        </header>
    );
}

export default Header;
