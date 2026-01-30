import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

function SpendingOverview({ spendingByCategory, totalSpend, symbol }) {
    // Calculate change percentage (mock data for now)
    const changePercent = 12;
    const isPositive = true;

    // Default data for empty state
    const displayData = spendingByCategory.length > 0
        ? spendingByCategory
        : [{ name: 'Empty', amount: 1, color: '#27272a' }];

    return (
        <div className="spending-overview">
            <div className="spending-header">
                <h3 className="spending-title">Spending Overview</h3>
                <span className="spending-value">{symbol}{totalSpend.toLocaleString()}</span>
            </div>

            <div className="donut-chart-container" style={{ width: '100%', height: 180, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: 160, height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={displayData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={76}
                                paddingAngle={spendingByCategory.length > 0 ? 5 : 0}
                                dataKey="amount"
                                stroke="none"
                            >
                                {displayData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={4} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value, name) => [
                                    spendingByCategory.length > 0 ? `${symbol}${value.toLocaleString()}` : '',
                                    name === 'Empty' ? '' : name
                                ]}
                                contentStyle={{
                                    backgroundColor: 'var(--fin-bg-card)',
                                    borderColor: 'var(--fin-border-primary)',
                                    borderRadius: '8px',
                                    color: 'var(--fin-text-primary)'
                                }}
                                itemStyle={{ color: 'var(--fin-text-primary)' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    <div
                        className="donut-center"
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                            pointerEvents: 'none'
                        }}
                    >
                        <div className={`donut-change ${isPositive ? 'positive' : 'negative'}`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                                <path d={isPositive ? "M7 17l5-5 5 5" : "M7 7l5 5 5-5"} />
                            </svg>
                            {changePercent}%
                        </div>
                        <div className="donut-label">vs last month</div>
                    </div>
                </div>
            </div>

            {spendingByCategory.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
                    {spendingByCategory.slice(0, 4).map((category) => (
                        <div
                            key={category.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '12px',
                                color: 'var(--fin-text-secondary)'
                            }}
                        >
                            <span
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: category.color
                                }}
                            ></span>
                            {category.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SpendingOverview;
