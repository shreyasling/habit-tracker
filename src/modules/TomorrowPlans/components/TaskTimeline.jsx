import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './TaskTimeline.css';

// Status configuration
const STATUS_OPTIONS = [
    { value: 'not-started', label: 'Not Started', color: '#6b7280', icon: '○' },
    { value: 'completed', label: 'Completed', color: '#22c55e', icon: '✓' },
    { value: 'partial', label: 'Partial', color: '#f59e0b', icon: '◐' },
    { value: 'tried', label: 'Tried', color: '#ef4444', icon: '✗' }
];

const PRIORITY_COLORS = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#6b7280'
};

// Mobile Action Sheet
function ActionSheet({ task, onEdit, onDelete, onStatusChange, onClose }) {
    const status = STATUS_OPTIONS.find(s => s.value === task.status) || STATUS_OPTIONS[0];

    return createPortal(
        <div className="action-sheet-overlay" onClick={onClose}>
            <div className="action-sheet" onClick={e => e.stopPropagation()}>
                <div className="action-sheet-handle" />

                <div className="action-sheet-header">
                    <h3>{task.title}</h3>
                    <p>{task.startTime} - {task.endTime}</p>
                </div>

                <div className="action-sheet-section">
                    <span className="section-label">Change Status</span>
                    <div className="status-grid">
                        {STATUS_OPTIONS.map(option => (
                            <button
                                key={option.value}
                                className={`status-option ${task.status === option.value ? 'active' : ''}`}
                                onClick={() => {
                                    onStatusChange(task.id, option.value);
                                    onClose();
                                }}
                                style={{ '--status-color': option.color }}
                            >
                                <span className="status-icon">{option.icon}</span>
                                <span>{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="action-sheet-actions">
                    <button className="sheet-action edit" onClick={() => { onEdit(task); onClose(); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit Task
                    </button>
                    <button className="sheet-action delete" onClick={() => onDelete(task)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                        Delete Task
                    </button>
                </div>

                <button className="sheet-cancel" onClick={onClose}>Cancel</button>
            </div>
        </div>,
        document.body
    );
}

// Delete Confirmation Modal
function DeleteConfirmModal({ task, onConfirm, onCancel }) {
    return createPortal(
        <div className="delete-modal-overlay" onClick={onCancel}>
            <div className="delete-modal" onClick={e => e.stopPropagation()}>
                <div className="delete-modal-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                </div>
                <h3>Delete Task?</h3>
                <p>Are you sure you want to delete "<strong>{task.title}</strong>"?</p>
                <p className="delete-warning">This action cannot be undone.</p>
                <div className="delete-modal-actions">
                    <button className="cancel-btn" onClick={onCancel}>Cancel</button>
                    <button className="confirm-btn" onClick={onConfirm}>Delete</button>
                </div>
            </div>
        </div>,
        document.body
    );
}

function TaskTimeline({ tasks, onStatusChange, onEdit, onDelete, isToday }) {
    const [expandedTask, setExpandedTask] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(null);
    const [actionSheetTask, setActionSheetTask] = useState(null);
    const [deleteTask, setDeleteTask] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);
    const dropdownRef = useRef(null);

    // Check for mobile
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 640);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sort tasks by start time
    const sortedTasks = [...tasks].sort((a, b) => {
        const timeA = a.startTime.replace(':', '');
        const timeB = b.startTime.replace(':', '');
        return parseInt(timeA) - parseInt(timeB);
    });

    // Check if a task is currently active
    const isTaskActive = (task) => {
        if (!isToday) return false;
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        return currentTime >= task.startTime && currentTime <= task.endTime;
    };

    const getStatusConfig = (status) => {
        return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
    };

    const handleStatusSelect = (taskId, newStatus) => {
        onStatusChange(taskId, newStatus);
        setDropdownOpen(null);
    };

    const handleTaskClick = (task) => {
        if (isMobile) {
            // On mobile, show action sheet
            setActionSheetTask(task);
        } else {
            // On desktop, toggle expand
            setExpandedTask(expandedTask === task.id ? null : task.id);
        }
    };

    const handleDeleteRequest = (task) => {
        setActionSheetTask(null);
        setDeleteTask(task);
    };

    const handleDeleteConfirm = () => {
        if (deleteTask) {
            onDelete(deleteTask.id);
            setDeleteTask(null);
            setExpandedTask(null);
        }
    };

    return (
        <div className="task-timeline">
            {sortedTasks.map((task, index) => {
                const isActive = isTaskActive(task);
                const status = getStatusConfig(task.status);
                const isExpanded = expandedTask === task.id && !isMobile;

                return (
                    <div
                        key={task.id}
                        className={`timeline-item ${isActive ? 'active' : ''} ${task.status} ${isExpanded ? 'expanded' : ''}`}
                    >
                        {/* Time Column */}
                        <div className="timeline-time">
                            <span className="time-start">{task.startTime}</span>
                            <span className="time-end">{task.endTime}</span>
                        </div>

                        {/* Line */}
                        <div className="timeline-line">
                            <div
                                className="line-dot"
                                style={{ backgroundColor: status.color }}
                            />
                            {index < sortedTasks.length - 1 && <div className="line-connector" />}
                        </div>

                        {/* Content */}
                        <div
                            className="timeline-content"
                            onClick={() => handleTaskClick(task)}
                        >
                            <div className="task-row">
                                <div className="task-info">
                                    {task.priority && (
                                        <span
                                            className="priority-dot"
                                            style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                                        />
                                    )}
                                    <span className="task-title">{task.title}</span>
                                    {task.aiGenerated && <span className="ai-tag">AI</span>}
                                </div>

                                {/* Status Dropdown - Desktop only */}
                                {!isMobile && (
                                    <div className="status-dropdown-container" ref={dropdownOpen === task.id ? dropdownRef : null}>
                                        <button
                                            className="status-trigger"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDropdownOpen(dropdownOpen === task.id ? null : task.id);
                                            }}
                                            style={{
                                                backgroundColor: `${status.color}15`,
                                                borderColor: `${status.color}40`,
                                                color: status.color
                                            }}
                                        >
                                            <span className="status-icon">{status.icon}</span>
                                            <span className="status-text">{status.label}</span>
                                            <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </button>

                                        {dropdownOpen === task.id && (
                                            <div className="status-dropdown">
                                                {STATUS_OPTIONS.map(option => (
                                                    <button
                                                        key={option.value}
                                                        className={`dropdown-item ${task.status === option.value ? 'selected' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStatusSelect(task.id, option.value);
                                                        }}
                                                        style={{ '--item-color': option.color }}
                                                    >
                                                        <span className="item-icon">{option.icon}</span>
                                                        <span className="item-label">{option.label}</span>
                                                        {task.status === option.value && (
                                                            <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Mobile status indicator */}
                                {isMobile && (
                                    <div
                                        className="mobile-status"
                                        style={{ backgroundColor: `${status.color}20`, color: status.color }}
                                    >
                                        {status.icon}
                                    </div>
                                )}
                            </div>

                            {task.description && (
                                <p className="task-description">{task.description}</p>
                            )}

                            {/* Desktop Actions - on expand */}
                            {isExpanded && !isMobile && (
                                <div className="task-actions">
                                    <button
                                        className="action-btn edit"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(task);
                                        }}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                        Edit
                                    </button>
                                    <button
                                        className="action-btn delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteTask(task);
                                        }}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                        </svg>
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Mobile Action Sheet */}
            {actionSheetTask && (
                <ActionSheet
                    task={actionSheetTask}
                    onEdit={onEdit}
                    onDelete={handleDeleteRequest}
                    onStatusChange={onStatusChange}
                    onClose={() => setActionSheetTask(null)}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteTask && (
                <DeleteConfirmModal
                    task={deleteTask}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTask(null)}
                />
            )}
        </div>
    );
}

export default TaskTimeline;
