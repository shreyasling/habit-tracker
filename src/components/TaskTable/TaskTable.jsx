import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getDaysArray, getDayName, isToday, isPast, formatDateKey, getCurrentDate } from '../../utils/dateUtils';
import DaySelector from '../DaySelector/DaySelector';
import ConfirmDialog from '../ConfirmDialog';
import { toastSuccess, toastError } from '../Toast/Toast';
import './TaskTable.css';

function TaskTable({
    year,
    month,
    tasks,
    completionData,
    onToggleCompletion,
    onAddTask,
    onEditTask,
    onDeleteTask,
    onDayClick
}) {
    const [newTaskName, setNewTaskName] = useState('');
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedDays, setSelectedDays] = useState([]);
    const [loadingCells, setLoadingCells] = useState({}); // Track loading state per cell
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, taskId: null, taskName: '' });
    const [selectedTaskId, setSelectedTaskId] = useState(null); // For mobile tap-to-reveal actions
    const days = useMemo(() => getDaysArray(year, month), [year, month]);
    const daysInMonth = days.length;
    const tableRef = useRef(null);
    const todayColumnRef = useRef(null);
    const currentDate = getCurrentDate();

    // Initialize selected days when modal opens
    useEffect(() => {
        if (showAddModal) {
            setSelectedDays(Array.from({ length: daysInMonth }, (_, i) => i + 1));
            setNewTaskName('');
        }
    }, [showAddModal, daysInMonth]);

    // Scroll to today's column on mount and month change
    useEffect(() => {
        if (year === currentDate.year && month === currentDate.month) {
            setTimeout(() => {
                if (todayColumnRef.current) {
                    todayColumnRef.current.scrollIntoView({
                        behavior: 'smooth',
                        inline: 'center',
                        block: 'nearest'
                    });
                }
            }, 100);
        }
    }, [year, month, currentDate.year, currentDate.month]);

    const handleAddTask = (e) => {
        e?.preventDefault();
        if (newTaskName.trim() && selectedDays.length > 0) {
            onAddTask(newTaskName.trim(), selectedDays);
            toastSuccess(`Added "${newTaskName.trim()}" to your tasks!`);
            setNewTaskName('');
            setSelectedDays([]);
            setShowAddModal(false);
        }
    };

    const handleStartEdit = (task) => {
        setEditingTaskId(task.id);
        setEditingName(task.name);
    };

    const handleSaveEdit = (taskId) => {
        if (editingName.trim()) {
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

    const handleDeleteClick = (task) => {
        setDeleteConfirm({
            open: true,
            taskId: task.id,
            taskName: task.name
        });
    };

    const handleConfirmDelete = () => {
        if (deleteConfirm.taskId) {
            onDeleteTask(deleteConfirm.taskId);
            toastSuccess(`"${deleteConfirm.taskName}" has been deleted.`);
        }
        setDeleteConfirm({ open: false, taskId: null, taskName: '' });
    };

    const handleToggleWithLoading = async (taskId, day) => {
        const cellKey = `${taskId}-${day}`;
        setLoadingCells(prev => ({ ...prev, [cellKey]: true }));

        try {
            await onToggleCompletion(taskId, day);
        } catch (error) {
            toastError('Failed to update task. Please try again.');
        } finally {
            // Small delay to show the loading animation
            setTimeout(() => {
                setLoadingCells(prev => {
                    const newState = { ...prev };
                    delete newState[cellKey];
                    return newState;
                });
            }, 200);
        }
    };

    const getCompletionForCell = (taskId, day) => {
        const dateKey = formatDateKey(year, month, day);
        return completionData[taskId]?.[dateKey] || false;
    };

    // Check if task applies to a specific day
    const taskAppliesToDay = (task, day) => {
        if (!task.days) return true; // Legacy tasks apply to all days
        return task.days.includes(day);
    };

    const getDayCompletionPercentage = (day) => {
        // Only count tasks that apply to this day
        const applicableTasks = tasks.filter(task => taskAppliesToDay(task, day));
        if (applicableTasks.length === 0) return 0;

        const dateKey = formatDateKey(year, month, day);
        let completed = 0;
        applicableTasks.forEach(task => {
            if (completionData[task.id]?.[dateKey]) {
                completed++;
            }
        });
        return Math.round((completed / applicableTasks.length) * 100);
    };

    // Add Task Modal
    const addTaskModal = showAddModal && createPortal(
        <div className="add-task-modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="add-task-modal" onClick={(e) => e.stopPropagation()}>
                <div className="add-task-modal-header">
                    <h3>Add New Task</h3>
                    <button className="close-modal-btn" onClick={() => setShowAddModal(false)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <div className="add-task-modal-content">
                    <div className="task-name-input-group">
                        <label>Task Name</label>
                        <input
                            type="text"
                            value={newTaskName}
                            onChange={(e) => setNewTaskName(e.target.value)}
                            placeholder="Enter task name..."
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newTaskName.trim() && selectedDays.length > 0) {
                                    handleAddTask();
                                }
                            }}
                        />
                    </div>
                    <div className="day-selection-group">
                        <label>Select Days</label>
                        <DaySelector
                            year={year}
                            month={month}
                            daysInMonth={daysInMonth}
                            selectedDays={selectedDays}
                            onDaysChange={setSelectedDays}
                        />
                    </div>
                </div>
                <div className="add-task-modal-footer">
                    <button
                        className="cancel-modal-btn"
                        onClick={() => setShowAddModal(false)}
                    >
                        Cancel
                    </button>
                    <button
                        className="add-task-confirm-btn"
                        onClick={handleAddTask}
                        disabled={!newTaskName.trim() || selectedDays.length === 0}
                    >
                        Add Task ({selectedDays.length} day{selectedDays.length !== 1 ? 's' : ''})
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );

    return (
        <div className="task-table-container">
            <div className="table-header-bar">
                <div className="table-title">
                    <h2>Task Tracker</h2>
                    <span className="task-count">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
                </div>

                <button
                    className="add-task-btn"
                    onClick={() => setShowAddModal(true)}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Task
                </button>
            </div>

            <div className="table-scroll-container" ref={tableRef}>
                <table className="task-table">
                    <thead>
                        <tr>
                            <th className="task-name-header">
                                <span>Task</span>
                            </th>
                            {days.map(day => {
                                const isTodayColumn = isToday(year, month, day);
                                const isPastDay = isPast(year, month, day);
                                const dayName = getDayName(year, month, day);
                                const completionPct = getDayCompletionPercentage(day);

                                return (
                                    <th
                                        key={day}
                                        ref={isTodayColumn ? todayColumnRef : null}
                                        className={`day-header ${isTodayColumn ? 'today' : ''} ${isPastDay ? 'past' : ''}`}
                                        onClick={() => onDayClick(day)}
                                    >
                                        <span className="day-name">{dayName}</span>
                                        <span className="day-number">{day}</span>
                                        {tasks.length > 0 && (
                                            <div
                                                className="day-completion-indicator"
                                                style={{ '--completion': completionPct }}
                                                title={`${completionPct}% complete`}
                                            />
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.length === 0 ? (
                            <tr className="empty-row">
                                <td colSpan={days.length + 1}>
                                    <div className="empty-state">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                            <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
                                        </svg>
                                        <h3>No tasks yet</h3>
                                        <p>Click &quot;Add Task&quot; to start tracking your productivity</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            tasks.map((task, index) => (
                                <tr
                                    key={task.id}
                                    className="task-row animate-slide-in"
                                    style={{ animationDelay: `${index * 30}ms` }}
                                >
                                    <td className="task-name-cell">
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
                                    </td>
                                    {days.map(day => {
                                        const isCompleted = getCompletionForCell(task.id, day);
                                        const isTodayColumn = isToday(year, month, day);
                                        const isPastDay = isPast(year, month, day);
                                        const appliesToDay = taskAppliesToDay(task, day);
                                        const cellKey = `${task.id}-${day}`;
                                        const isLoading = loadingCells[cellKey];

                                        return (
                                            <td
                                                key={day}
                                                className={`checkbox-cell ${isTodayColumn ? 'today' : ''} ${isPastDay ? 'past' : ''} ${!appliesToDay ? 'not-applicable' : ''}`}
                                            >
                                                {appliesToDay ? (
                                                    <label className={`checkbox-wrapper ${isLoading ? 'loading' : ''}`}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isCompleted}
                                                            onChange={() => handleToggleWithLoading(task.id, day)}
                                                            className="checkbox-input"
                                                            disabled={isLoading}
                                                        />
                                                        <span className={`checkbox-custom ${isCompleted ? 'checked' : ''} ${isLoading ? 'loading' : ''}`}>
                                                            {isLoading ? (
                                                                <span className="checkbox-spinner" />
                                                            ) : isCompleted ? (
                                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                                    <polyline points="20 6 9 17 4 12" />
                                                                </svg>
                                                            ) : null}
                                                        </span>
                                                    </label>
                                                ) : (
                                                    <span className="not-applicable-marker" title="Task not scheduled for this day">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {addTaskModal}

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

export default TaskTable;