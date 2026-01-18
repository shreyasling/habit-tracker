import { useState, useMemo } from 'react';
import './DaySelector.css';

function DaySelector({ year, month, daysInMonth, selectedDays, onDaysChange }) {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekdaysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Calculate which days fall on which weekday
    const daysByWeekday = useMemo(() => {
        const result = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const weekday = date.getDay();
            result[weekday].push(day);
        }
        return result;
    }, [year, month, daysInMonth]);

    // Get weekday for a specific day
    const getWeekday = (day) => {
        const date = new Date(year, month, day);
        return weekdays[date.getDay()];
    };

    const handleToggleDay = (day) => {
        if (selectedDays.includes(day)) {
            onDaysChange(selectedDays.filter(d => d !== day));
        } else {
            onDaysChange([...selectedDays, day].sort((a, b) => a - b));
        }
    };

    const handleToggleWeekday = (weekdayIndex) => {
        const daysForWeekday = daysByWeekday[weekdayIndex];
        const allSelected = daysForWeekday.every(d => selectedDays.includes(d));

        if (allSelected) {
            // Deselect all days for this weekday
            onDaysChange(selectedDays.filter(d => !daysForWeekday.includes(d)));
        } else {
            // Select all days for this weekday
            const newDays = [...new Set([...selectedDays, ...daysForWeekday])].sort((a, b) => a - b);
            onDaysChange(newDays);
        }
    };

    const handleSelectAll = () => {
        if (selectedDays.length === daysInMonth) {
            onDaysChange([]);
        } else {
            onDaysChange(Array.from({ length: daysInMonth }, (_, i) => i + 1));
        }
    };

    const handleSelectWeekdays = () => {
        // Select Monday to Friday
        const weekdayDays = [1, 2, 3, 4, 5].flatMap(wd => daysByWeekday[wd]);
        const allSelected = weekdayDays.every(d => selectedDays.includes(d));

        if (allSelected) {
            onDaysChange(selectedDays.filter(d => !weekdayDays.includes(d)));
        } else {
            const newDays = [...new Set([...selectedDays, ...weekdayDays])].sort((a, b) => a - b);
            onDaysChange(newDays);
        }
    };

    const handleSelectWeekends = () => {
        // Select Saturday and Sunday
        const weekendDays = [0, 6].flatMap(wd => daysByWeekday[wd]);
        const allSelected = weekendDays.every(d => selectedDays.includes(d));

        if (allSelected) {
            onDaysChange(selectedDays.filter(d => !weekendDays.includes(d)));
        } else {
            const newDays = [...new Set([...selectedDays, ...weekendDays])].sort((a, b) => a - b);
            onDaysChange(newDays);
        }
    };

    // Check if all days of a weekday are selected
    const isWeekdayFullySelected = (weekdayIndex) => {
        return daysByWeekday[weekdayIndex].every(d => selectedDays.includes(d));
    };

    return (
        <div className="day-selector">
            {/* Quick Select Buttons */}
            <div className="quick-select">
                <button
                    type="button"
                    className={`quick-btn ${selectedDays.length === daysInMonth ? 'active' : ''}`}
                    onClick={handleSelectAll}
                >
                    All Days
                </button>
                <button
                    type="button"
                    className={`quick-btn ${[1, 2, 3, 4, 5].flatMap(wd => daysByWeekday[wd]).every(d => selectedDays.includes(d)) ? 'active' : ''}`}
                    onClick={handleSelectWeekdays}
                >
                    Weekdays
                </button>
                <button
                    type="button"
                    className={`quick-btn ${[0, 6].flatMap(wd => daysByWeekday[wd]).every(d => selectedDays.includes(d)) ? 'active' : ''}`}
                    onClick={handleSelectWeekends}
                >
                    Weekends
                </button>
            </div>

            {/* Weekday Select Buttons */}
            <div className="weekday-buttons">
                {weekdays.map((day, index) => (
                    <button
                        key={index}
                        type="button"
                        className={`weekday-btn ${isWeekdayFullySelected(index) ? 'selected' : ''}`}
                        onClick={() => handleToggleWeekday(index)}
                        title={`Select all ${weekdaysFull[index]}s`}
                    >
                        {day}
                    </button>
                ))}
            </div>

            {/* Days Grid */}
            <div className="days-grid">
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                    <button
                        key={day}
                        type="button"
                        className={`day-btn ${selectedDays.includes(day) ? 'selected' : ''}`}
                        onClick={() => handleToggleDay(day)}
                        title={`${getWeekday(day)} ${day}`}
                    >
                        <span className="day-number">{day}</span>
                        <span className="day-name">{getWeekday(day)}</span>
                    </button>
                ))}
            </div>

            {/* Selection Count */}
            <div className="selection-info">
                <span className="selection-count">
                    {selectedDays.length} of {daysInMonth} days selected
                </span>
            </div>
        </div>
    );
}

export default DaySelector;
