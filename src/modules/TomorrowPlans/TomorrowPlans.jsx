import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TaskTimeline from './components/TaskTimeline';
import TaskForm from './components/TaskForm';
import AIPlanner from './components/AIPlanner';
import MiniCalendar from './components/MiniCalendar';
import PlanChatbot from './components/PlanChatbot';
import useSwipeGesture from '../../hooks/useSwipeGesture';
import { getDailyPlan, saveDailyPlan, addTask, updateTask, deleteTask, moveUnfinishedTasks, getDayStats, formatDateKey } from './services/planService';
import { toastSuccess, toastError, toastInfo } from '../../components/Toast/Toast';
import './TomorrowPlans.css';

function TomorrowPlans({ user }) {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [showAIPlanner, setShowAIPlanner] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showChatbot, setShowChatbot] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

    // Apply theme
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    // Date helpers
    const getDateLabel = useCallback((date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        const diffDays = Math.round((checkDate - today) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays === -1) return 'Yesterday';

        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }, []);

    const isToday = useMemo(() => {
        return formatDateKey(selectedDate) === formatDateKey(new Date());
    }, [selectedDate]);

    const dateLabel = useMemo(() => getDateLabel(selectedDate), [selectedDate, getDateLabel]);

    // Load plan for selected date
    const loadPlan = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const dayPlan = await getDailyPlan(user.uid, selectedDate);
            setPlan(dayPlan);
        } catch (error) {
            console.error('Failed to load plan:', error);
            toastError('Failed to load plan');
        } finally {
            setLoading(false);
        }
    }, [user, selectedDate]);

    useEffect(() => {
        loadPlan();
    }, [loadPlan]);

    // Task operations
    const handleAddTask = async (taskData) => {
        try {
            await addTask(user.uid, selectedDate, taskData);
            await loadPlan();
            setShowTaskForm(false);
            toastSuccess('Task added!');
        } catch (error) {
            toastError('Failed to add task');
        }
    };

    const handleUpdateTask = async (taskId, updates) => {
        try {
            await updateTask(user.uid, selectedDate, taskId, updates);
            await loadPlan();
            setEditingTask(null);
            toastSuccess('Task updated!');
        } catch (error) {
            toastError('Failed to update task');
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            await deleteTask(user.uid, selectedDate, taskId);
            await loadPlan();
            toastSuccess('Task deleted');
        } catch (error) {
            toastError('Failed to delete task');
        }
    };

    const handleStatusChange = async (taskId, status) => {
        try {
            await updateTask(user.uid, selectedDate, taskId, { status });
            await loadPlan();
        } catch (error) {
            toastError('Failed to update status');
        }
    };

    const handleAIPlanGenerated = async (tasks) => {
        try {
            const existingTasks = plan?.tasks || [];
            const allTasks = [...existingTasks, ...tasks];
            await saveDailyPlan(user.uid, selectedDate, { tasks: allTasks });
            await loadPlan();
            setShowAIPlanner(false);
            toastSuccess(`Added ${tasks.length} tasks from AI!`);
        } catch (error) {
            toastError('Failed to save AI plan');
        }
    };

    const handleMoveUnfinished = async () => {
        const yesterday = new Date(selectedDate);
        yesterday.setDate(yesterday.getDate() - 1);

        try {
            const moved = await moveUnfinishedTasks(user.uid, yesterday, selectedDate);
            if (moved.length > 0) {
                await loadPlan();
                toastSuccess(`Moved ${moved.length} unfinished tasks!`);
            } else {
                toastInfo('No unfinished tasks to move');
            }
        } catch (error) {
            toastError('Failed to move tasks');
        }
    };

    // Date navigation
    const goToToday = () => setSelectedDate(new Date());
    const goToPrevDay = () => {
        const prev = new Date(selectedDate);
        prev.setDate(prev.getDate() - 1);
        setSelectedDate(prev);
    };
    const goToNextDay = () => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 1);
        setSelectedDate(next);
    };

    // Stats
    const stats = useMemo(() => getDayStats(plan?.tasks), [plan]);
    const hasTasks = plan?.tasks && plan.tasks.length > 0;

    // Swipe gesture for mobile date navigation
    const { handlers: swipeHandlers, isSwiping, swipeDirection, swipeDistance } = useSwipeGesture({
        onSwipeLeft: goToNextDay,  // Swipe left = next day
        onSwipeRight: goToPrevDay, // Swipe right = previous day
        threshold: 60,
        allowedTime: 400,
    });

    // Calculate swipe visual feedback
    const swipeProgress = Math.min(swipeDistance / 100, 1);
    const swipeStyle = isSwiping && (swipeDirection === 'left' || swipeDirection === 'right') ? {
        transform: `translateX(${swipeDirection === 'right' ? swipeDistance * 0.3 : -swipeDistance * 0.3}px)`,
        opacity: 1 - (swipeProgress * 0.2),
    } : {};

    return (
        <div className="tomorrow-plans">
            {/* Compact Header */}
            <header className="tp-header">
                <div className="tp-header-row">
                    <button className="tp-icon-btn" onClick={() => navigate('/')} title="Home">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                    </button>

                    {/* Date Navigation - Centered */}
                    <div className="tp-date-nav">
                        <button onClick={goToPrevDay} className="tp-nav-arrow">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setShowCalendar(true)}
                            className={`tp-date-btn ${isToday ? 'today' : ''}`}
                        >
                            <span className="date-label">{dateLabel}</span>
                            <span className="date-full">
                                {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        </button>
                        <button onClick={goToNextDay} className="tp-nav-arrow">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                        {!isToday && (
                            <button onClick={goToToday} className="tp-go-today">
                                Today
                            </button>
                        )}
                    </div>

                    <div className="tp-header-actions">
                        <button className="tp-icon-btn" onClick={toggleTheme} title="Toggle theme">
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
                                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                                </svg>
                            )}
                        </button>
                        <button className="tp-icon-btn" onClick={() => setShowCalendar(true)} title="Calendar">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Stats Bar - All statuses */}
                <div className="tp-stats-bar">
                    <div className="tp-stat">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Total</span>
                    </div>
                    <div className="tp-stat completed">
                        <span className="stat-value">{stats.completed}</span>
                        <span className="stat-label">Done</span>
                    </div>
                    <div className="tp-stat partial">
                        <span className="stat-value">{stats.partial}</span>
                        <span className="stat-label">Partial</span>
                    </div>
                    <div className="tp-stat tried">
                        <span className="stat-value">{stats.tried}</span>
                        <span className="stat-label">Tried</span>
                    </div>
                    <div className="tp-stat pending">
                        <span className="stat-value">{stats.notStarted}</span>
                        <span className="stat-label">Pending</span>
                    </div>
                </div>
            </header>

            {/* Main Content - Swipeable for date navigation on mobile */}
            <main
                className={`tp-main ${isSwiping ? 'swiping' : ''}`}
                {...swipeHandlers}
                style={swipeStyle}
            >
                {/* Swipe Indicators */}
                {isSwiping && swipeDirection === 'right' && swipeDistance > 20 && (
                    <div className="swipe-indicator left" style={{ opacity: swipeProgress }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        <span>Previous Day</span>
                    </div>
                )}
                {isSwiping && swipeDirection === 'left' && swipeDistance > 20 && (
                    <div className="swipe-indicator right" style={{ opacity: swipeProgress }}>
                        <span>Next Day</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </div>
                )}

                {loading ? (
                    <div className="tp-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading...</p>
                    </div>
                ) : !hasTasks ? (
                    <div className="tp-empty-state">
                        <div className="empty-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 6v6l4 2" />
                            </svg>
                        </div>
                        <h2>Plan your {dateLabel.toLowerCase()}</h2>
                        <p>Add tasks manually or let AI create a schedule</p>
                        <p className="swipe-hint">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                            Swipe to change day
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </p>

                        <div className="empty-actions">
                            <button
                                className="tp-action-btn primary"
                                onClick={() => setShowAIPlanner(true)}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                                Generate with AI
                            </button>
                            <button
                                className="tp-action-btn secondary"
                                onClick={() => setShowTaskForm(true)}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                Add Task
                            </button>
                        </div>

                        {isToday && (
                            <button
                                className="tp-move-btn"
                                onClick={handleMoveUnfinished}
                            >
                                Move yesterday's unfinished tasks →
                            </button>
                        )}
                    </div>
                ) : (
                    <TaskTimeline
                        tasks={plan.tasks}
                        onStatusChange={handleStatusChange}
                        onEdit={(task) => setEditingTask(task)}
                        onDelete={handleDeleteTask}
                        isToday={isToday}
                    />
                )}
            </main>

            {/* Floating Action Buttons */}
            {hasTasks && (
                <>
                    {/* Right Side - Add Task Menu (Expandable FAB) */}
                    <div className="fab-container right">
                        <input type="checkbox" id="fab-toggle" className="fab-toggle" />
                        <label htmlFor="fab-toggle" className="fab-main">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                        </label>
                        <div className="fab-menu">
                            <button
                                className="fab-option"
                                onClick={() => {
                                    document.getElementById('fab-toggle').checked = false;
                                    setShowTaskForm(true);
                                }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                <span>Manual</span>
                            </button>
                            <button
                                className="fab-option ai"
                                onClick={() => {
                                    document.getElementById('fab-toggle').checked = false;
                                    setShowAIPlanner(true);
                                }}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                                <span>AI Planner</span>
                            </button>
                        </div>
                    </div>

                    {/* Left Side - Plan Assistant */}
                    <button
                        className={`fab-assistant ${showChatbot ? 'active' : ''}`}
                        onClick={() => setShowChatbot(!showChatbot)}
                        title="Plan Assistant"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                        </svg>
                    </button>
                </>
            )}

            {/* Modals */}
            {showTaskForm && (
                <TaskForm
                    onSubmit={handleAddTask}
                    onClose={() => setShowTaskForm(false)}
                    existingTasks={plan?.tasks || []}
                />
            )}

            {editingTask && (
                <TaskForm
                    task={editingTask}
                    onSubmit={(data) => handleUpdateTask(editingTask.id, data)}
                    onClose={() => setEditingTask(null)}
                    existingTasks={plan?.tasks || []}
                    isEditing
                />
            )}

            {showAIPlanner && (
                <AIPlanner
                    onPlanGenerated={handleAIPlanGenerated}
                    onClose={() => setShowAIPlanner(false)}
                    existingTasks={plan?.tasks || []}
                />
            )}

            {showCalendar && (
                <MiniCalendar
                    selectedDate={selectedDate}
                    onDateSelect={(date) => {
                        setSelectedDate(date);
                        setShowCalendar(false);
                    }}
                    onClose={() => setShowCalendar(false)}
                    userId={user?.uid}
                />
            )}

            {showChatbot && (
                <PlanChatbot
                    tasks={plan?.tasks || []}
                    onClose={() => setShowChatbot(false)}
                />
            )}
        </div>
    );
}

export default TomorrowPlans;
