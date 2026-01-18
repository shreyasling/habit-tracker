import { useMemo, useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, addWeeks, subWeeks } from 'date-fns';
import { getDaysArray, getDayName, formatDateKey } from '../../utils/dateUtils';
import { toastSuccess, toastError } from '../Toast/Toast';
import './WeeklyView.css';

function WeeklyView({
    currentDate,
    tasks,
    completionData,
    onToggleCompletion
}) {
    // Local state for navigation
    const [currentWeekDate, setCurrentWeekDate] = useState(currentDate);

    // Effect removed to prevent resetting view on parent re-renders


    // Get current week days based on local state
    const weekDays = useMemo(() => {
        const start = startOfWeek(currentWeekDate, { weekStartsOn: 1 }); // Monday start
        const end = endOfWeek(currentWeekDate, { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentWeekDate]);

    // Format header date range
    const weekRange = `${format(weekDays[0], 'MMM d')} - ${format(weekDays[6], 'MMM d, yyyy')}`;

    const handlePrevWeek = () => {
        setCurrentWeekDate(prev => subWeeks(prev, 1));
    };

    const handleNextWeek = () => {
        setCurrentWeekDate(prev => addWeeks(prev, 1));
    };

    const handleToggle = async (taskId, date) => {
        const day = date.getDate();
        const month = date.getMonth();
        const year = date.getFullYear();

        try {
            await onToggleCompletion(taskId, day, month, year);
        } catch (error) {
            toastError('Failed to update task');
        }
    };

    return (
        <div className="weekly-view-container">
            <div className="weekly-header">
                <h2>Weekly Overview</h2>
                <div className="week-navigation">
                    <button className="nav-btn" onClick={handlePrevWeek} aria-label="Previous week">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    <span className="week-range">{weekRange}</span>
                    <button className="nav-btn" onClick={handleNextWeek} aria-label="Next week">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="weekly-grid-wrapper">
                <div className="weekly-grid">
                    <div className="grid-header-row">
                        <div className="task-column-header">Task</div>
                        {weekDays.map(date => (
                            <div
                                key={date.toISOString()}
                                className={`day-column-header ${isToday(date) ? 'today' : ''}`}
                            >
                                <span className="day-name">{format(date, 'EEE')}</span>
                                <span className="day-number">{format(date, 'd')}</span>
                            </div>
                        ))}
                    </div>

                    {tasks.length === 0 ? (
                        <div className="empty-week-state">
                            <p>No tasks scheduled for this week.</p>
                        </div>
                    ) : (
                        tasks.map(task => (
                            <div key={task.id} className="grid-task-row">
                                <div className="task-name-cell">
                                    <span>{task.name}</span>
                                </div>
                                {weekDays.map(date => {
                                    const day = date.getDate();
                                    const month = date.getMonth();
                                    const year = date.getFullYear();
                                    const dateKey = formatDateKey(year, month, day);
                                    const isCompleted = completionData[task.id]?.[dateKey];

                                    // Check if task applies to this day (if logic exists)
                                    // simplified for now assuming monthly tasks apply

                                    return (
                                        <div key={date.toISOString()} className="task-check-cell">
                                            <label className="checkbox-wrapper">
                                                <input
                                                    type="checkbox"
                                                    checked={!!isCompleted}
                                                    onChange={() => handleToggle(task.id, date)}
                                                    className="checkbox-input"
                                                />
                                                <span className={`checkbox-custom ${isCompleted ? 'checked' : ''}`}>
                                                    {isCompleted && (
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    )}
                                                </span>
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default WeeklyView;
