import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';

function AutoPay() {
    const { state, actions } = useFinance();
    const symbol = state.settings?.currencySymbol || '₹';
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingAutoPay, setEditingAutoPay] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        bankAccountId: '',
        categoryId: 'bills',
        frequency: 'monthly', // daily, weekly, monthly, yearly
        dayOfMonth: 1,
        dayOfWeek: 1,
        time: '09:00',
        isActive: true,
        note: '',
        includeInBudget: true // Default: include in budget
    });

    const frequencies = [
        { id: 'daily', label: 'Daily', icon: '📅' },
        { id: 'weekly', label: 'Weekly', icon: '📆' },
        { id: 'monthly', label: 'Monthly', icon: '🗓️' },
        { id: 'yearly', label: 'Yearly', icon: '📅' }
    ];

    // Default categories for auto pay - includes Investment
    const defaultAutoPayCategories = [
        { id: 'bills', name: 'Bills', icon: '📄', color: '#ef4444' },
        { id: 'rent', name: 'Rent', icon: '🏠', color: '#f97316' },
        { id: 'investment', name: 'Investment', icon: '📈', color: '#22c55e' },
        { id: 'food', name: 'Food', icon: '🍔', color: '#eab308' },
        { id: 'transport', name: 'Transport', icon: '🚗', color: '#3b82f6' },
        { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#8b5cf6' },
        { id: 'health', name: 'Health', icon: '🏥', color: '#ec4899' },
        { id: 'education', name: 'Education', icon: '📚', color: '#06b6d4' }
    ];

    // Combine default + custom expense categories
    const customExpenseCategories = (state.customCategories || []).filter(c => c.type === 'expense');
    const autoPayCategories = [...defaultAutoPayCategories, ...customExpenseCategories];

    const daysOfWeek = [
        { id: 0, label: 'Sunday' },
        { id: 1, label: 'Monday' },
        { id: 2, label: 'Tuesday' },
        { id: 3, label: 'Wednesday' },
        { id: 4, label: 'Thursday' },
        { id: 5, label: 'Friday' },
        { id: 6, label: 'Saturday' }
    ];

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setFormData({
            name: '',
            amount: '',
            bankAccountId: state.bankAccounts[0]?.id || '',
            categoryId: 'bills',
            frequency: 'monthly',
            dayOfMonth: 1,
            dayOfWeek: 1,
            time: '09:00',
            isActive: true,
            note: '',
            includeInBudget: true
        });
        setEditingAutoPay(null);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.amount || !formData.bankAccountId) {
            alert('Please fill in all required fields');
            return;
        }

        const autoPayData = {
            ...formData,
            amount: parseFloat(formData.amount),
            createdAt: new Date().toISOString(),
            lastRun: null,
            nextRun: calculateNextRun(formData)
        };

        if (editingAutoPay) {
            await actions.updateAutoPay(editingAutoPay.id, autoPayData);
        } else {
            await actions.addAutoPay(autoPayData);
        }

        setShowAddModal(false);
        resetForm();
    };

    const calculateNextRun = (data) => {
        const now = new Date();
        const [hours, minutes] = data.time.split(':').map(Number);
        let nextRun = new Date();
        nextRun.setHours(hours, minutes, 0, 0);

        switch (data.frequency) {
            case 'daily':
                if (nextRun <= now) {
                    nextRun.setDate(nextRun.getDate() + 1);
                }
                break;
            case 'weekly':
                nextRun.setDate(nextRun.getDate() + ((7 + data.dayOfWeek - nextRun.getDay()) % 7 || 7));
                break;
            case 'monthly':
                nextRun.setDate(data.dayOfMonth);
                if (nextRun <= now) {
                    nextRun.setMonth(nextRun.getMonth() + 1);
                }
                break;
            case 'yearly':
                nextRun.setDate(data.dayOfMonth);
                if (nextRun <= now) {
                    nextRun.setFullYear(nextRun.getFullYear() + 1);
                }
                break;
        }

        return nextRun.toISOString();
    };

    const handleEdit = (autoPay) => {
        setFormData({
            name: autoPay.name,
            amount: autoPay.amount.toString(),
            bankAccountId: autoPay.bankAccountId,
            categoryId: autoPay.categoryId || 'bills',
            frequency: autoPay.frequency,
            dayOfMonth: autoPay.dayOfMonth || 1,
            dayOfWeek: autoPay.dayOfWeek || 1,
            time: autoPay.time || '09:00',
            isActive: autoPay.isActive,
            note: autoPay.note || '',
            includeInBudget: autoPay.includeInBudget !== false // Default true for old auto-pays
        });
        setEditingAutoPay(autoPay);
        setShowAddModal(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this auto pay?')) {
            await actions.deleteAutoPay(id);
        }
    };

    const handleToggle = async (autoPay) => {
        await actions.updateAutoPay(autoPay.id, { isActive: !autoPay.isActive });
    };

    const getFrequencyLabel = (autoPay) => {
        switch (autoPay.frequency) {
            case 'daily':
                return `Daily at ${autoPay.time}`;
            case 'weekly':
                return `Every ${daysOfWeek.find(d => d.id === autoPay.dayOfWeek)?.label} at ${autoPay.time}`;
            case 'monthly':
                return `${autoPay.dayOfMonth}${getOrdinalSuffix(autoPay.dayOfMonth)} of every month at ${autoPay.time}`;
            case 'yearly':
                return `${autoPay.dayOfMonth}${getOrdinalSuffix(autoPay.dayOfMonth)} every year at ${autoPay.time}`;
            default:
                return autoPay.frequency;
        }
    };

    const getOrdinalSuffix = (n) => {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return s[(v - 20) % 10] || s[v] || s[0];
    };

    const autoPays = state.autoPays || [];

    return (
        <div className="finance-section">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--fin-text-primary)', marginBottom: '4px' }}>
                        Auto Pay
                    </h2>
                    <p style={{ color: 'var(--fin-text-muted)', fontSize: '14px' }}>
                        Set up recurring automatic payments
                    </p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => {
                        resetForm();
                        setShowAddModal(true);
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 20px',
                        background: 'var(--fin-accent-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--fin-radius-md)',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add Auto Pay
                </button>
            </div>

            {autoPays.length === 0 ? (
                <div className="empty-state" style={{
                    background: 'var(--fin-bg-card)',
                    borderRadius: 'var(--fin-radius-lg)',
                    padding: '48px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--fin-text-primary)' }}>
                        No Auto Payments Set Up
                    </h3>
                    <p style={{ color: 'var(--fin-text-muted)', marginBottom: '24px' }}>
                        Set up recurring payments for bills, subscriptions, and more
                    </p>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowAddModal(true);
                        }}
                        style={{
                            padding: '12px 24px',
                            background: 'var(--fin-accent-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--fin-radius-md)',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Set Up First Auto Pay
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {autoPays.map(autoPay => {
                        const account = state.bankAccounts.find(a => a.id === autoPay.bankAccountId);
                        const category = autoPayCategories.find(c => c.id === autoPay.categoryId);

                        return (
                            <div
                                key={autoPay.id}
                                style={{
                                    background: 'var(--fin-bg-card)',
                                    borderRadius: 'var(--fin-radius-lg)',
                                    padding: '20px',
                                    border: '1px solid var(--fin-border-primary)',
                                    opacity: autoPay.isActive ? 1 : 0.6
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '12px',
                                            background: category?.color || 'var(--fin-accent-primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '24px'
                                        }}>
                                            {category?.icon || '🔄'}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--fin-text-primary)', marginBottom: '4px' }}>
                                                {autoPay.name}
                                            </h3>
                                            <p style={{ fontSize: '13px', color: 'var(--fin-text-muted)' }}>
                                                {getFrequencyLabel(autoPay)}
                                            </p>
                                            <p style={{ fontSize: '12px', color: 'var(--fin-text-muted)', marginTop: '4px' }}>
                                                From: {account?.name || 'Unknown Account'}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--fin-error)' }}>
                                            -{symbol}{autoPay.amount.toLocaleString()}
                                        </div>
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            marginTop: '8px',
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            background: autoPay.isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                            color: autoPay.isActive ? 'var(--fin-success)' : 'var(--fin-error)'
                                        }}>
                                            {autoPay.isActive ? '● Active' : '○ Paused'}
                                        </div>
                                    </div>
                                </div>

                                {autoPay.nextRun && (
                                    <div style={{
                                        marginTop: '16px',
                                        padding: '12px',
                                        background: 'var(--fin-bg-elevated)',
                                        borderRadius: 'var(--fin-radius-sm)',
                                        fontSize: '13px',
                                        color: 'var(--fin-text-secondary)'
                                    }}>
                                        <strong>Next payment:</strong> {new Date(autoPay.nextRun).toLocaleString()}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                    <button
                                        onClick={() => handleToggle(autoPay)}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            background: 'var(--fin-bg-elevated)',
                                            border: '1px solid var(--fin-border-primary)',
                                            borderRadius: 'var(--fin-radius-sm)',
                                            color: 'var(--fin-text-primary)',
                                            cursor: 'pointer',
                                            fontWeight: 500
                                        }}
                                    >
                                        {autoPay.isActive ? 'Pause' : 'Resume'}
                                    </button>
                                    <button
                                        onClick={() => handleEdit(autoPay)}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            background: 'var(--fin-bg-elevated)',
                                            border: '1px solid var(--fin-border-primary)',
                                            borderRadius: 'var(--fin-radius-sm)',
                                            color: 'var(--fin-text-primary)',
                                            cursor: 'pointer',
                                            fontWeight: 500
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(autoPay.id)}
                                        style={{
                                            padding: '10px 16px',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            borderRadius: 'var(--fin-radius-sm)',
                                            color: 'var(--fin-error)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)} style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '16px'
                }}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{
                        width: '100%',
                        maxWidth: '500px',
                        maxHeight: 'calc(100vh - 32px)',
                        background: 'var(--fin-bg-card)',
                        borderRadius: 'var(--fin-radius-lg)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        <div className="modal-header" style={{
                            padding: '20px 24px',
                            borderBottom: '1px solid var(--fin-border-primary)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexShrink: 0
                        }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--fin-text-primary)', margin: 0 }}>
                                {editingAutoPay ? 'Edit Auto Pay' : 'Add Auto Pay'}
                            </h2>
                            <button onClick={() => setShowAddModal(false)} style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--fin-text-muted)',
                                cursor: 'pointer',
                                padding: '4px'
                            }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body" style={{
                            padding: '20px 24px',
                            overflowY: 'auto',
                            flex: 1
                        }}>
                            {/* Name */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--fin-text-secondary)' }}>
                                    Payment Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => handleInputChange('name', e.target.value)}
                                    placeholder="e.g., Netflix Subscription"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'var(--fin-bg-elevated)',
                                        border: '1px solid var(--fin-border-primary)',
                                        borderRadius: 'var(--fin-radius-sm)',
                                        color: 'var(--fin-text-primary)',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            {/* Amount */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--fin-text-secondary)' }}>
                                    Amount *
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{
                                        position: 'absolute',
                                        left: '14px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: 'var(--fin-text-muted)',
                                        fontSize: '14px',
                                        fontWeight: 600
                                    }}>{symbol}</span>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={e => handleInputChange('amount', e.target.value)}
                                        placeholder="0.00"
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px 10px 36px',
                                            background: 'var(--fin-bg-elevated)',
                                            border: '1px solid var(--fin-border-primary)',
                                            borderRadius: 'var(--fin-radius-sm)',
                                            color: 'var(--fin-text-primary)',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Bank Account */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--fin-text-secondary)' }}>
                                    From Account *
                                </label>
                                <select
                                    value={formData.bankAccountId}
                                    onChange={e => handleInputChange('bankAccountId', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'var(--fin-bg-elevated)',
                                        border: '1px solid var(--fin-border-primary)',
                                        borderRadius: 'var(--fin-radius-sm)',
                                        color: 'var(--fin-text-primary)',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    <option value="">Select Account</option>
                                    {state.bankAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Category - Compact 2 rows */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--fin-text-secondary)' }}>
                                    Category
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                                    {autoPayCategories.map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => handleInputChange('categoryId', cat.id)}
                                            style={{
                                                padding: '8px 4px',
                                                background: formData.categoryId === cat.id ? cat.color : 'var(--fin-bg-elevated)',
                                                border: `1px solid ${formData.categoryId === cat.id ? cat.color : 'var(--fin-border-primary)'}`,
                                                borderRadius: 'var(--fin-radius-sm)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '2px'
                                            }}
                                        >
                                            <span style={{ fontSize: '16px' }}>{cat.icon}</span>
                                            <span style={{
                                                fontSize: '9px',
                                                color: formData.categoryId === cat.id ? 'white' : 'var(--fin-text-secondary)',
                                                fontWeight: 500,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                maxWidth: '100%'
                                            }}>{cat.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Frequency */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--fin-text-secondary)' }}>
                                    Frequency
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                                    {frequencies.map(freq => (
                                        <button
                                            key={freq.id}
                                            type="button"
                                            onClick={() => handleInputChange('frequency', freq.id)}
                                            style={{
                                                padding: '10px 8px',
                                                background: formData.frequency === freq.id ? 'var(--fin-accent-primary)' : 'var(--fin-bg-elevated)',
                                                border: `1px solid ${formData.frequency === freq.id ? 'var(--fin-accent-primary)' : 'var(--fin-border-primary)'}`,
                                                borderRadius: 'var(--fin-radius-sm)',
                                                color: formData.frequency === freq.id ? 'white' : 'var(--fin-text-primary)',
                                                cursor: 'pointer',
                                                fontWeight: 500,
                                                fontSize: '12px'
                                            }}
                                        >
                                            {freq.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Day Selection based on frequency */}
                            {formData.frequency === 'weekly' && (
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--fin-text-secondary)' }}>
                                        Day of Week
                                    </label>
                                    <select
                                        value={formData.dayOfWeek}
                                        onChange={e => handleInputChange('dayOfWeek', parseInt(e.target.value))}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            background: 'var(--fin-bg-elevated)',
                                            border: '1px solid var(--fin-border-primary)',
                                            borderRadius: 'var(--fin-radius-sm)',
                                            color: 'var(--fin-text-primary)',
                                            fontSize: '14px',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        {daysOfWeek.map(day => (
                                            <option key={day.id} value={day.id}>{day.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {(formData.frequency === 'monthly' || formData.frequency === 'yearly') && (
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--fin-text-secondary)' }}>
                                        Day of Month
                                    </label>
                                    <select
                                        value={formData.dayOfMonth}
                                        onChange={e => handleInputChange('dayOfMonth', parseInt(e.target.value))}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            background: 'var(--fin-bg-elevated)',
                                            border: '1px solid var(--fin-border-primary)',
                                            borderRadius: 'var(--fin-radius-sm)',
                                            color: 'var(--fin-text-primary)',
                                            fontSize: '14px',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                                            <option key={day} value={day}>{day}{getOrdinalSuffix(day)}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Time */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--fin-text-secondary)' }}>
                                    Time
                                </label>
                                <input
                                    type="time"
                                    value={formData.time}
                                    onChange={e => handleInputChange('time', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'var(--fin-bg-elevated)',
                                        border: '1px solid var(--fin-border-primary)',
                                        borderRadius: 'var(--fin-radius-sm)',
                                        color: 'var(--fin-text-primary)',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            {/* Note */}
                            <div style={{ marginBottom: '8px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--fin-text-secondary)' }}>
                                    Note (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.note}
                                    onChange={e => handleInputChange('note', e.target.value)}
                                    placeholder="Add a note..."
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'var(--fin-bg-elevated)',
                                        border: '1px solid var(--fin-border-primary)',
                                        borderRadius: 'var(--fin-radius-sm)',
                                        color: 'var(--fin-text-primary)',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            {/* Include in Budget Toggle */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 16px',
                                background: 'var(--fin-bg-elevated)',
                                borderRadius: 'var(--fin-radius-md)',
                                marginBottom: '8px',
                                cursor: 'pointer'
                            }}
                                onClick={() => handleInputChange('includeInBudget', !formData.includeInBudget)}
                            >
                                <div>
                                    <span style={{ fontWeight: 500, color: 'var(--fin-text-primary)', fontSize: '13px' }}>
                                        Include in Budget
                                    </span>
                                    <p style={{ fontSize: '11px', color: 'var(--fin-text-muted)', marginTop: '2px' }}>
                                        Deduct from monthly budget when paid
                                    </p>
                                </div>
                                <div
                                    style={{
                                        width: '44px',
                                        height: '24px',
                                        borderRadius: '12px',
                                        background: formData.includeInBudget ? 'var(--fin-accent-primary)' : 'var(--fin-bg-tertiary)',
                                        position: 'relative',
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        background: 'white',
                                        position: 'absolute',
                                        top: '2px',
                                        left: formData.includeInBudget ? '22px' : '2px',
                                        transition: 'left 0.2s',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                    }} />
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer" style={{
                            padding: '16px 24px',
                            borderTop: '1px solid var(--fin-border-primary)',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px',
                            flexShrink: 0
                        }}>
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                style={{
                                    padding: '10px 20px',
                                    background: 'var(--fin-bg-elevated)',
                                    border: '1px solid var(--fin-border-primary)',
                                    borderRadius: 'var(--fin-radius-md)',
                                    color: 'var(--fin-text-primary)',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '14px'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                style={{
                                    padding: '10px 20px',
                                    background: 'var(--fin-accent-primary)',
                                    border: 'none',
                                    borderRadius: 'var(--fin-radius-md)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '14px'
                                }}
                            >
                                {editingAutoPay ? 'Save Changes' : 'Add Auto Pay'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AutoPay;
