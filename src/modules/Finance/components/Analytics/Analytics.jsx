import { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

function Analytics() {
    const { state } = useFinance();
    const symbol = state.settings.currencySymbol || '$';
    const [dateRange, setDateRange] = useState('thisMonth');

    // Get filtered transactions based on date range
    const filteredTransactions = useMemo(() => {
        const now = new Date();
        let startDate;

        switch (dateRange) {
            case 'thisWeek':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
            case 'thisMonth':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'last3Months':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 3);
                break;
            case 'thisYear':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        return state.transactions.filter(tx => new Date(tx.date) >= startDate);
    }, [dateRange, state.transactions]);

    const totalExpense = filteredTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
    const totalIncome = filteredTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    const netFlow = totalIncome - totalExpense;

    // Calculate spending by category
    const categorySpending = useMemo(() => {
        return state.categories.map(cat => ({
            ...cat,
            value: filteredTransactions
                .filter(tx => tx.categoryId === cat.id && tx.type === 'expense')
                .reduce((sum, tx) => sum + tx.amount, 0)
        })).filter(c => c.value > 0).sort((a, b) => b.value - a.value);
    }, [state.categories, filteredTransactions]);

    // Prepare Bar Chart Data (Last 6 months)
    const barChartData = useMemo(() => {
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            months.push({
                name: d.toLocaleString('default', { month: 'short' }),
                month: d.getMonth(),
                year: d.getFullYear()
            });
        }

        return months.map(m => {
            const expense = state.transactions
                .filter(tx => {
                    const d = new Date(tx.date);
                    return d.getMonth() === m.month && d.getFullYear() === m.year && tx.type === 'expense';
                })
                .reduce((sum, tx) => sum + tx.amount, 0);
            const income = state.transactions
                .filter(tx => {
                    const d = new Date(tx.date);
                    return d.getMonth() === m.month && d.getFullYear() === m.year && tx.type === 'income';
                })
                .reduce((sum, tx) => sum + tx.amount, 0);
            return { name: m.name, income, expense };
        });
    }, [state.transactions]);

    const COLORS = categorySpending.map(c => c.color);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    backgroundColor: 'var(--fin-bg-card)',
                    border: '1px solid var(--fin-border-primary)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    boxShadow: 'var(--fin-shadow-md)'
                }}>
                    <p style={{ color: 'var(--fin-text-primary)' }}>{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color, fontSize: '12px', margin: '2px 0' }}>
                            {entry.name}: {symbol}{entry.value.toLocaleString()}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="analytics-page" style={{ paddingBottom: '80px' }}>
            <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Analytics</h1>
                    <p style={{ color: 'var(--fin-text-tertiary)', marginTop: '4px' }}>
                        Understand your spending patterns
                    </p>
                </div>
                <select
                    className="form-select"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    style={{ minWidth: '150px' }}
                >
                    <option value="thisWeek">This Week</option>
                    <option value="thisMonth">This Month</option>
                    <option value="last3Months">Last 3 Months</option>
                    <option value="thisYear">This Year</option>
                </select>
            </div>

            {/* Summary Cards */}
            <div className="goals-metrics-grid">
                <div className="metric-card">
                    <span className="metric-title">Total Income</span>
                    <div className="metric-value" style={{ color: 'var(--fin-success)' }}>
                        {symbol}{totalIncome.toLocaleString()}
                    </div>
                </div>
                <div className="metric-card">
                    <span className="metric-title">Total Expenses</span>
                    <div className="metric-value" style={{ color: 'var(--fin-error)' }}>
                        {symbol}{totalExpense.toLocaleString()}
                    </div>
                </div>
                <div className="metric-card full-width-mobile">
                    <span className="metric-title">Net Flow</span>
                    <div className="metric-value" style={{ color: netFlow >= 0 ? 'var(--fin-success)' : 'var(--fin-error)' }}>
                        {netFlow >= 0 ? '+' : ''}{symbol}{netFlow.toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                {/* Monthly Comparison Chart */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">Monthly Comparison</h3>
                    </div>
                    <div className="chart-container" style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barChartData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--fin-border-primary)" opacity={0.5} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--fin-text-secondary)', fontSize: 12 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--fin-text-secondary)', fontSize: 12 }}
                                    tickFormatter={(value) => `${symbol}${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--fin-bg-hover)' }} />
                                <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={30} />
                                <Bar dataKey="expense" name="Expense" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="card" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Category Breakdown</h3>
                    <div style={{ height: '240px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categorySpending}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categorySpending.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--fin-bg-card)" strokeWidth={2} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', maxHeight: '200px', overflowY: 'auto' }}>
                        {categorySpending.map(cat => (
                            <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '3px',
                                        background: cat.color
                                    }}></span>
                                    <span style={{ fontSize: '13px' }}>{cat.name}</span>
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                                    {symbol}{cat.value.toLocaleString()}
                                </span>
                            </div>
                        ))}
                        {categorySpending.length === 0 && (
                            <div style={{ textAlign: 'center', color: 'var(--fin-text-tertiary)', padding: '20px' }}>
                                No expenses in this period
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Analytics;
