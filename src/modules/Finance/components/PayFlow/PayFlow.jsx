import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';

function PayFlow({ onClose }) {
    const { state, actions } = useFinance();
    const { bankAccounts, categories } = state;
    const symbol = state.settings.currencySymbol || '$';

    const [step, setStep] = useState('input'); // input, confirm, success
    const [mode, setMode] = useState('expense'); // 'expense' or 'transfer'
    const [formData, setFormData] = useState({
        amount: '',
        note: '',
        categoryId: categories[0]?.id || 'others',
        bankAccountId: bankAccounts[0]?.id || '',
        toBankAccountId: bankAccounts[1]?.id || '', // Default to second account if exists
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAmountChange = (value) => {
        // Only allow numbers and decimal point
        const cleaned = value.replace(/[^0-9.]/g, '');
        setFormData({ ...formData, amount: cleaned });
    };

    const handleProceed = () => {
        if (!formData.amount || parseFloat(formData.amount) <= 0) return;

        if (mode === 'transfer' && formData.bankAccountId === formData.toBankAccountId) {
            alert("Source and Destination accounts cannot be the same.");
            return;
        }

        setStep('confirm');
    };

    const handleConfirmPayment = async () => {
        setIsSubmitting(true);
        try {
            await actions.addTransaction({
                amount: parseFloat(formData.amount),
                note: formData.note,
                categoryId: mode === 'transfer' ? 'transfer' : formData.categoryId,
                bankAccountId: formData.bankAccountId,
                toBankAccountId: mode === 'transfer' ? formData.toBankAccountId : null,
                type: mode,
                date: new Date().toISOString(),
            });
            setStep('success');
        } catch (error) {
            console.error('Payment/Transfer failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getCategoryInfo = (categoryId) => {
        if (categoryId === 'transfer') return { name: 'Transfer', icon: '↔️', color: '#6366f1' };
        return categories.find(c => c.id === categoryId) || categories[0];
    };

    const getAccountInfo = (accountId) => {
        return bankAccounts.find(a => a.id === accountId) || bankAccounts[0];
    };

    const renderStep = () => {
        switch (step) {
            case 'input':
                return (
                    <>
                        {/* Mode Toggle */}
                        <div style={{ display: 'flex', gap: '8px', padding: '0 24px', marginBottom: '24px', marginTop: '16px' }}>
                            <button
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: mode === 'expense' ? 'var(--fin-accent-primary)' : 'var(--fin-bg-elevated)',
                                    color: mode === 'expense' ? 'white' : 'var(--fin-text-secondary)',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => setMode('expense')}
                            >
                                Expense
                            </button>
                            <button
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: mode === 'transfer' ? 'var(--fin-info)' : 'var(--fin-bg-elevated)',
                                    color: mode === 'transfer' ? 'white' : 'var(--fin-text-secondary)',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => setMode('transfer')}
                            >
                                Transfer
                            </button>
                        </div>

                        <div className="payflow-amount-display">
                            <p className="payflow-label">Enter Amount</p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '32px', fontWeight: 600, color: 'var(--fin-text-secondary)' }}>
                                    {symbol}
                                </span>
                                <input
                                    type="text"
                                    className="payflow-amount-input"
                                    placeholder="0"
                                    value={formData.amount}
                                    onChange={(e) => handleAmountChange(e.target.value)}
                                    autoFocus
                                    style={{ textAlign: 'left', width: '120px' }}
                                />
                            </div>
                        </div>
                        <div className="payflow-form">
                            <div className="form-group">
                                <label className="form-label">Note / Description</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder={mode === 'transfer' ? "e.g. Monthly Savings" : "What's this payment for?"}
                                    value={formData.note}
                                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                />
                            </div>

                            {mode === 'expense' && (
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select
                                        className="form-select"
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.icon} {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">{mode === 'transfer' ? 'From Account' : 'Pay From'}</label>
                                <select
                                    className="form-select"
                                    value={formData.bankAccountId}
                                    onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                                >
                                    {bankAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {mode === 'transfer' && (
                                <div className="form-group">
                                    <label className="form-label">To Account</label>
                                    <select
                                        className="form-select"
                                        value={formData.toBankAccountId}
                                        onChange={(e) => setFormData({ ...formData, toBankAccountId: e.target.value })}
                                    >
                                        <option value="">Select Account</option>
                                        {bankAccounts
                                            .filter(acc => acc.id !== formData.bankAccountId)
                                            .map(acc => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.name}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="payflow-actions">
                            <button
                                className="proceed-btn"
                                onClick={handleProceed}
                                disabled={!formData.amount || parseFloat(formData.amount) <= 0 || (mode === 'transfer' && !formData.toBankAccountId)}
                            >
                                Proceed {mode === 'transfer' ? 'with Transfer' : 'to Pay'}
                            </button>
                        </div>
                    </>
                );
            case 'confirm':
                const category = mode === 'transfer' ? getCategoryInfo('transfer') : getCategoryInfo(formData.categoryId);
                const account = getAccountInfo(formData.bankAccountId);
                const toAccount = mode === 'transfer' ? getAccountInfo(formData.toBankAccountId) : null;

                return (
                    <>
                        <div className="modal-body" style={{ textAlign: 'center' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                background: mode === 'transfer' ? 'var(--fin-info-muted)' : 'var(--fin-accent-muted)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                                fontSize: '28px'
                            }}>
                                {category.icon}
                            </div>
                            <h3 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
                                {symbol}{parseFloat(formData.amount).toLocaleString()}
                            </h3>
                            <p style={{ color: 'var(--fin-text-tertiary)', marginBottom: '24px' }}>
                                {formData.note || category.name}
                            </p>

                            <div style={{
                                background: 'var(--fin-bg-elevated)',
                                borderRadius: 'var(--fin-radius-md)',
                                padding: '16px',
                                textAlign: 'left'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ color: 'var(--fin-text-muted)' }}>Type</span>
                                    <span style={{ fontWeight: 500 }}>{mode === 'transfer' ? 'Transfer' : 'Expense'}</span>
                                </div>
                                {mode === 'expense' && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <span style={{ color: 'var(--fin-text-muted)' }}>Category</span>
                                        <span style={{ fontWeight: 500 }}>{category.name}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: mode === 'transfer' ? '12px' : '0' }}>
                                    <span style={{ color: 'var(--fin-text-muted)' }}>From</span>
                                    <span style={{ fontWeight: 500 }}>{account?.name}</span>
                                </div>
                                {mode === 'transfer' && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--fin-text-muted)' }}>To</span>
                                        <span style={{ fontWeight: 500 }}>{toAccount?.name}</span>
                                    </div>
                                )}
                            </div>

                            {mode === 'expense' && (
                                <p style={{
                                    fontSize: '13px',
                                    color: 'var(--fin-text-muted)',
                                    marginTop: '20px',
                                    padding: '12px',
                                    background: 'var(--fin-warning-muted)',
                                    borderRadius: 'var(--fin-radius-sm)'
                                }}>
                                    💡 Complete your payment in your UPI app, then return here to confirm
                                </p>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setStep('input')}>
                                Back
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleConfirmPayment}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Processing...' : `Confirm ${mode === 'transfer' ? 'Transfer' : 'Payment'}`}
                            </button>
                        </div>
                    </>
                );
            case 'success':
                return (
                    <div className="modal-body" style={{ textAlign: 'center', padding: '40px 24px' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: 'var(--fin-success-muted)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px'
                        }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="var(--fin-success)" strokeWidth="3" width="40" height="40">
                                <path d="M20 6L9 17l-5-5" />
                            </svg>
                        </div>
                        <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
                            {mode === 'transfer' ? 'Transfer Successful!' : 'Payment Confirmed!'}
                        </h3>
                        <p style={{ color: 'var(--fin-text-tertiary)', marginBottom: '32px' }}>
                            Your transaction has been recorded successfully
                        </p>
                        <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>
                            Done
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal payflow-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {step === 'input' && (mode === 'expense' ? 'Pay' : 'Transfer')}
                        {step === 'confirm' && 'Confirm Transaction'}
                        {step === 'success' && 'Success'}
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {renderStep()}
            </div>
        </div>
    );
}

export default PayFlow;
