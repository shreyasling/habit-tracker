import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function AssetsChart({ transactions, symbol }) {
    const [period, setPeriod] = useState('monthly');

    // Generate chart data based on period
    const chartData = useMemo(() => {
        const now = new Date();
        let data = [];

        if (period === 'weekly') {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dayName = i === 0 ? 'Today' : days[date.getDay()];

                const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const dayEnd = new Date(dayStart);
                dayEnd.setDate(dayEnd.getDate() + 1);

                let income = 0;
                let expense = 0;

                transactions.forEach(tx => {
                    if (tx.type === 'transfer') return; // Exclude transfers
                    const txDate = new Date(tx.date);
                    if (txDate >= dayStart && txDate < dayEnd) {
                        if (tx.type === 'income') income += tx.amount;
                        else if (tx.type === 'expense') expense += tx.amount;
                    }
                });

                data.push({ name: dayName, income, expense });
            }
        } else if (period === 'monthly') {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const currentYear = now.getFullYear();

            data = months.map((month, index) => {
                let income = 0;
                let expense = 0;

                transactions.forEach(tx => {
                    if (tx.type === 'transfer') return; // Exclude transfers
                    const date = new Date(tx.date);
                    if (date.getFullYear() === currentYear && date.getMonth() === index) {
                        if (tx.type === 'income') income += tx.amount;
                        else if (tx.type === 'expense') expense += tx.amount;
                    }
                });
                return { name: month, income, expense };
            });
        } else {
            const currentYear = now.getFullYear();
            for (let i = 4; i >= 0; i--) {
                const year = currentYear - i;
                let income = 0;
                let expense = 0;

                transactions.forEach(tx => {
                    if (tx.type === 'transfer') return; // Exclude transfers
                    const txDate = new Date(tx.date);
                    if (txDate.getFullYear() === year) {
                        if (tx.type === 'income') income += tx.amount;
                        else if (tx.type === 'expense') expense += tx.amount;
                    }
                });
                data.push({ name: year.toString(), income, expense });
            }
        }
        return data;

    }, [transactions, period]);

    const totals = useMemo(() => {
        // Calculate totals from Filtered Chart Data to match the view
        const income = chartData.reduce((sum, item) => sum + item.income, 0);
        const expense = chartData.reduce((sum, item) => sum + item.expense, 0);
        return { income, expense };
    }, [chartData]);

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
                    <p style={{ color: 'var(--fin-text-primary)', marginBottom: '4px', fontSize: '12px' }}>{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color, fontSize: '12px', margin: '2px 0' }}>
                            {entry.name === 'income' ? 'Income' : 'Expense'}: {symbol}{entry.value.toLocaleString()}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-card">
            <div className="chart-header">
                <div>
                    <h3 className="chart-title">Cash Flow</h3>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--fin-success)' }}>
                            ↑ +{symbol}{totals.income.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '13px', color: '#f59e0b' }}>
                            ↓ -{symbol}{totals.expense.toLocaleString()}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="chart-legend">
                        <div className="legend-item">
                            <span className="legend-dot income"></span>
                            Income
                        </div>
                        <div className="legend-item">
                            <span className="legend-dot expense"></span>
                            Expense
                        </div>
                    </div>
                    <div className="chart-filter">
                        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>
                </div>
            </div>
            <div className="chart-container" style={{ height: 280, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--fin-border-primary)" opacity={0.5} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--fin-text-secondary)', fontSize: 11 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--fin-text-secondary)', fontSize: 11 }}
                            tickFormatter={(value) => `${symbol}${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <Area
                            type="monotone"
                            dataKey="income"
                            stroke="#22c55e"
                            fillOpacity={1}
                            fill="url(#colorIncome)"
                            strokeWidth={2}
                        />
                        <Area
                            type="monotone"
                            dataKey="expense"
                            stroke="#f59e0b"
                            fillOpacity={1}
                            fill="url(#colorExpense)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default AssetsChart;
