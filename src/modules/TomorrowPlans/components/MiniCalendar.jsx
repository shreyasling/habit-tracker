import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getMonthPlans, formatDateKey } from '../services/planService';
import './MiniCalendar.css';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

function MiniCalendar({ selectedDate, onDateSelect, onClose, userId }) {
    const [viewDate, setViewDate] = useState(new Date(selectedDate));
    const [plansInMonth, setPlansInMonth] = useState({});
    const [loading, setLoading] = useState(true);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // Load plans for the month
    const loadMonthPlans = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const plans = await getMonthPlans(userId, year, month);
            setPlansInMonth(plans);
        } catch (error) {
            console.error('Failed to load month plans:', error);
        } finally {
            setLoading(false);
        }
    }, [userId, year, month]);

    useEffect(() => {
        loadMonthPlans();
    }, [loadMonthPlans]);

    // Get days in month
    const getDaysInMonth = () => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days = [];

        // Empty cells for days before the first
        for (let i = 0; i < startingDay; i++) {
            days.push(null);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = formatDateKey(date);
            const hasPlan = plansInMonth[dateKey]?.tasks?.length > 0;

            days.push({
                day,
                date,
                dateKey,
                hasPlan,
                isToday: formatDateKey(new Date()) === dateKey,
                isSelected: formatDateKey(selectedDate) === dateKey
            });
        }

        return days;
    };

    const goToPrevMonth = () => {
        setViewDate(new Date(year, month - 1, 1));
    };

    const goToNextMonth = () => {
        setViewDate(new Date(year, month + 1, 1));
    };

    const handleDateClick = (dayInfo) => {
        if (dayInfo) {
            onDateSelect(dayInfo.date);
        }
    };

    const days = getDaysInMonth();

    return createPortal(
        <div className="calendar-overlay" onClick={onClose}>
            <div className="calendar-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="calendar-header">
                    <button className="cal-nav-btn" onClick={goToPrevMonth}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    <div className="calendar-title">
                        <span className="month-name">{MONTHS[month]}</span>
                        <span className="year">{year}</span>
                    </div>
                    <button className="cal-nav-btn" onClick={goToNextMonth}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                </div>

                {/* Days header */}
                <div className="calendar-weekdays">
                    {DAYS.map(day => (
                        <div key={day} className="weekday">{day}</div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="calendar-grid">
                    {loading ? (
                        <div className="calendar-loading">
                            <div className="spinner" />
                        </div>
                    ) : (
                        days.map((dayInfo, index) => (
                            <button
                                key={index}
                                className={`calendar-day ${!dayInfo ? 'empty' : ''} 
                                    ${dayInfo?.isToday ? 'today' : ''} 
                                    ${dayInfo?.isSelected ? 'selected' : ''}
                                    ${dayInfo?.hasPlan ? 'has-plan' : ''}`}
                                onClick={() => handleDateClick(dayInfo)}
                                disabled={!dayInfo}
                            >
                                {dayInfo && (
                                    <>
                                        <span className="day-number">{dayInfo.day}</span>
                                        {dayInfo.hasPlan && <span className="plan-dot" />}
                                    </>
                                )}
                            </button>
                        ))
                    )}
                </div>

                {/* Legend */}
                <div className="calendar-legend">
                    <div className="legend-item">
                        <span className="legend-dot today" />
                        <span>Today</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-dot has-plan" />
                        <span>Has plan</span>
                    </div>
                </div>

                {/* Quick actions */}
                <div className="calendar-actions">
                    <button
                        className="quick-action"
                        onClick={() => {
                            const yesterday = new Date();
                            yesterday.setDate(yesterday.getDate() - 1);
                            onDateSelect(yesterday);
                        }}
                    >
                        Yesterday
                    </button>
                    <button
                        className="quick-action today-action"
                        onClick={() => onDateSelect(new Date())}
                    >
                        Today
                    </button>
                    <button
                        className="quick-action"
                        onClick={() => {
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            onDateSelect(tomorrow);
                        }}
                    >
                        Tomorrow
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default MiniCalendar;
