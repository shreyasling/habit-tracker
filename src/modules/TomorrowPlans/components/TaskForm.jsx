import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import './TaskForm.css';

// Generate time options in 30-min intervals
const generateTimeOptions = () => {
    const options = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
            const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            const label = new Date(0, 0, 0, h, m).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            options.push({ value: time, label });
        }
    }
    return options;
};

const TIME_OPTIONS = generateTimeOptions();

// Convert time string to minutes for comparison
const timeToMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

// Check if two time ranges overlap
const doTimesOverlap = (start1, end1, start2, end2) => {
    const s1 = timeToMinutes(start1);
    const e1 = timeToMinutes(end1);
    const s2 = timeToMinutes(start2);
    const e2 = timeToMinutes(end2);
    return s1 < e2 && e1 > s2;
};

function TaskForm({ task, onSubmit, onClose, existingTasks, isEditing }) {
    const [title, setTitle] = useState(task?.title || '');
    const [description, setDescription] = useState(task?.description || '');
    const [startTime, setStartTime] = useState(task?.startTime || '09:00');
    const [endTime, setEndTime] = useState(task?.endTime || '10:00');
    const [priority, setPriority] = useState(task?.priority || 'medium');
    const [notificationEnabled, setNotificationEnabled] = useState(task?.notificationEnabled ?? true);

    // Calculate occupied and available slots
    const { occupiedSlots, availableSlots } = useMemo(() => {
        const occupied = [];
        const tasksToCheck = existingTasks.filter(t => !isEditing || t.id !== task?.id);

        tasksToCheck.forEach(t => {
            occupied.push({
                start: t.startTime,
                end: t.endTime,
                title: t.title
            });
        });

        // Sort occupied by start time
        occupied.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

        // Calculate available gaps
        const available = [];
        let lastEnd = '00:00';

        occupied.forEach(slot => {
            if (timeToMinutes(slot.start) > timeToMinutes(lastEnd)) {
                available.push({
                    start: lastEnd,
                    end: slot.start
                });
            }
            if (timeToMinutes(slot.end) > timeToMinutes(lastEnd)) {
                lastEnd = slot.end;
            }
        });

        // Add remaining time until end of day
        if (timeToMinutes(lastEnd) < timeToMinutes('23:59')) {
            available.push({
                start: lastEnd,
                end: '23:59'
            });
        }

        return { occupiedSlots: occupied, availableSlots: available };
    }, [existingTasks, isEditing, task?.id]);

    // Check if current selection overlaps
    const hasConflict = useMemo(() => {
        const tasksToCheck = existingTasks.filter(t => !isEditing || t.id !== task?.id);
        return tasksToCheck.some(t => doTimesOverlap(startTime, endTime, t.startTime, t.endTime));
    }, [startTime, endTime, existingTasks, isEditing, task?.id]);

    // Get conflicting task info
    const conflictingTask = useMemo(() => {
        const tasksToCheck = existingTasks.filter(t => !isEditing || t.id !== task?.id);
        return tasksToCheck.find(t => doTimesOverlap(startTime, endTime, t.startTime, t.endTime));
    }, [startTime, endTime, existingTasks, isEditing, task?.id]);

    // Auto-select first available slot for new tasks
    useEffect(() => {
        if (!isEditing && availableSlots.length > 0 && !task) {
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            // Find available slot after current time (or first available)
            let selectedSlot = availableSlots.find(
                slot => timeToMinutes(slot.start) >= currentMinutes
            ) || availableSlots[0];

            if (selectedSlot) {
                // Round to nearest 30 min
                const startMins = Math.ceil(Math.max(timeToMinutes(selectedSlot.start), currentMinutes) / 30) * 30;
                const duration = Math.min(60, timeToMinutes(selectedSlot.end) - startMins); // 1 hour or available

                if (duration >= 30) {
                    const startH = Math.floor(startMins / 60);
                    const startM = startMins % 60;
                    const endMins = startMins + duration;
                    const endH = Math.floor(endMins / 60);
                    const endM = endMins % 60;

                    setStartTime(`${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`);
                    setEndTime(`${String(Math.min(endH, 23)).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
                }
            }
        }
    }, [availableSlots, isEditing, task]);

    // Quick slot selection
    const selectSlot = (slot) => {
        setStartTime(slot.start);
        // Set end time to 1 hour after start or end of slot, whichever is earlier
        const startMins = timeToMinutes(slot.start);
        const endMins = Math.min(startMins + 60, timeToMinutes(slot.end));
        const endH = Math.floor(endMins / 60);
        const endM = endMins % 60;
        setEndTime(`${String(Math.min(endH, 23)).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim() || hasConflict) return;

        onSubmit({
            title: title.trim(),
            description: description.trim(),
            startTime,
            endTime,
            priority,
            notificationEnabled
        });
    };

    const formatDuration = (start, end) => {
        const mins = timeToMinutes(end) - timeToMinutes(start);
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        if (hours === 0) return `${minutes}m`;
        if (minutes === 0) return `${hours}h`;
        return `${hours}h ${minutes}m`;
    };

    const formatTimeLabel = (time) => {
        const [h, m] = time.split(':').map(Number);
        return new Date(0, 0, 0, h, m).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    return createPortal(
        <div className="task-form-overlay" onClick={onClose}>
            <div className="task-form-modal" onClick={e => e.stopPropagation()}>
                <div className="form-header">
                    <h2>{isEditing ? 'Edit Task' : 'Add New Task'}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Available Slots Display */}
                    {!isEditing && availableSlots.length > 0 && (
                        <div className="available-slots-section">
                            <span className="slots-label">Available slots:</span>
                            <div className="slots-list">
                                {availableSlots.slice(0, 5).map((slot, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        className={`slot-chip ${startTime >= slot.start && startTime < slot.end ? 'selected' : ''}`}
                                        onClick={() => selectSlot(slot)}
                                    >
                                        {formatTimeLabel(slot.start)} - {formatTimeLabel(slot.end)}
                                        <span className="slot-duration">({formatDuration(slot.start, slot.end)})</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Occupied Slots Warning */}
                    {occupiedSlots.length > 0 && (
                        <div className="occupied-info">
                            <span className="occupied-label">Busy times:</span>
                            <div className="occupied-list">
                                {occupiedSlots.slice(0, 4).map((slot, i) => (
                                    <span key={i} className="occupied-chip">
                                        {formatTimeLabel(slot.start)}-{formatTimeLabel(slot.end)}
                                    </span>
                                ))}
                                {occupiedSlots.length > 4 && (
                                    <span className="occupied-more">+{occupiedSlots.length - 4} more</span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Task Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What do you need to do?"
                            autoFocus
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Start Time</label>
                            <select
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className={hasConflict ? 'error' : ''}
                            >
                                {TIME_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>End Time</label>
                            <select
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className={hasConflict ? 'error' : ''}
                            >
                                {TIME_OPTIONS.filter(opt => timeToMinutes(opt.value) > timeToMinutes(startTime)).map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Conflict Warning */}
                    {hasConflict && conflictingTask && (
                        <div className="conflict-warning">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            <span>
                                Conflicts with "{conflictingTask.title}"
                                ({formatTimeLabel(conflictingTask.startTime)} - {formatTimeLabel(conflictingTask.endTime)})
                            </span>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Priority</label>
                        <div className="priority-options">
                            {['low', 'medium', 'high'].map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    className={`priority-btn ${p} ${priority === p ? 'active' : ''}`}
                                    onClick={() => setPriority(p)}
                                >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Description (optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add notes or details..."
                            rows={2}
                        />
                    </div>

                    <div className="form-toggle">
                        <label className="toggle-label">
                            <span>Notify 5 min before</span>
                            <button
                                type="button"
                                className={`toggle-switch ${notificationEnabled ? 'on' : ''}`}
                                onClick={() => setNotificationEnabled(!notificationEnabled)}
                            >
                                <div className="toggle-thumb" />
                            </button>
                        </label>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={!title.trim() || hasConflict}
                        >
                            {isEditing ? 'Save Changes' : 'Add Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

export default TaskForm;
