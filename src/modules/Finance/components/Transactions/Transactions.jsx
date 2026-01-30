import { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import AddExpense from '../AddExpense/AddExpense';

function Transactions() {
    const { state, actions } = useFinance();
    const { transactions, expenseCategories, incomeCategories } = state;
    const symbol = state.settings.currencySymbol || '$';
    const allCategories = [...expenseCategories, ...incomeCategories];

    // Modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingTransactionId, setDeletingTransactionId] = useState(null);

    const handleEdit = (transaction) => {
        setEditingTransaction(transaction);
        setShowEditModal(true);
    };

    const handleDelete = (transactionId) => {
        setDeletingTransactionId(transactionId);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (deletingTransactionId) {
            try {
                await actions.deleteTransaction(deletingTransactionId);
                setShowDeleteModal(false);
                setDeletingTransactionId(null);
            } catch (error) {
                console.error("Failed to delete transaction", error);
            }
        }
    };

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all'); // all, income, expense
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [dateRange, setDateRange] = useState('all'); // all, today, week, month, custom
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [amountFilter, setAmountFilter] = useState('all'); // all, under100, 100to500, 500to1000, above1000, custom
    const [customMinAmount, setCustomMinAmount] = useState('');
    const [customMaxAmount, setCustomMaxAmount] = useState('');
    const [sortBy, setSortBy] = useState('date'); // date, amount
    const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
    const [showFilters, setShowFilters] = useState(false);

    const getCategoryInfo = (categoryId) => {
        return allCategories.find(c => c.id === categoryId) || { name: 'Other', icon: '📦', color: '#6b7280' };
    };

    // Apply filters
    const filteredTransactions = useMemo(() => {
        let result = [...transactions];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(tx => {
                const category = getCategoryInfo(tx.categoryId);
                return (
                    tx.note?.toLowerCase().includes(query) ||
                    category.name.toLowerCase().includes(query) ||
                    tx.amount.toString().includes(query)
                );
            });
        }

        // Type filter
        if (typeFilter !== 'all') {
            result = result.filter(tx => tx.type === typeFilter);
        }

        // Category filter
        if (categoryFilter !== 'all') {
            result = result.filter(tx => tx.categoryId === categoryFilter);
        }

        // Date range filter
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (dateRange === 'today') {
            result = result.filter(tx => {
                const txDate = new Date(tx.date);
                return txDate >= today;
            });
        } else if (dateRange === 'week') {
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            result = result.filter(tx => {
                const txDate = new Date(tx.date);
                return txDate >= weekAgo;
            });
        } else if (dateRange === 'month') {
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            result = result.filter(tx => {
                const txDate = new Date(tx.date);
                return txDate >= monthAgo;
            });
        } else if (dateRange === 'custom' && customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59);
            result = result.filter(tx => {
                const txDate = new Date(tx.date);
                return txDate >= start && txDate <= end;
            });
        }

        // Amount filter
        if (amountFilter === 'under100') {
            result = result.filter(tx => tx.amount < 100);
        } else if (amountFilter === '100to500') {
            result = result.filter(tx => tx.amount >= 100 && tx.amount <= 500);
        } else if (amountFilter === '500to1000') {
            result = result.filter(tx => tx.amount >= 500 && tx.amount <= 1000);
        } else if (amountFilter === 'above1000') {
            result = result.filter(tx => tx.amount > 1000);
        } else if (amountFilter === 'custom') {
            const min = parseFloat(customMinAmount) || 0;
            const max = parseFloat(customMaxAmount) || Infinity;
            result = result.filter(tx => tx.amount >= min && tx.amount <= max);
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'date') {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            } else if (sortBy === 'amount') {
                return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
            }
            return 0;
        });

        return result;
    }, [transactions, searchQuery, typeFilter, categoryFilter, dateRange, customStartDate, customEndDate, amountFilter, customMinAmount, customMaxAmount, sortBy, sortOrder]);

    // Calculate summary stats
    const stats = useMemo(() => {
        const totalIncome = filteredTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
        const totalExpense = filteredTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
        return { totalIncome, totalExpense, count: filteredTransactions.length };
    }, [filteredTransactions]);

    const clearFilters = () => {
        setSearchQuery('');
        setTypeFilter('all');
        setCategoryFilter('all');
        setDateRange('all');
        setAmountFilter('all');
        setCustomStartDate('');
        setCustomEndDate('');
        setCustomMinAmount('');
        setCustomMaxAmount('');
    };

    const hasActiveFilters = typeFilter !== 'all' || categoryFilter !== 'all' || dateRange !== 'all' || amountFilter !== 'all' || searchQuery;

    return (
        <div className="transactions-page">
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Transactions</h1>
                    <p style={{ color: 'var(--fin-text-tertiary)', marginTop: '4px' }}>
                        {stats.count} transactions found
                    </p>
                </div>
            </div>

            {/* Search and Quick Filters Row */}
            <div className="filters-bar" style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div className="search-bar" style={{ flex: 1, minWidth: '200px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ color: 'var(--fin-text-muted)' }}>
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by name, category, or amount..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ background: 'none', border: 'none', flex: 1, color: 'var(--fin-text-primary)', outline: 'none' }}
                    />
                </div>

                {/* Type Filter Tabs */}
                <div className="filter-tabs" style={{ display: 'flex', gap: '4px', background: 'var(--fin-bg-tertiary)', borderRadius: '8px', padding: '4px' }}>
                    {['all', 'income', 'expense', 'transfer'].map(type => (
                        <button
                            key={type}
                            className={`filter-tab ${typeFilter === type ? 'active' : ''}`}
                            onClick={() => setTypeFilter(type)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '6px',
                                border: 'none',
                                background: typeFilter === type ? 'var(--fin-accent-primary)' : 'transparent',
                                color: typeFilter === type ? 'white' : 'var(--fin-text-secondary)',
                                cursor: 'pointer',
                                fontWeight: 500,
                                fontSize: '13px',
                                textTransform: 'capitalize'
                            }}
                        >
                            {type === 'all' ? 'All' : type}
                        </button>
                    ))}
                </div>

                <button
                    className="btn btn-secondary"
                    onClick={() => setShowFilters(!showFilters)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
                    </svg>
                    Filters
                    {hasActiveFilters && <span style={{ background: 'var(--fin-accent-primary)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>!</span>}
                </button>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                        {/* Date Range */}
                        <div className="form-group">
                            <label className="form-label">Date Range</label>
                            <select className="form-select" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">Last 7 Days</option>
                                <option value="month">Last 30 Days</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>

                        {dateRange === 'custom' && (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Start Date</label>
                                    <input type="date" className="form-input" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">End Date</label>
                                    <input type="date" className="form-input" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} />
                                </div>
                            </>
                        )}

                        {/* Category */}
                        <div className="form-group">
                            <label className="form-label">Category</label>
                            <select className="form-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                                <option value="all">All Categories</option>
                                <optgroup label="Expense Categories">
                                    {expenseCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Income Categories">
                                    {incomeCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        {/* Amount Range */}
                        <div className="form-group">
                            <label className="form-label">Amount Range</label>
                            <select className="form-select" value={amountFilter} onChange={(e) => setAmountFilter(e.target.value)}>
                                <option value="all">Any Amount</option>
                                <option value="under100">Under {symbol}100</option>
                                <option value="100to500">{symbol}100 - {symbol}500</option>
                                <option value="500to1000">{symbol}500 - {symbol}1,000</option>
                                <option value="above1000">Above {symbol}1,000</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>

                        {amountFilter === 'custom' && (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Min Amount</label>
                                    <input type="number" className="form-input" placeholder="0" value={customMinAmount} onChange={(e) => setCustomMinAmount(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Max Amount</label>
                                    <input type="number" className="form-input" placeholder="∞" value={customMaxAmount} onChange={(e) => setCustomMaxAmount(e.target.value)} />
                                </div>
                            </>
                        )}

                        {/* Sort */}
                        <div className="form-group">
                            <label className="form-label">Sort By</label>
                            <select className="form-select" value={`${sortBy}-${sortOrder}`} onChange={(e) => {
                                const [by, order] = e.target.value.split('-');
                                setSortBy(by);
                                setSortOrder(order);
                            }}>
                                <option value="date-desc">Date (Newest First)</option>
                                <option value="date-asc">Date (Oldest First)</option>
                                <option value="amount-desc">Amount (High to Low)</option>
                                <option value="amount-asc">Amount (Low to High)</option>
                            </select>
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <button className="btn btn-secondary" onClick={clearFilters} style={{ marginTop: '16px' }}>
                            Clear All Filters
                        </button>
                    )}
                </div>
            )}

            {/* Summary Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div className="metric-card" style={{ padding: '16px' }}>
                    <span className="metric-title">Total Income</span>
                    <div className="metric-value" style={{ fontSize: '20px', color: 'var(--fin-success)' }}>
                        +{symbol}{stats.totalIncome.toLocaleString()}
                    </div>
                </div>
                <div className="metric-card" style={{ padding: '16px' }}>
                    <span className="metric-title">Total Expense</span>
                    <div className="metric-value" style={{ fontSize: '20px', color: 'var(--fin-error)' }}>
                        -{symbol}{stats.totalExpense.toLocaleString()}
                    </div>
                </div>
                <div className="metric-card" style={{ padding: '16px' }}>
                    <span className="metric-title">Net</span>
                    <div className="metric-value" style={{ fontSize: '20px', color: stats.totalIncome - stats.totalExpense >= 0 ? 'var(--fin-success)' : 'var(--fin-error)' }}>
                        {stats.totalIncome - stats.totalExpense >= 0 ? '+' : ''}{symbol}{(stats.totalIncome - stats.totalExpense).toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Transactions List */}
            <div className="card">
                {filteredTransactions.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                        </div>
                        <h4 className="empty-state-title">No transactions found</h4>
                        <p className="empty-state-text">
                            {hasActiveFilters ? 'Try adjusting your filters' : 'Start adding transactions to see them here'}
                        </p>
                    </div>
                ) : (
                    filteredTransactions.map(tx => {
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
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '12px',
                                            background: tx.type === 'transfer' ? 'var(--fin-info-muted)' : (category.color + '20'),
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '20px'
                                        }}
                                    >
                                        {tx.type === 'transfer' ? '↔️' : category.icon}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 500, marginBottom: '2px' }}>
                                            {tx.note || (tx.type === 'transfer' ? 'Transfer' : category.name)}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--fin-text-muted)' }}>
                                            {new Date(tx.date).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            {' • '}
                                            <span style={{ color: tx.type === 'transfer' ? 'var(--fin-info)' : category.color }}>
                                                {tx.type === 'transfer' ? 'Transfer' : category.name}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <span style={{
                                        fontWeight: 600,
                                        fontSize: '15px',
                                        color: tx.type === 'expense' ? 'var(--fin-error)' : (tx.type === 'income' ? 'var(--fin-success)' : 'var(--fin-text-primary)')
                                    }}>
                                        {tx.type === 'expense' ? '-' : (tx.type === 'income' ? '+' : '')}{symbol}{tx.amount.toLocaleString()}
                                    </span>
                                    <div className="transaction-actions" style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleEdit(tx)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: 'var(--fin-text-tertiary)',
                                                padding: '4px',
                                                borderRadius: '4px'
                                            }}
                                            title="Edit"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(tx.id)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: 'var(--fin-text-tertiary)',
                                                padding: '4px',
                                                borderRadius: '4px'
                                            }}
                                            title="Delete"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {showEditModal && editingTransaction && (
                <AddExpense
                    transactionToEdit={editingTransaction}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingTransaction(null);
                    }}
                />
            )}

            {/* Custom Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Delete Transaction</h2>
                            <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body" style={{ textAlign: 'center', padding: '24px 0' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: 'var(--fin-error-light)',
                                color: 'var(--fin-error)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px'
                            }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                            </div>
                            <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--fin-text-primary)', marginBottom: '8px' }}>
                                Are you sure?
                            </p>
                            <p style={{ color: 'var(--fin-text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
                                This action cannot be undone. The transaction will be permanently removed.
                            </p>
                        </div>
                        <div className="modal-footer" style={{ gap: '12px' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowDeleteModal(false)}
                                style={{ flex: 1 }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={confirmDelete}
                                style={{ flex: 1, background: 'var(--fin-error)', borderColor: 'var(--fin-error)' }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Transactions;
