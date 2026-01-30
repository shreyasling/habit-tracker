import { useState } from 'react';
import ReactDOM from 'react-dom';
import { useFinance } from '../../context/FinanceContext';

function InvestmentsPanel({ symbol }) {
    const { state, actions } = useFinance();
    const { investments = [] } = state;
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
    const currentValue = investments.reduce((sum, inv) => sum + (parseFloat(inv.currentValue) || 0), 0);
    const totalReturns = currentValue - totalInvested;
    const returnsPercentage = totalInvested > 0 ? ((totalReturns / totalInvested) * 100).toFixed(1) : 0;

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this investment?')) {
            await actions.deleteInvestment(id);
        }
    };

    return (
        <div className="card" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Investments</h3>
                    <p style={{ fontSize: '13px', color: 'var(--fin-text-tertiary)', marginTop: '2px' }}>
                        Your portfolio summary
                    </p>
                </div>
                <button
                    className="icon-btn"
                    onClick={() => setShowAddModal(true)}
                    title="Add Investment"
                    style={{ background: 'var(--fin-bg-elevated)' }}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                </button>
            </div>

            {/* Portfolio Summary Card */}
            <div style={{
                background: 'var(--fin-card-gradient)',
                padding: '20px',
                borderRadius: 'var(--fin-radius-md)',
                marginBottom: '20px',
                color: 'white'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                        <p style={{ fontSize: '12px', opacity: 0.8 }}>Current Value</p>
                        <h2 style={{ fontSize: '24px', fontWeight: 700 }}>
                            {symbol}{currentValue.toLocaleString()}
                        </h2>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '12px', opacity: 0.8 }}>Returns</p>
                        <p style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            color: totalReturns >= 0 ? '#4ade80' : '#f87171',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '4px'
                        }}>
                            {totalReturns >= 0 ? '+' : ''}{symbol}{Math.abs(totalReturns).toLocaleString()}
                            <span style={{ fontSize: '12px', opacity: 0.9 }}>
                                ({totalReturns >= 0 ? '+' : ''}{returnsPercentage}%)
                            </span>
                        </p>
                    </div>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'rgba(255,255,255,0.2)'
                    }} />
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.7 }}>
                    Invested: {symbol}{totalInvested.toLocaleString()}
                </div>
            </div>

            {/* Investments List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '100px' }}>
                {investments.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '32px 0',
                        color: 'var(--fin-text-tertiary)',
                        border: '2px dashed var(--fin-border-secondary)',
                        borderRadius: 'var(--fin-radius-md)'
                    }}>
                        <p style={{ fontSize: '14px' }}>No investments added yet</p>
                        <button
                            className="btn btn-secondary btn-sm"
                            style={{ marginTop: '12px' }}
                            onClick={() => setShowAddModal(true)}
                        >
                            Add Your First Investment
                        </button>
                    </div>
                ) : (
                    investments.map(inv => {
                        const type = investmentTypes.find(t => t.id === inv.type) || investmentTypes[7];
                        const returns = (parseFloat(inv.currentValue) || 0) - (parseFloat(inv.investedAmount) || 0);
                        return (
                            <div
                                key={inv.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '12px',
                                    background: 'var(--fin-bg-elevated)',
                                    borderRadius: 'var(--fin-radius-md)',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s'
                                }}
                                onClick={() => {
                                    setEditingInvestment(inv);
                                    setShowAddModal(true);
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: type.color + '20',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px'
                                    }}>
                                        {type.icon}
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '14px', fontWeight: 600 }}>{inv.name}</h4>
                                        <p style={{ fontSize: '12px', color: 'var(--fin-text-tertiary)' }}>{type.name}</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '14px', fontWeight: 600 }}>
                                        {symbol}{(parseFloat(inv.currentValue) || 0).toLocaleString()}
                                    </p>
                                    <p style={{
                                        fontSize: '11px',
                                        color: returns >= 0 ? 'var(--fin-success)' : 'var(--fin-error)'
                                    }}>
                                        {returns >= 0 ? '+' : ''}{symbol}{Math.abs(returns).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Add/Edit Investment Modal */}
            {showAddModal && (
                <InvestmentModal
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingInvestment(null);
                    }}
                    investmentAndSetter={editingInvestment ? { val: editingInvestment, set: setEditingInvestment } : null}
                    symbol={symbol}
                    types={investmentTypes}
                />
            )}
        </div>
    );
}

function InvestmentModal({ onClose, investmentAndSetter, symbol, types }) {
    const { actions } = useFinance();
    const editingData = investmentAndSetter ? investmentAndSetter.val : null;

    const [formData, setFormData] = useState({
        name: editingData?.name || '',
        type: editingData?.type || 'stocks',
        investedAmount: editingData?.investedAmount || '',
        currentValue: editingData?.currentValue || '',
        notes: editingData?.notes || ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = {
            ...formData,
            investedAmount: parseFloat(formData.investedAmount) || 0,
            currentValue: parseFloat(formData.currentValue) || 0
        };

        if (editingData) {
            await actions.updateInvestment({ ...editingData, ...data });
        } else {
            await actions.addInvestment(data);
        }
        onClose();
    };

    const handleDelete = async () => {
        if (window.confirm('Delete this investment?')) {
            await actions.deleteInvestment(editingData.id);
            onClose();
        }
    };

    return ReactDOM.createPortal(
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{editingData ? 'Edit Investment' : 'Add Investment'}</h2>
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
                                placeholder="e.g., Apple Stocks, HDFC Mutual Fund"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Type</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                                {types.map(type => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: type.id })}
                                        style={{
                                            padding: '8px',
                                            border: formData.type === type.id ? `2px solid ${type.color}` : '1px solid var(--fin-border-primary)',
                                            borderRadius: '8px',
                                            background: formData.type === type.id ? type.color + '20' : 'var(--fin-bg-elevated)',
                                            fontSize: '12px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <span style={{ fontSize: '18px' }}>{type.icon}</span>
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{type.name}</span>
                                    </button>
                                ))}
                            </div>
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
                                    onChange={(e) => setFormData({ ...formData, investedAmount: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Current Value</label>
                            <div className="currency-input-wrapper">
                                <span className="currency-symbol">{symbol}</span>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="0"
                                    value={formData.currentValue}
                                    onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer" style={{ justifyContent: editingData ? 'space-between' : 'flex-end' }}>
                        {editingData && (
                            <button type="button" className="btn danger" onClick={handleDelete}>
                                Delete
                            </button>
                        )}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {editingData ? 'Save Changes' : 'Add Investment'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

export default InvestmentsPanel;
