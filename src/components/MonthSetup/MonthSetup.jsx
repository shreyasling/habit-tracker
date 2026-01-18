import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DaySelector from '../DaySelector/DaySelector';
import './MonthSetup.css';

function MonthSetup({
    isVisible,
    onClose,
    year,
    month,
    previousMonthTasks,
    previousMonthName,
    daysInMonth,
    onSetupComplete
}) {
    const [step, setStep] = useState('choose'); // 'choose', 'reuse', 'new', 'select-days'
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [newTaskName, setNewTaskName] = useState('');
    const [tasksToCreate, setTasksToCreate] = useState([]);
    const [currentEditingTask, setCurrentEditingTask] = useState(null);
    const [applyToAllDays, setApplyToAllDays] = useState(true);
    const [selectedDays, setSelectedDays] = useState([]);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthName = monthNames[month];

    // Reset state when modal opens
    useEffect(() => {
        if (isVisible) {
            setStep(previousMonthTasks && previousMonthTasks.length > 0 ? 'choose' : 'new');
            setSelectedTasks([]);
            setTasksToCreate([]);
            setNewTaskName('');
            setCurrentEditingTask(null);
            setApplyToAllDays(true);
            setSelectedDays([]);
        }
    }, [isVisible, previousMonthTasks]);

    // Initialize selected days when daysInMonth changes
    useEffect(() => {
        if (applyToAllDays) {
            setSelectedDays(Array.from({ length: daysInMonth }, (_, i) => i + 1));
        }
    }, [daysInMonth, applyToAllDays]);

    const handleToggleTaskSelection = (taskId) => {
        setSelectedTasks(prev =>
            prev.includes(taskId)
                ? prev.filter(id => id !== taskId)
                : [...prev, taskId]
        );
    };

    const handleSelectAllTasks = () => {
        if (selectedTasks.length === previousMonthTasks.length) {
            setSelectedTasks([]);
        } else {
            setSelectedTasks(previousMonthTasks.map(t => t.id));
        }
    };

    const handleReuseSelected = () => {
        if (selectedTasks.length === 0) return;

        const tasksToReuse = previousMonthTasks
            .filter(t => selectedTasks.includes(t.id))
            .map(t => {
                // Preserve original days, but filter out any days that exceed the new month's length
                const originalDays = t.days || [];
                const validDays = originalDays.filter(day => day <= daysInMonth);

                return {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: t.name,
                    // Use the original days if available, otherwise default to all days
                    days: validDays.length > 0 ? validDays : Array.from({ length: daysInMonth }, (_, i) => i + 1),
                    createdFromPreviousMonth: true
                };
            });

        setTasksToCreate(tasksToReuse);
        setStep('new'); // Go to new task step to allow modifications
    };

    const handleAddNewTask = () => {
        if (!newTaskName.trim()) return;

        const days = applyToAllDays
            ? Array.from({ length: daysInMonth }, (_, i) => i + 1)
            : selectedDays;

        const newTask = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: newTaskName.trim(),
            days: days,
            createdFromPreviousMonth: false
        };

        setTasksToCreate(prev => [...prev, newTask]);
        setNewTaskName('');
        setApplyToAllDays(true);
        setSelectedDays(Array.from({ length: daysInMonth }, (_, i) => i + 1));
    };

    const handleEditTaskDays = (task) => {
        setCurrentEditingTask(task);
        setSelectedDays(task.days);
        setStep('select-days');
    };

    const handleSaveDays = () => {
        if (!currentEditingTask) return;

        setTasksToCreate(prev =>
            prev.map(t =>
                t.id === currentEditingTask.id
                    ? { ...t, days: selectedDays }
                    : t
            )
        );
        setCurrentEditingTask(null);
        setStep('new');
    };

    const handleRemoveTask = (taskId) => {
        setTasksToCreate(prev => prev.filter(t => t.id !== taskId));
    };

    const handleToggleDay = (day) => {
        setSelectedDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day].sort((a, b) => a - b)
        );
    };

    const handleSelectAllDays = () => {
        if (selectedDays.length === daysInMonth) {
            setSelectedDays([]);
        } else {
            setSelectedDays(Array.from({ length: daysInMonth }, (_, i) => i + 1));
        }
    };

    const handleComplete = () => {
        onSetupComplete(tasksToCreate);
        onClose();
    };

    const handleSkip = () => {
        onSetupComplete([]);
        onClose();
    };

    if (!isVisible) return null;

    const modalContent = (
        <div className="month-setup-overlay" onClick={onClose}>
            <div className="month-setup-modal" onClick={(e) => e.stopPropagation()}>
                <div className="month-setup-header">
                    <div className="month-setup-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </div>
                    <div className="month-setup-title">
                        <h2>Setup {currentMonthName} {year}</h2>
                        <p>Configure your tasks for this month</p>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="month-setup-content">
                    {step === 'choose' && (
                        <div className="setup-step choose-step">
                            <div className="step-info">
                                <div className="info-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="16" x2="12" y2="12" />
                                        <line x1="12" y1="8" x2="12.01" y2="8" />
                                    </svg>
                                </div>
                                <p>You had <strong>{previousMonthTasks.length} task{previousMonthTasks.length !== 1 ? 's' : ''}</strong> in {previousMonthName}. Would you like to reuse them?</p>
                            </div>

                            <div className="choice-buttons">
                                <button
                                    className="choice-btn reuse"
                                    onClick={() => setStep('reuse')}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="17 1 21 5 17 9" />
                                        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                                        <polyline points="7 23 3 19 7 15" />
                                        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                                    </svg>
                                    Reuse Previous Tasks
                                </button>
                                <button
                                    className="choice-btn new"
                                    onClick={() => setStep('new')}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                    Start Fresh
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'reuse' && (
                        <div className="setup-step reuse-step">
                            <div className="step-header">
                                <button className="back-btn" onClick={() => setStep('choose')}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="15 18 9 12 15 6" />
                                    </svg>
                                    Back
                                </button>
                                <h3>Select Tasks to Reuse</h3>
                            </div>

                            <div className="tasks-list">
                                <label className="task-checkbox select-all">
                                    <input
                                        type="checkbox"
                                        checked={selectedTasks.length === previousMonthTasks.length}
                                        onChange={handleSelectAllTasks}
                                    />
                                    <span className="checkbox-custom"></span>
                                    <span className="task-name">Select All</span>
                                </label>
                                {previousMonthTasks.map(task => (
                                    <label key={task.id} className="task-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedTasks.includes(task.id)}
                                            onChange={() => handleToggleTaskSelection(task.id)}
                                        />
                                        <span className="checkbox-custom"></span>
                                        <span className="task-name">{task.name}</span>
                                    </label>
                                ))}
                            </div>

                            <button
                                className="continue-btn"
                                disabled={selectedTasks.length === 0}
                                onClick={handleReuseSelected}
                            >
                                Continue with {selectedTasks.length} Task{selectedTasks.length !== 1 ? 's' : ''}
                            </button>
                        </div>
                    )}

                    {step === 'new' && (
                        <div className="setup-step new-step">
                            {previousMonthTasks && previousMonthTasks.length > 0 && tasksToCreate.length === 0 && (
                                <div className="step-header">
                                    <button className="back-btn" onClick={() => setStep('choose')}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="15 18 9 12 15 6" />
                                        </svg>
                                        Back
                                    </button>
                                </div>
                            )}

                            {tasksToCreate.length > 0 && (
                                <div className="current-tasks">
                                    <h4>Tasks for {currentMonthName}</h4>
                                    <div className="tasks-list editable">
                                        {tasksToCreate.map(task => (
                                            <div key={task.id} className="task-item">
                                                <span className="task-name">{task.name}</span>
                                                <span className="task-days">
                                                    {task.days.length === daysInMonth
                                                        ? 'All days'
                                                        : `${task.days.length} day${task.days.length !== 1 ? 's' : ''}`}
                                                </span>
                                                <div className="task-item-actions">
                                                    <button
                                                        className="edit-days-btn"
                                                        onClick={() => handleEditTaskDays(task)}
                                                        title="Edit days"
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                            <line x1="16" y1="2" x2="16" y2="6" />
                                                            <line x1="8" y1="2" x2="8" y2="6" />
                                                            <line x1="3" y1="10" x2="21" y2="10" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        className="remove-btn"
                                                        onClick={() => handleRemoveTask(task.id)}
                                                        title="Remove"
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <line x1="18" y1="6" x2="6" y2="18" />
                                                            <line x1="6" y1="6" x2="18" y2="18" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="add-task-section">
                                <h4>Add New Task</h4>
                                <div className="add-task-form">
                                    <input
                                        type="text"
                                        value={newTaskName}
                                        onChange={(e) => setNewTaskName(e.target.value)}
                                        placeholder="Enter task name..."
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleAddNewTask();
                                        }}
                                    />
                                    <button
                                        className="add-btn"
                                        onClick={handleAddNewTask}
                                        disabled={!newTaskName.trim()}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="12" y1="5" x2="12" y2="19" />
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="days-option">
                                    <label className="days-toggle">
                                        <input
                                            type="checkbox"
                                            checked={applyToAllDays}
                                            onChange={(e) => {
                                                setApplyToAllDays(e.target.checked);
                                                if (e.target.checked) {
                                                    setSelectedDays(Array.from({ length: daysInMonth }, (_, i) => i + 1));
                                                } else {
                                                    setSelectedDays([]);
                                                }
                                            }}
                                        />
                                        <span className="toggle-slider"></span>
                                        Apply to all days
                                    </label>

                                    {!applyToAllDays && (
                                        <DaySelector
                                            year={year}
                                            month={month}
                                            daysInMonth={daysInMonth}
                                            selectedDays={selectedDays}
                                            onDaysChange={setSelectedDays}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="step-actions">
                                <button className="skip-btn" onClick={handleSkip}>
                                    Skip for now
                                </button>
                                <button
                                    className="complete-btn"
                                    onClick={handleComplete}
                                    disabled={tasksToCreate.length === 0}
                                >
                                    Save & Start Tracking
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'select-days' && currentEditingTask && (
                        <div className="setup-step select-days-step">
                            <div className="step-header">
                                <button className="back-btn" onClick={() => setStep('new')}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="15 18 9 12 15 6" />
                                    </svg>
                                    Back
                                </button>
                                <h3>Select Days for "{currentEditingTask.name}"</h3>
                            </div>

                            <div className="days-selection">
                                <DaySelector
                                    year={year}
                                    month={month}
                                    daysInMonth={daysInMonth}
                                    selectedDays={selectedDays}
                                    onDaysChange={setSelectedDays}
                                />
                            </div>

                            <button
                                className="save-days-btn"
                                onClick={handleSaveDays}
                                disabled={selectedDays.length === 0}
                            >
                                Save Days
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}

export default MonthSetup;
