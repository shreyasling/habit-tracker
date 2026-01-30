function LatestTransactions({ transactions, categories, symbol, onViewAll }) {

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'short' });
        const time = date.toLocaleString('default', { hour: 'numeric', minute: '2-digit', hour12: true });
        return `${day} ${month} - ${time}`;
    };

    const getCategoryInfo = (categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        return category || { name: 'Other', icon: '📦', color: '#6b7280' };
    };

    if (transactions.length === 0) {
        return (
            <div className="transactions-card">
                <div className="transactions-header">
                    <h3 className="transactions-title">Latest Transactions</h3>
                </div>
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 3L21 7L17 11" />
                            <path d="M21 7H9" />
                            <path d="M7 13L3 17L7 21" />
                            <path d="M3 17H15" />
                        </svg>
                    </div>
                    <h4 className="empty-state-title">No transactions yet</h4>
                    <p className="empty-state-text">Your transactions will appear here once you start tracking</p>
                </div>
            </div>
        );
    }

    return (
        <div className="transactions-card">
            <div className="transactions-header">
                <h3 className="transactions-title">Latest Transactions</h3>
                <span
                    className="see-all-btn"
                    onClick={onViewAll}
                    style={{ cursor: 'pointer' }}
                >
                    See All
                </span>
            </div>

            {/* Table view for Desktop */}
            <div className="desktop-only">
                <table className="transactions-table">
                    <thead>
                        <tr>
                            <th className="sortable">Title ↓</th>
                            <th className="sortable">Date ↓</th>
                            <th>Category</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.slice(0, 5).map((tx) => {
                            const category = getCategoryInfo(tx.categoryId);
                            return (
                                <tr key={tx.id}>
                                    <td>
                                        <div className="transaction-row">
                                            <div
                                                className="transaction-icon"
                                                style={{ background: tx.type === 'transfer' ? 'var(--fin-info-muted)' : (category.color + '20') }}
                                            >
                                                {tx.type === 'transfer' ? '↔️' : category.icon}
                                            </div>
                                            <div className="transaction-info">
                                                <span className="transaction-title">{tx.note || (tx.type === 'transfer' ? 'Transfer' : category.name)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="transaction-date">{formatDate(tx.date)}</span>
                                    </td>
                                    <td>
                                        <span
                                            className="transaction-category"
                                            style={{
                                                background: tx.type === 'transfer' ? 'var(--fin-info-muted)' : (category.color + '20'),
                                                color: tx.type === 'transfer' ? 'var(--fin-info)' : category.color
                                            }}
                                        >
                                            {tx.type === 'transfer' ? 'Transfer' : category.name}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`transaction-amount ${tx.type}`} style={{ color: tx.type === 'transfer' ? 'var(--fin-text-primary)' : undefined }}>
                                            {tx.type === 'expense' ? '-' : (tx.type === 'income' ? '+' : '')}{symbol}{tx.amount.toLocaleString()}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* List view for Mobile */}
            <div className="mobile-only">
                <div className="mobile-transaction-list">
                    {transactions.slice(0, 5).map((tx) => {
                        const category = getCategoryInfo(tx.categoryId);
                        return (
                            <div key={tx.id} className="mobile-transaction-item">
                                <div className="transaction-row" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div
                                        className="transaction-icon"
                                        style={{
                                            background: tx.type === 'transfer' ? 'var(--fin-info-muted)' : (category.color + '20'),
                                            flexShrink: 0
                                        }}
                                    >
                                        {tx.type === 'transfer' ? '↔️' : category.icon}
                                    </div>
                                    <div className="transaction-info" style={{ flex: 1, minWidth: 0 }}>
                                        <div className="transaction-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                            <span className="transaction-title" style={{ fontWeight: 600, fontSize: '15px', color: 'var(--fin-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '8px' }}>
                                                {tx.note || (tx.type === 'transfer' ? 'Transfer' : category.name)}
                                            </span>
                                            <span className={`transaction-amount ${tx.type}`} style={{
                                                fontWeight: 600,
                                                fontSize: '15px',
                                                whiteSpace: 'nowrap',
                                                marginLeft: 'auto',
                                                color: tx.type === 'transfer' ? 'var(--fin-text-primary)' : (tx.type === 'expense' ? 'var(--fin-error)' : 'var(--fin-success)')
                                            }}>
                                                {tx.type === 'expense' ? '-' : (tx.type === 'income' ? '+' : '')}{symbol}{tx.amount.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="transaction-subtitle-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="transaction-date" style={{ fontSize: '12px', color: 'var(--fin-text-muted)' }}>{formatDate(tx.date)}</span>
                                            <span
                                                className="transaction-category-tag"
                                                style={{
                                                    fontSize: '10px',
                                                    fontWeight: 600,
                                                    textTransform: 'uppercase',
                                                    color: category.color,
                                                    background: category.color + '15',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    marginLeft: '8px'
                                                }}
                                            >
                                                {category.name}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default LatestTransactions;
