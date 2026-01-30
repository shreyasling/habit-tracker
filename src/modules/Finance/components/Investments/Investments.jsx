import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import InvestmentModal from '../../components/Dashboard/InvestmentsPanel'; // Reuse or refactor?
// Actually I'll create a local InvestmentModal or reuse if it was exported properly.
// Wait, I should probably refrain from importing from Dashboard/InvestmentsPanel if I'm moving it.
// I will create a full page implementation here.

function Investments() {
    const { state, actions } = useFinance();
    const { investments = [], bankAccounts = [] } = state;
    const symbol = state.settings.currencySymbol || '$';

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingInvestment, setEditingInvestment] = useState(null);

    const investmentTypes = [
        { id: 'stocks', name: 'Stocks', icon: '📈', color: '#8b5cf6' },
        { id: 'mutual_fund', name: 'Mutual Fund', icon: '📊', color: '#10b981' },
        { id: 'sip', name: 'SIP', icon: '🔄', color: '#3b82f6' },
        { id: 'crypto', name: 'Crypto', icon: '₿', color: '#f59e0b' },
        { id: 'gold', name: 'Gold', icon: '🥇', color: '#fbbf24' },
        { id: 'fd', name: 'Fixed Deposit', icon: '🏦', color: '#6366f1' },
        { id: 'real_estate', name: 'Real Estate', icon: '🏠', color: '#ef4444' },
        { id: 'other', name: 'Other', icon: '💎', color: '#6b7280' },
    ];

    const totalInvested = investments.reduce((sum, inv) => sum + (parseFloat(inv.investedAmount) || 0), 0);
    // const currentValue = investments.reduce((sum, inv) => sum + (parseFloat(inv.currentValue) || 0), 0);
    // const totalReturns = currentValue - totalInvested;
    // const returnsPercentage = totalInvested > 0 ? ((totalReturns / totalInvested) * 100).toFixed(1) : 0;

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Delete this investment record?')) {
            await actions.deleteInvestment(id);
        }
    };

    return (
        <div className="investments-page">
            <div className="finance-header" style={{ paddingLeft: 0, paddingRight: 0, marginBottom: '24px', background: 'transparent', border: 'none', height: 'auto' }}>
                <div className="header-greeting">
                    <h1 className="greeting-text">Investments</h1>
                    <p className="greeting-subtitle">Track your portfolio and investment history</p>
                </div>
                <button
                    className="quick-action-btn primary"
                    onClick={() => setShowAddModal(true)}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    New Investment
                </button>
            </div>

            {/* Portfolio Summary */}
            <div className="metrics-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '32px', maxWidth: '300px' }}>
                <div className="metric-card">
                    <div className="metric-header">
                        <span className="metric-title">Total Invested</span>
                    </div>
                    <div className="metric-value">{symbol}{totalInvested.toLocaleString()}</div>
                    <div className="metric-subtitle">Total Cost Basis</div>
                </div>
                {/* <div className="metric-card">
                    <div className="metric-header">
                        <span className="metric-title">Total Invested</span>
                    </div>
                    <div className="metric-value">{symbol}{totalInvested.toLocaleString()}</div>
                    <div className="metric-subtitle">Cost Basis</div>
                </div>
                <div className="metric-card">
                    <div className="metric-header">
                        <span className="metric-title">Total Returns</span>
                    </div>
                    <div className={`metric-value ${totalReturns >= 0 ? 'text-success' : 'text-danger'}`} style={{ color: totalReturns >= 0 ? 'var(--fin-success)' : 'var(--fin-error)' }}>
                        {totalReturns >= 0 ? '+' : ''}{symbol}{Math.abs(totalReturns).toLocaleString()}
                    </div>
                    <div className={`metric-change ${totalReturns >= 0 ? 'positive' : 'negative'}`} style={{ marginTop: '8px' }}>
                        {totalReturns >= 0 ? '↑' : '↓'} {returnsPercentage}%
                    </div>
                </div> */}
            </div>

            {/* Investments List */}
            <div className="transactions-card">
                <div className="transactions-header">
                    <h3 className="transactions-title">Your Portfolio</h3>
                </div>

                {investments.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--fin-text-tertiary)' }}>
                        <div style={{
                            width: '64px', height: '64px', margin: '0 auto 16px',
                            background: 'var(--fin-bg-tertiary)', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32" style={{ opacity: 0.5 }}>
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                <polyline points="17 6 23 6 23 12" />
                            </svg>
                        </div>
                        <h4 style={{ color: 'var(--fin-text-primary)', marginBottom: '8px' }}>No investments yet</h4>
                        <p style={{ fontSize: '14px', marginBottom: '24px' }}>Start building your portfolio by adding your first investment</p>
                        <button className="quick-action-btn primary" onClick={() => setShowAddModal(true)} style={{ margin: '0 auto' }}>
                            Add Investment
                        </button>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="transactions-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Invested Amount</th>
                                    {/* <th>Current Value</th>
                                    <th>Returns</th> */}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {investments.map(inv => {
                                    const type = investmentTypes.find(t => t.id === inv.type) || investmentTypes[7];
                                    // const returns = (parseFloat(inv.currentValue) || 0) - (parseFloat(inv.investedAmount) || 0);
                                    // const percent = inv.investedAmount > 0 ? ((returns / inv.investedAmount) * 100).toFixed(1) : 0;

                                    return (
                                        <tr key={inv.id} className="transaction-row" style={{ display: 'table-row' }}>
                                            <td style={{ display: 'table-cell' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '36px', height: '36px', borderRadius: '8px',
                                                        background: type.color + '20', color: type.color,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
                                                    }}>
                                                        {type.icon}
                                                    </div>
                                                    <span style={{ fontWeight: 500, color: 'var(--fin-text-primary)' }}>{inv.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ display: 'table-cell', color: 'var(--fin-text-secondary)' }}>{type.name}</td>
                                            <td style={{ display: 'table-cell', color: 'var(--fin-text-primary)', fontWeight: 500 }}>
                                                {symbol}{(parseFloat(inv.investedAmount) || 0).toLocaleString()}
                                            </td>
                                            {/* <td style={{ display: 'table-cell', color: 'var(--fin-text-primary)', fontWeight: 600 }}>
                                                {symbol}{(parseFloat(inv.currentValue) || 0).toLocaleString()}
                                            </td>
                                            <td style={{ display: 'table-cell' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{
                                                        color: returns >= 0 ? 'var(--fin-success)' : 'var(--fin-error)',
                                                        fontWeight: 500
                                                    }}>
                                                        {returns >= 0 ? '+' : ''}{symbol}{Math.abs(returns).toLocaleString()}
                                                    </span>
                                                    <span style={{ fontSize: '11px', color: 'var(--fin-text-tertiary)' }}>
                                                        {returns >= 0 ? '↑' : '↓'} {percent}%
                                                    </span>
                                                </div>
                                            </td> */}
                                            <td style={{ display: 'table-cell' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        className="header-icon-btn"
                                                        onClick={() => { setEditingInvestment(inv); setShowAddModal(true); }}
                                                        style={{ width: '32px', height: '32px' }}
                                                        title="Edit"
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        className="header-icon-btn"
                                                        style={{ width: '32px', height: '32px', color: 'var(--fin-error)', borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.1)' }}
                                                        onClick={(e) => handleDelete(inv.id, e)}
                                                        title="Delete"
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <AddInvestmentForm
                            onClose={() => { setShowAddModal(false); setEditingInvestment(null); }}
                            editingData={editingInvestment}
                            actions={actions}
                            symbol={symbol}
                            types={investmentTypes}
                            bankAccounts={bankAccounts}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function AddInvestmentForm({ onClose, editingData, actions, symbol, types, bankAccounts }) {
    const [formData, setFormData] = useState({
        name: editingData?.name || '',
        type: editingData?.type || 'stocks',
        investedAmount: editingData?.investedAmount || '',
        // currentValue: editingData?.currentValue || '', // Only for edit
        bankAccountId: bankAccounts[0]?.id || '',
        createTransaction: false, // Default: don't create transaction
        date: new Date().toISOString().split('T')[0]
    });

    const isEditing = !!editingData;

    const handleSubmit = async (e) => {
        e.preventDefault();

        const amount = parseFloat(formData.investedAmount);
        if (!amount || amount <= 0) return;

        try {
            if (isEditing) {
                // Determine updates
                const updates = {
                    name: formData.name,
                    type: formData.type,
                    // If editing, we allow updating Current Value manually
                    // currentValue: parseFloat(formData.currentValue) || amount,
                    // Invested amount updates? Usually fixed, but allowing fix if mistake
                    investedAmount: amount
                };
                await actions.updateInvestment({ ...editingData, ...updates });
            } else {
                // Adding New Investment
                if (formData.createTransaction && !formData.bankAccountId) {
                    alert("Please select a bank account to pay from.");
                    return;
                }

                // 1. Create Investment
                const newInvestment = {
                    name: formData.name,
                    type: formData.type,
                    investedAmount: amount,
                    currentValue: amount, // Initially same as invested
                    date: formData.date
                };

                await actions.addInvestment(newInvestment);

                // 2. Create Expense Transaction (Only if requested)
                if (formData.createTransaction) {
                    const transaction = {
                        amount: amount,
                        type: 'expense',
                        categoryId: 'investments', // Make sure this exists in context categories
                        bankAccountId: formData.bankAccountId,
                        date: new Date(formData.date).toISOString(),
                        note: `Investment: ${formData.name}`,
                        status: 'confirmed'
                    };

                    await actions.addTransaction(transaction);
                }
            }
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to save investment");
        }
    };

    return (
        <>
            <div className="modal-header">
                <h2 className="modal-title">{isEditing ? 'Edit Investment' : 'New Investment'}</h2>
                <button className="modal-close" onClick={onClose}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Investment Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Apple Stock, SIP Fund"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Type</label>
                        <select
                            className="form-select"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            {types.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Invested Amount</label>
                        <div className="currency-input-wrapper">
                            <span className="currency-symbol">{symbol}</span>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="0"
                                value={formData.investedAmount}
                                onChange={e => setFormData({ ...formData, investedAmount: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* {isEditing && (
                        <div className="form-group">
                            <label className="form-label">Current Market Value</label>
                            <div className="currency-input-wrapper">
                                <span className="currency-symbol">{symbol}</span>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.currentValue}
                                    onChange={e => setFormData({ ...formData, currentValue: e.target.value })}
                                    required
                                />
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--fin-text-tertiary)', marginTop: '4px' }}>
                                Update this to track profit/loss
                            </p>
                        </div>
                    )} */}

                    {!isEditing && (
                        <>
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.createTransaction}
                                        onChange={e => setFormData({ ...formData, createTransaction: e.target.checked })}
                                        style={{ width: '16px', height: '16px' }}
                                    />
                                    Deduct from Account?
                                </label>
                                <p style={{ fontSize: '12px', color: 'var(--fin-text-tertiary)', marginLeft: '24px' }}>
                                    Check this to create an expense transaction for this investment.
                                </p>
                            </div>

                            {formData.createTransaction && (
                                <div className="form-group">
                                    <label className="form-label">Pay From Account</label>
                                    <select
                                        className="form-select"
                                        value={formData.bankAccountId}
                                        onChange={e => setFormData({ ...formData, bankAccountId: e.target.value })}
                                        required
                                    >
                                        {bankAccounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                    </select>
                                    {/* <p style={{ fontSize: '12px', color: 'var(--fin-text-tertiary)', marginTop: '4px' }}>
                                        Money will be deducted from this account
                                    </p> */}
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>
                        </>
                    )}

                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button type="submit" className="btn btn-primary">{isEditing ? 'Save Changes' : 'Confirm Investment'}</button>
                </div>
            </form>
        </>
    );
}

export default Investments;
