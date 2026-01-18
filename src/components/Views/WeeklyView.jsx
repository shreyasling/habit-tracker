import { useMemo, useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, addWeeks, subWeeks } from 'date-fns';
import { getDaysArray, getDayName, formatDateKey } from '../../utils/dateUtils';
import { toastSuccess, toastError } from '../Toast/Toast';
import ConfirmDialog from '../ConfirmDialog';
import './WeeklyView.css';

function WeeklyView({
    currentDate,
    tasks,
    completionData,
    onToggleCompletion,
    onEditTask,
    onDeleteTask
}) {
    // Local state for navigation
    const [currentWeekDate, setCurrentWeekDate] = useState(currentDate);

    // Editing state
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, taskId: null, taskName: '' });
    const [selectedTaskId, setSelectedTaskId] = useState(null); // For mobile tap-to-reveal actions

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

    // Edit handlers
    const handleStartEdit = (task) => {
        setEditingTaskId(task.id);
        setEditingName(task.name);
    };

    const handleSaveEdit = (taskId) => {
        if (editingName.trim() && onEditTask) {
            onEditTask(taskId, editingName.trim());
            toastSuccess('Task updated successfully!');
        }
        setEditingTaskId(null);
        setEditingName('');
    };

    const handleCancelEdit = () => {
        setEditingTaskId(null);
        setEditingName('');
    };

    // Delete handlers
    const handleDeleteClick = (task) => {
        setDeleteConfirm({
            open: true,
            taskId: task.id,
            taskName: task.name
        });
    };

    const handleConfirmDelete = () => {
        if (deleteConfirm.taskId && onDeleteTask) {
            onDeleteTask(deleteConfirm.taskId);
            toastSuccess(`"${deleteConfirm.taskName}" has been deleted.`);
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
                                    {editingTaskId === task.id ? (
                                        <div className="edit-task-form">
                                            <input
                                                type="text"
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSaveEdit(task.id);
                                                    if (e.key === 'Escape') handleCancelEdit();
                                                }}
                                                className="edit-task-input"
                                                autoFocus
                                            />
                                            <button
                                                className="save-btn small"
                                                onClick={() => handleSaveEdit(task.id)}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </button>
                                            <button
                                                className="cancel-btn small"
                                                onClick={handleCancelEdit}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="18" y1="6" x2="6" y2="18" />
                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            className={`task-name-content ${selectedTaskId === task.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedTaskId(selectedTaskId === task.id ? null : task.id)}
                                        >
                                            <span className="task-name">{task.name}</span>
                                            <div className="task-actions">
                                                <button
                                                    className="action-btn edit"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStartEdit(task);
                                                        setSelectedTaskId(null);
                                                    }}
                                                    title="Edit task"
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteClick(task);
                                                        setSelectedTaskId(null);
                                                    }}
                                                    title="Delete task"
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6" />
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {weekDays.map(date => {
                                    const day = date.getDate();
                                    const month = date.getMonth();
                                    const year = date.getFullYear();
                                    const dateKey = formatDateKey(year, month, day);
                                    const isCompleted = completionData[task.id]?.[dateKey];

                                    // Check if task applies to this day based on task.days property
                                    // task.days contains the day numbers (1-31) when the task is applicable
                                    const taskAppliesToDay = !task.days || task.days.includes(day);

                                    return (
                                        <div key={date.toISOString()} className={`task-check-cell ${!taskAppliesToDay ? 'not-applicable' : ''}`}>
                                            {taskAppliesToDay ? (
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
                                            ) : (
                                                <span className="not-applicable-marker" title="Task not scheduled for this day">—</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.open}
                onClose={() => setDeleteConfirm({ open: false, taskId: null, taskName: '' })}
                onConfirm={handleConfirmDelete}
                title="Delete Task"
                message={`Are you sure you want to delete "${deleteConfirm.taskName}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />
        </div>
    );
}

export default WeeklyView;
