import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import TaskTable from '../../components/TaskTable/TaskTable';
import Analytics from '../../components/Analytics/Analytics';
import AIChatBot from '../../components/AIChatBot/AIChatBot';
import AIAnalysis from '../../components/AIAnalysis/AIAnalysis';
import MonthSetup from '../../components/MonthSetup/MonthSetup';
import WeeklyView from '../../components/Views/WeeklyView';
import { toastSuccess, toastError, toastInfo, toastCelebration } from '../../components/Toast/Toast';
import { logOut } from '../../firebase/authService';
import {
    initializeUserData,
    updateMonthTasks,
    updateCompletionData,
    subscribeToUserData,
    formatMonthKey,
    getPreviousMonthKey,
    hasTasksForMonth,
    migrateOldTasks
} from '../../firebase/firestoreService';
import { getCurrentDate, formatDateKey, getDaysArray } from '../../utils/dateUtils';
import './ProductivityTracker.css';

// Streak milestones for celebration
const STREAK_MILESTONES = [3, 7, 14, 21, 30, 50, 100];

function ProductivityTracker({ user }) {
    const navigate = useNavigate();
    const currentDate = getCurrentDate();
    const previousStreakRef = useRef(0);

    // Current view state
    const [year, setYear] = useState(currentDate.year);
    const [month, setMonth] = useState(currentDate.month);
    const [selectedDay, setSelectedDay] = useState(null);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [showMonthSetup, setShowMonthSetup] = useState(false);
    const [viewMode, setViewMode] = useState('month');

    // Data state (synced with Firebase)
    const [monthlyTasks, setMonthlyTasks] = useState({});
    const [completionData, setCompletionData] = useState({});
    const [dataLoading, setDataLoading] = useState(true);

    // Current month key
    const monthKey = formatMonthKey(year, month);
    const previousMonthKey = getPreviousMonthKey(year, month);

    // Current month's tasks
    const tasks = useMemo(() => {
        const monthTasks = monthlyTasks[monthKey];
        if (!monthTasks) return [];
        return monthTasks;
    }, [monthlyTasks, monthKey]);

    // Update scheduler tasks when tasks change
    useEffect(() => {
        if (tasks.length > 0) {
            localStorage.setItem('currentTasks', JSON.stringify(tasks));
        }
    }, [tasks]);

    // Previous month's tasks for reuse
    const previousMonthTasks = useMemo(() => {
        return monthlyTasks[previousMonthKey] || [];
    }, [monthlyTasks, previousMonthKey]);

    // Days in current month
    const days = useMemo(() => getDaysArray(year, month), [year, month]);
    const daysInMonth = days.length;

    // Get previous month name
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const previousMonth = month === 0 ? 11 : month - 1;
    const previousMonthName = monthNames[previousMonth];
    const currentMonthName = monthNames[month];

    // Subscribe to user data when logged in
    useEffect(() => {
        if (!user) return;

        setDataLoading(true);

        // Initialize user data
        initializeUserData(user.uid).then(async (data) => {
            try {
                const migratedTasks = await migrateOldTasks(user.uid, year, month);
                if (migratedTasks) {
                    setMonthlyTasks({ [monthKey]: migratedTasks });
                } else {
                    setMonthlyTasks(data.monthlyTasks || {});
                }
                setCompletionData(data.completionData || {});
            } catch (error) {
                console.error('Failed to load user data:', error);
                toastError('Failed to load your data. Please refresh the page.');
            } finally {
                setDataLoading(false);
            }
        }).catch((error) => {
            console.error('Failed to initialize user data:', error);
            toastError('Failed to connect to database. Please check your internet connection.');
            setDataLoading(false);
        });

        // Subscribe to real-time updates
        const unsubscribe = subscribeToUserData(user.uid, (data) => {
            if (data) {
                setMonthlyTasks(data.monthlyTasks || {});
                setCompletionData(data.completionData || {});
            }
        });

        return () => unsubscribe();
    }, [user, monthKey, year, month]);

    // Calculate stats for AI context
    const monthStats = useMemo(() => {
        let totalCells = 0;
        let completedCells = 0;

        tasks.forEach(task => {
            const taskDays = task.days || days;
            taskDays.forEach(day => {
                if (day <= daysInMonth) {
                    totalCells++;
                    const dateKey = formatDateKey(year, month, day);
                    if (completionData[task.id]?.[dateKey]) {
                        completedCells++;
                    }
                }
            });
        });

        const percentage = totalCells > 0 ? Math.round((completedCells / totalCells) * 100) : 0;

        // Calculate streak
        let streak = 0;
        const today = new Date();
        for (let i = daysInMonth; i >= 1; i--) {
            const checkDate = new Date(year, month, i);
            if (checkDate > today) continue;
            const dateKey = formatDateKey(year, month, i);

            let allCompleted = tasks.length > 0;
            for (const task of tasks) {
                const taskDays = task.days || days;
                if (!taskDays.includes(i)) continue;
                if (!completionData[task.id]?.[dateKey]) {
                    allCompleted = false;
                    break;
                }
            }

            if (allCompleted && tasks.length > 0) streak++;
            else if (checkDate < today) break;
        }

        return { completedCells, totalCells, percentage, streak };
    }, [days, tasks, completionData, year, month, daysInMonth]);

    // Celebrate streak milestones
    useEffect(() => {
        const currentStreak = monthStats.streak;
        const prevStreak = previousStreakRef.current;

        if (currentStreak === prevStreak + 1) {
            for (const milestone of STREAK_MILESTONES) {
                if (currentStreak === milestone) {
                    const messages = {
                        3: '🔥 3-day streak! You\'re building momentum!',
                        7: '🎉 1 WEEK STREAK! Incredible consistency!',
                        14: '⭐ 2 WEEKS! You\'re unstoppable!',
                        21: '🏆 21 DAYS! A habit is forming!',
                        30: '👑 30-DAY STREAK! You\'re a productivity master!',
                        50: '💎 50 DAYS! Legendary discipline!',
                        100: '🌟 100-DAY STREAK! You\'re absolutely incredible!'
                    };
                    toastCelebration(messages[milestone]);
                    break;
                }
            }
        }

        previousStreakRef.current = currentStreak;
    }, [monthStats.streak]);

    const taskStats = useMemo(() => {
        return tasks.map((task) => {
            const taskDays = task.days || days;
            let completed = 0;
            let total = 0;

            taskDays.forEach(day => {
                if (day <= daysInMonth) {
                    total++;
                    const dateKey = formatDateKey(year, month, day);
                    if (completionData[task.id]?.[dateKey]) completed++;
                }
            });

            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
            return { ...task, completed, total, percentage };
        });
    }, [tasks, days, completionData, year, month, daysInMonth]);

    // Daily data for AI context
    const dailyData = useMemo(() => {
        return days.map(day => {
            const dateKey = formatDateKey(year, month, day);
            let completed = 0;
            let total = 0;

            tasks.forEach(task => {
                const taskDays = task.days || days;
                if (taskDays.includes(day)) {
                    total++;
                    if (completionData[task.id]?.[dateKey]) completed++;
                }
            });

            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
            return { day, completed, total, percentage };
        });
    }, [days, year, month, tasks, completionData]);

    // AI Context for chatbot
    const aiContext = useMemo(() => ({
        year,
        monthName: currentMonthName,
        monthlyPercentage: monthStats.percentage,
        taskNames: tasks.map(t => t.name),
        streak: monthStats.streak,
        dailyData: dailyData,
        taskStats: taskStats
    }), [year, currentMonthName, monthStats, tasks, dailyData, taskStats]);

    // Handle month navigation
    const handleMonthChange = useCallback((newYear, newMonth) => {
        setYear(newYear);
        setMonth(newMonth);
        setSelectedDay(null);

        const newMonthKey = formatMonthKey(newYear, newMonth);
        if (!hasTasksForMonth(monthlyTasks, newMonthKey)) {
            setShowMonthSetup(true);
        }
    }, [monthlyTasks]);

    // Handle day click for analytics
    const handleDayClick = useCallback((day) => {
        setSelectedDay(prev => prev === day ? null : day);
    }, []);

    // Toggle task completion for a specific day (Firebase)
    const handleToggleCompletion = useCallback(async (taskId, day, targetMonth = month, targetYear = year) => {
        if (!user) return;

        if (targetMonth === month && targetYear === year) {
            const task = tasks.find(t => t.id === taskId);
            if (task && task.days && !task.days.includes(day)) {
                return;
            }
        }

        const dateKey = formatDateKey(targetYear, targetMonth, day);
        const newCompletionData = {
            ...completionData,
            [taskId]: {
                ...completionData[taskId],
                [dateKey]: !completionData[taskId]?.[dateKey]
            }
        };

        setCompletionData(newCompletionData);

        try {
            await updateCompletionData(user.uid, newCompletionData);
        } catch (error) {
            setCompletionData(completionData);
            console.error('Failed to update task:', error);
            throw error;
        }
    }, [user, year, month, completionData, tasks]);

    // Add a new task (Firebase)
    const handleAddTask = useCallback(async (name, selectedDays = null) => {
        if (!user) return;

        const newTask = {
            id: Date.now().toString(),
            name,
            days: selectedDays || Array.from({ length: daysInMonth }, (_, i) => i + 1),
            createdFromPreviousMonth: false
        };

        const newTasks = [...tasks, newTask];
        setMonthlyTasks(prev => ({ ...prev, [monthKey]: newTasks }));

        try {
            await updateMonthTasks(user.uid, monthKey, newTasks);
        } catch (error) {
            setMonthlyTasks(prev => ({ ...prev, [monthKey]: tasks }));
            toastError('Failed to add task. Please try again.');
        }
    }, [user, tasks, monthKey, daysInMonth]);

    // Edit an existing task (Firebase)
    const handleEditTask = useCallback(async (taskId, newName) => {
        if (!user) return;

        const newTasks = tasks.map(task =>
            task.id === taskId ? { ...task, name: newName } : task
        );
        setMonthlyTasks(prev => ({ ...prev, [monthKey]: newTasks }));

        try {
            await updateMonthTasks(user.uid, monthKey, newTasks);
        } catch (error) {
            setMonthlyTasks(prev => ({ ...prev, [monthKey]: tasks }));
            toastError('Failed to update task. Please try again.');
        }
    }, [user, tasks, monthKey]);

    // Delete a task (Firebase)
    const handleDeleteTask = useCallback(async (taskId) => {
        if (!user) return;

        const newTasks = tasks.filter(task => task.id !== taskId);
        const newCompletionData = { ...completionData };
        delete newCompletionData[taskId];

        setMonthlyTasks(prev => ({ ...prev, [monthKey]: newTasks }));
        setCompletionData(newCompletionData);

        try {
            await updateMonthTasks(user.uid, monthKey, newTasks);
            await updateCompletionData(user.uid, newCompletionData);
        } catch (error) {
            setMonthlyTasks(prev => ({ ...prev, [monthKey]: tasks }));
            setCompletionData(completionData);
            toastError('Failed to delete task. Please try again.');
        }
    }, [user, tasks, completionData, monthKey]);

    // Handle month setup completion
    const handleMonthSetupComplete = useCallback(async (setupTasks) => {
        if (!user) return;

        setMonthlyTasks(prev => ({ ...prev, [monthKey]: setupTasks }));

        try {
            await updateMonthTasks(user.uid, monthKey, setupTasks);
            setShowMonthSetup(false);
            if (setupTasks.length > 0) {
                toastSuccess(`Added ${setupTasks.length} task${setupTasks.length > 1 ? 's' : ''} for ${currentMonthName}!`);
            }
        } catch (error) {
            toastError('Failed to save tasks. Please try again.');
        }
    }, [user, monthKey, currentMonthName]);

    // Handle logout
    const handleLogout = async () => {
        try {
            await logOut();
            toastInfo('Signed out successfully');
            navigate('/');
        } catch (error) {
            console.error('Logout failed:', error);
            toastError('Failed to sign out. Please try again.');
        }
    };

    // Show loading while fetching data
    if (dataLoading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Loading your data...</p>
            </div>
        );
    }

    return (
        <div className="productivity-tracker">
            <Header
                year={year}
                month={month}
                onMonthChange={handleMonthChange}
                onAnalyzeClick={() => setShowAnalysis(true)}
                user={user}
                onLogout={handleLogout}
                tasks={tasks}
                showHomeButton={true}
                onHomeClick={() => navigate('/')}
            />

            <main className="main-content">
                <div className="content-container">
                    <div className="view-switcher">
                        <button
                            className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
                            onClick={() => setViewMode('month')}
                        >
                            Monthly
                        </button>
                        <button
                            className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
                            onClick={() => setViewMode('week')}
                        >
                            Weekly
                        </button>
                    </div>

                    {viewMode === 'month' ? (
                        <TaskTable
                            year={year}
                            month={month}
                            tasks={tasks}
                            completionData={completionData}
                            onToggleCompletion={handleToggleCompletion}
                            onAddTask={handleAddTask}
                            onEditTask={handleEditTask}
                            onDeleteTask={handleDeleteTask}
                            onDayClick={handleDayClick}
                        />
                    ) : (
                        <WeeklyView
                            currentDate={new Date()}
                            tasks={tasks}
                            completionData={completionData}
                            onToggleCompletion={handleToggleCompletion}
                            onEditTask={handleEditTask}
                            onDeleteTask={handleDeleteTask}
                        />
                    )}

                    <Analytics
                        year={year}
                        month={month}
                        tasks={tasks}
                        completionData={completionData}
                        selectedDay={selectedDay}
                        onDayClick={handleDayClick}
                    />
                </div>
            </main>

            <footer className="footer">
                <p>Track your habits • Build consistency • Achieve your goals</p>
            </footer>

            {/* Month Setup Modal */}
            <MonthSetup
                isVisible={showMonthSetup}
                onClose={() => setShowMonthSetup(false)}
                year={year}
                month={month}
                previousMonthTasks={previousMonthTasks}
                previousMonthName={previousMonthName}
                daysInMonth={daysInMonth}
                onSetupComplete={handleMonthSetupComplete}
            />

            {/* AI Features */}
            <AIChatBot
                context={aiContext}
                tasks={tasks}
                year={year}
                month={month}
                onToggleCompletion={handleToggleCompletion}
            />

            <AIAnalysis
                tasks={tasks}
                completionData={completionData}
                monthStats={monthStats}
                taskStats={taskStats}
                isVisible={showAnalysis}
                onClose={() => setShowAnalysis(false)}
            />
        </div>
    );
}

export default ProductivityTracker;
