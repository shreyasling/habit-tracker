import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';

function CalendarView({ onClose }) {
    const { state } = useFinance();
    const symbol = state.settings.currencySymbol || '$';
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    // Combine all categories for lookup
    const allCategories = [
        ...state.expenseCategories,
        ...state.incomeCategories,
        ...(state.customCategories || [])
    ];

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        return { daysInMonth, startingDay, year, month };
    };

    const getTransactionsForDate = (date) => {
        const dateStr = date.toDateString();
        return state.transactions.filter(tx =>
            new Date(tx.date).toDateString() === dateStr
        );
    };

    const getSpendForDate = (date) => {
        return getTransactionsForDate(date)
            .filter(tx => tx.type === 'expense')
            .reduce((sum, tx) => sum + tx.amount, 0);
    };

    const getIncomeForDate = (date) => {
        return getTransactionsForDate(date)
            .filter(tx => tx.type === 'income')
            .reduce((sum, tx) => sum + tx.amount, 0);
    };

    const navigateMonth = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setCurrentDate(newDate);
    };

    const { daysInMonth, startingDay, year, month } = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();

    // Calculate average daily spend for high-spend detection
    const averageDailySpend = state.transactions
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0) / 30;

    const selectedTransactions = selectedDate ? getTransactionsForDate(selectedDate) : [];
    const selectedDaySpend = selectedDate ? getSpendForDate(selectedDate) : 0;
    const selectedDayIncome = selectedDate ? getIncomeForDate(selectedDate) : 0;
    const selectedDayNet = selectedDayIncome - selectedDaySpend;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal calendar-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Transaction Calendar</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="modal-body">
                    <div className="calendar-header">
                        <h3 className="calendar-month">{monthName}</h3>
                        <div className="calendar-nav">
                            <button className="calendar-nav-btn" onClick={() => navigateMonth(-1)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                    <path d="M15 18l-6-6 6-6" />
                                </svg>
                            </button>
                            <button className="calendar-nav-btn" onClick={() => navigateMonth(1)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                    <path d="M9 18l6-6-6-6" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="calendar-grid">
                        {weekdays.map(day => (
                            <div key={day} className="calendar-weekday">{day}</div>
                        ))}

                        {/* Empty cells for days before month starts */}
                        {Array.from({ length: startingDay }, (_, i) => (
                            <div key={`empty-${i}`} className="calendar-day other-month"></div>
                        ))}

                        {/* Days of the month */}
                        {Array.from({ length: daysInMonth }, (_, i) => {
                            const day = i + 1;
                            const date = new Date(year, month, day);
                            const isToday = date.toDateString() === today.toDateString();
                            const isSelected = selectedDate?.toDateString() === date.toDateString();
                            const dayTransactions = getTransactionsForDate(date);
                            const daySpend = getSpendForDate(date);
                            const isHighSpend = daySpend > averageDailySpend * 1.5;

                            return (
                                <div
                                    key={day}
                                    className={`calendar-day 
                                        ${isToday ? 'today' : ''} 
                                        ${isSelected ? 'selected' : ''}
                                        ${dayTransactions.length > 0 ? 'has-transactions' : ''}
                                        ${isHighSpend ? 'high-spend' : ''}
                                    `}
                                    onClick={() => setSelectedDate(date)}
                                    style={{ position: 'relative', minHeight: '48px' }}
                                >
                                    <span className="calendar-day-number">{day}</span>
                                    {daySpend > 0 && (
                                        <span style={{
                                            position: 'absolute',
                                            bottom: '4px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            fontSize: '9px',
                                            fontWeight: 600,
                                            color: isHighSpend ? 'var(--fin-error)' : 'var(--fin-text-muted)',
                                            whiteSpace: 'nowrap',
                                            background: 'var(--fin-bg-primary)',
                                            padding: '1px 4px',
                                            borderRadius: '4px',
                                            zIndex: 1
                                        }}>
                                            {symbol}{daySpend >= 1000 ? `${(daySpend / 1000).toFixed(1)}K` : daySpend.toFixed(0)}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Selected Date Transactions */}
                    {selectedDate && (
                        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--fin-border-primary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>
                                    {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </h4>
                            </div>

                            {/* Daily Summary */}
                            {selectedTransactions.length > 0 && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: '8px',
                                    marginBottom: '16px',
                                    padding: '12px',
                                    background: 'var(--fin-bg-elevated)',
                                    borderRadius: 'var(--fin-radius-md)'
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '11px', color: 'var(--fin-text-muted)', marginBottom: '4px' }}>Spent</div>
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--fin-error)' }}>
                                            {symbol}{selectedDaySpend.toLocaleString()}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center', borderLeft: '1px solid var(--fin-border-primary)', borderRight: '1px solid var(--fin-border-primary)' }}>
                                        <div style={{ fontSize: '11px', color: 'var(--fin-text-muted)', marginBottom: '4px' }}>Received</div>
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--fin-success)' }}>
                                            {symbol}{selectedDayIncome.toLocaleString()}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '11px', color: 'var(--fin-text-muted)', marginBottom: '4px' }}>Net</div>
                                        <div style={{
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            color: selectedDayNet >= 0 ? 'var(--fin-success)' : 'var(--fin-error)'
                                        }}>
                                            {selectedDayNet >= 0 ? '+' : ''}{symbol}{selectedDayNet.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedTransactions.length === 0 ? (
                                <p style={{ color: 'var(--fin-text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                                    📪 No transactions on this date
                                </p>
                            ) : (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    maxHeight: '250px',
                                    overflowY: 'auto'
                                }}>
                                    <div style={{ fontSize: '12px', color: 'var(--fin-text-secondary)', marginBottom: '4px' }}>
                                        {selectedTransactions.length} transaction{selectedTransactions.length > 1 ? 's' : ''}
                                    </div>
                                    {selectedTransactions.map(tx => {
                                        const category = allCategories.find(c => c.id === tx.categoryId);
                                        return (
                                            <div
                                                key={tx.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '12px',
                                                    background: 'var(--fin-bg-elevated)',
                                                    borderRadius: 'var(--fin-radius-sm)',
                                                    borderLeft: `3px solid ${category?.color || 'var(--fin-border-primary)'}`
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ fontSize: '20px' }}>{category?.icon || '📦'}</span>
                                                    <div>
                                                        <div style={{ fontWeight: 500, fontSize: '14px' }}>
                                                            {tx.note || category?.name || 'Transaction'}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: 'var(--fin-text-muted)' }}>
                                                            {category?.name} • {new Date(tx.date).toLocaleTimeString('default', { hour: 'numeric', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span style={{
                                                    fontWeight: 600,
                                                    color: tx.type === 'expense' ? 'var(--fin-error)' : 'var(--fin-success)'
                                                }}>
                                                    {tx.type === 'expense' ? '-' : '+'}{symbol}{tx.amount.toLocaleString()}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CalendarView;
