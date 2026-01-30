import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';

function History() {
    const { state } = useFinance();
    const { transactions, expenseCategories, incomeCategories } = state;
    const symbol = state.settings.currencySymbol || '$';
    const allCategories = [...expenseCategories, ...incomeCategories];

    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const getCategoryInfo = (categoryId) => {
        return allCategories.find(c => c.id === categoryId) || { name: 'Other', icon: '📦', color: '#6b7280' };
    };

    // Group transactions by date
    const groupedTransactions = transactions
        .filter(tx => {
            const txDate = new Date(tx.date);
            const [year, month] = selectedMonth.split('-');
            return txDate.getFullYear() === parseInt(year) && txDate.getMonth() + 1 === parseInt(month);
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .reduce((groups, tx) => {
            const date = new Date(tx.date).toDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(tx);
            return groups;
        }, {});

    // Generate month options
    const monthOptions = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthOptions.push({
            value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            label: d.toLocaleString('default', { month: 'long', year: 'numeric' })
        });
    }

    // Calculate monthly stats
    const monthlyTxs = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        const [year, month] = selectedMonth.split('-');
        return txDate.getFullYear() === parseInt(year) && txDate.getMonth() + 1 === parseInt(month);
    });

    const monthlyExpense = monthlyTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
    const monthlyIncome = monthlyTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);

    return (
        <div className="history-page">
            <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Transaction History</h1>
                    <p style={{ color: 'var(--fin-text-tertiary)', marginTop: '4px' }}>
                        Browse your past transactions by month
                    </p>
                </div>
                <select
                    className="form-select"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    style={{ minWidth: '180px' }}
                >
                    {monthOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {/* Monthly Summary */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <div className="metric-card">
                    <span className="metric-title">Total Transactions</span>
                    <div className="metric-value">{monthlyTxs.length}</div>
                </div>
                <div className="metric-card">
                    <span className="metric-title">Money In</span>
                    <div className="metric-value" style={{ color: 'var(--fin-success)' }}>
                        +{symbol}{monthlyIncome.toLocaleString()}
                    </div>
                </div>
                <div className="metric-card">
                    <span className="metric-title">Money Out</span>
                    <div className="metric-value" style={{ color: 'var(--fin-error)' }}>
                        -{symbol}{monthlyExpense.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Grouped Transactions */}
            <div className="card">
                {Object.keys(groupedTransactions).length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <h4 className="empty-state-title">No transactions this month</h4>
                        <p className="empty-state-text">
                            Start tracking to see your history here
                        </p>
                    </div>
                ) : (
                    Object.entries(groupedTransactions).map(([date, txs]) => (
                        <div key={date} style={{ borderBottom: '1px solid var(--fin-border-primary)' }}>
                            <div style={{
                                padding: '12px 20px',
                                background: 'var(--fin-bg-tertiary)',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: 'var(--fin-text-secondary)'
                            }}>
                                {new Date(date).toLocaleDateString('default', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </div>
                            {txs.map(tx => {
                                const category = getCategoryInfo(tx.categoryId);
                                return (
                                    <div
                                        key={tx.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '16px 20px',
                                            borderBottom: '1px solid var(--fin-border-primary)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '10px',
                                                    background: category.color + '20',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '18px'
                                                }}
                                            >
                                                {category.icon}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 500, marginBottom: '2px' }}>
                                                    {tx.note || category.name}
                                                </div>
                                                <div style={{ fontSize: '12px', color: 'var(--fin-text-muted)' }}>
                                                    {new Date(tx.date).toLocaleTimeString('default', {
                                                        hour: 'numeric',
                                                        minute: '2-digit'
                                                    })}
                                                    {' • '}
                                                    <span style={{ color: category.color }}>{category.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span style={{
                                            fontWeight: 600,
                                            fontSize: '15px',
                                            color: tx.type === 'expense' ? 'var(--fin-error)' : 'var(--fin-success)'
                                        }}>
                                            {tx.type === 'expense' ? '-' : '+'}{symbol}{tx.amount.toLocaleString()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default History;
