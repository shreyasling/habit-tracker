import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Area, AreaChart,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { getDaysArray, formatDateKey, getMonthName, getDayName, isToday, isPast } from '../../utils/dateUtils';
import './Analytics.css';

const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

function Analytics({ year, month, tasks, completionData, selectedDay, onDayClick }) {
    const days = useMemo(() => getDaysArray(year, month), [year, month]);

    // Helper to check if task applies to a specific day
    const taskAppliesToDay = (task, day) => {
        if (!task.days) return true; // Legacy tasks apply to all days
        return task.days.includes(day);
    };

    const dailyData = useMemo(() => {
        return days.map(day => {
            const dateKey = formatDateKey(year, month, day);
            // Only count tasks that apply to this day
            const applicableTasks = tasks.filter(task => taskAppliesToDay(task, day));
            let completed = 0;
            applicableTasks.forEach(task => {
                if (completionData[task.id]?.[dateKey]) completed++;
            });
            const percentage = applicableTasks.length > 0 ? Math.round((completed / applicableTasks.length) * 100) : 0;
            return {
                day, label: `${day}`, fullLabel: `${getDayName(year, month, day)} ${day}`,
                completed, total: applicableTasks.length, percentage,
                isToday: isToday(year, month, day), isPast: isPast(year, month, day)
            };
        });
    }, [days, year, month, tasks, completionData]);

    const monthlyStats = useMemo(() => {
        let totalCells = 0;
        let completedCells = 0;

        tasks.forEach(task => {
            const taskDays = task.days || days;
            taskDays.forEach(day => {
                if (day <= days.length) {
                    totalCells++;
                    const dateKey = formatDateKey(year, month, day);
                    if (completionData[task.id]?.[dateKey]) completedCells++;
                }
            });
        });

        const percentage = totalCells > 0 ? Math.round((completedCells / totalCells) * 100) : 0;
        const streak = calculateStreak(days, tasks, completionData, year, month, taskAppliesToDay);
        return { completedCells, totalCells, percentage, streak };
    }, [days, tasks, completionData, year, month]);

    const taskStats = useMemo(() => {
        return tasks.map((task, index) => {
            const taskDays = task.days || days;
            let completed = 0;
            let total = 0;

            taskDays.forEach(day => {
                if (day <= days.length) {
                    total++;
                    const dateKey = formatDateKey(year, month, day);
                    if (completionData[task.id]?.[dateKey]) completed++;
                }
            });

            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
            return { ...task, completed, total, percentage, color: CHART_COLORS[index % CHART_COLORS.length] };
        });
    }, [tasks, days, completionData, year, month]);

    const pieData = useMemo(() => {
        const completed = monthlyStats.completedCells;
        const remaining = monthlyStats.totalCells - completed;
        return [
            { name: 'Completed', value: completed, color: '#22c55e' },
            { name: 'Remaining', value: remaining, color: '#27272a' }
        ];
    }, [monthlyStats]);

    const selectedDayData = selectedDay ? dailyData.find(d => d.day === selectedDay) : null;

    return (
        <div className="analytics">
            <div className="analytics-grid">
                {/* Stats Cards */}
                <div className="stats-cards">
                    <StatCard title="Monthly Progress" value={`${monthlyStats.percentage}%`} subtitle={`${monthlyStats.completedCells} of ${monthlyStats.totalCells} tasks`} icon="chart" accent />
                    <StatCard title="Current Streak" value={`${monthlyStats.streak}`} subtitle="consecutive days" icon="fire" />
                    <StatCard title="Tasks" value={tasks.length} subtitle={`tracking ${days.length} days`} icon="list" />
                    <StatCard title="Today" value={`${dailyData.find(d => d.isToday)?.percentage || 0}%`} subtitle="complete" icon="today" />
                </div>

                {/* Daily Bar Chart */}
                <div className="chart-card daily-chart">
                    <div className="chart-header">
                        <h3>Daily Completion</h3>
                        <span className="chart-subtitle">{getMonthName(month)} {year}</span>
                    </div>
                    <div className="chart-container bar-chart-container">
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                                <XAxis dataKey="label" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={{ stroke: '#27272a' }} tickLine={false} interval="preserveStartEnd" />
                                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(34, 197, 94, 0.1)' }} />
                                <Bar dataKey="percentage" radius={[4, 4, 0, 0]} onClick={(data) => onDayClick(data.day)}>
                                    {dailyData.map((entry, index) => (
                                        <Cell key={index} fill={entry.isToday ? '#22c55e' : entry.isPast ? '#3f3f46' : '#52525b'} cursor="pointer" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="chart-card pie-chart-card">
                    <div className="chart-header">
                        <h3>Overall Progress</h3>
                        <span className="chart-subtitle">This month</span>
                    </div>
                    <div className="chart-container pie-container">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                                    {pieData.map((entry, index) => (<Cell key={index} fill={entry.color} stroke="none" />))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="pie-center-label">
                            <span className="pie-percentage">{monthlyStats.percentage}%</span>
                            <span className="pie-label">Complete</span>
                        </div>
                    </div>
                </div>

                {/* Spider Web / Radar Chart */}
                <div className="chart-card radar-chart-card">
                    <div className="chart-header">
                        <h3>Habit Web</h3>
                        <span className="chart-subtitle">Task balance overview</span>
                    </div>
                    <div className="chart-container radar-container">
                        {taskStats.length >= 3 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <RadarChart data={taskStats} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                                    <PolarGrid
                                        stroke="var(--color-border-secondary)"
                                        strokeOpacity={0.5}
                                    />
                                    <PolarAngleAxis
                                        dataKey="name"
                                        tick={{
                                            fill: 'var(--color-text-secondary)',
                                            fontSize: 11,
                                            fontWeight: 500
                                        }}
                                        tickLine={false}
                                    />
                                    <PolarRadiusAxis
                                        angle={30}
                                        domain={[0, 100]}
                                        tick={{ fill: 'var(--color-text-tertiary)', fontSize: 10 }}
                                        tickFormatter={(v) => `${v}%`}
                                        axisLine={false}
                                    />
                                    <Radar
                                        name="Completion"
                                        dataKey="percentage"
                                        stroke="#22c55e"
                                        fill="#22c55e"
                                        fillOpacity={0.3}
                                        strokeWidth={2}
                                        dot={{ fill: '#22c55e', strokeWidth: 0, r: 4 }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="no-tasks radar-placeholder">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                                    <line x1="12" y1="22" x2="12" y2="15.5" />
                                    <line x1="22" y1="8.5" x2="15" y2="12" />
                                    <line x1="2" y1="8.5" x2="9" y2="12" />
                                </svg>
                                <p>Add at least 3 tasks to see the habit web</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Task Performance */}
                <div className="chart-card task-performance">
                    <div className="chart-header">
                        <h3>Task Performance</h3>
                        <span className="chart-subtitle">Per task completion rate</span>
                    </div>
                    <div className="task-bars">
                        {taskStats.length === 0 ? (
                            <div className="no-tasks">
                                <p>Add tasks to see performance stats</p>
                            </div>
                        ) : (
                            taskStats.map(task => (
                                <div key={task.id} className="task-bar-item">
                                    <div className="task-bar-header">
                                        <span className="task-bar-name">{task.name}</span>
                                        <span className="task-bar-percentage">{task.percentage}%</span>
                                    </div>
                                    <div className="task-bar-track">
                                        <div className="task-bar-fill" style={{ width: `${task.percentage}%`, background: task.color }} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Selected Day Detail */}
                {selectedDayData && (
                    <div className="chart-card day-detail animate-scale-in">
                        <div className="chart-header">
                            <h3>{selectedDayData.fullLabel}</h3>
                            <button className="close-btn" onClick={() => onDayClick(null)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                        <div className="day-detail-content">
                            <div className="day-detail-stat">
                                <span className="day-detail-value">{selectedDayData.completed}</span>
                                <span className="day-detail-label">Tasks Completed</span>
                            </div>
                            <div className="day-detail-stat">
                                <span className="day-detail-value">{selectedDayData.percentage}%</span>
                                <span className="day-detail-label">Completion Rate</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ title, value, subtitle, icon, accent }) {
    const icons = {
        chart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
        fire: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>,
        list: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>,
        today: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
    };
    return (
        <div className={`stat-card ${accent ? 'accent' : ''}`}>
            <div className="stat-icon">{icons[icon]}</div>
            <div className="stat-content">
                <span className="stat-value">{value}</span>
                <span className="stat-title">{title}</span>
                <span className="stat-subtitle">{subtitle}</span>
            </div>
        </div>
    );
}

function CustomTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
        <div className="custom-tooltip">
            <p className="tooltip-title">{data.fullLabel}</p>
            <p className="tooltip-value">{data.completed} / {data.total} tasks</p>
            <p className="tooltip-percentage">{data.percentage}% complete</p>
        </div>
    );
}

function calculateStreak(days, tasks, completionData, year, month, taskAppliesToDay) {
    if (tasks.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    for (let i = days.length; i >= 1; i--) {
        const checkDate = new Date(year, month, i);
        if (checkDate > today) continue;
        const dateKey = formatDateKey(year, month, i);

        // Check if all applicable tasks are completed for this day
        const applicableTasks = tasks.filter(task => taskAppliesToDay ? taskAppliesToDay(task, i) : true);
        let allCompleted = applicableTasks.length > 0;
        for (const task of applicableTasks) {
            if (!completionData[task.id]?.[dateKey]) { allCompleted = false; break; }
        }

        if (allCompleted) streak++; else if (isPast(year, month, i)) break;
    }
    return streak;
}

export default Analytics;
