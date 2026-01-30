import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';

function Onboarding({ user }) {
    const { actions } = useFinance();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        userName: user?.displayName?.split(' ')[0] || '',
        currency: 'USD',
        currencySymbol: '$',
        monthlyBudget: '',
        bankAccounts: []
    });
    const [currentAccount, setCurrentAccount] = useState({
        name: '',
        type: 'savings',
        balance: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currencies = [
        { code: 'USD', symbol: '$', name: 'US Dollar' },
        { code: 'EUR', symbol: '€', name: 'Euro' },
        { code: 'GBP', symbol: '£', name: 'British Pound' },
        { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
        { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
        { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    ];

    const handleAddAccount = () => {
        if (currentAccount.name && currentAccount.balance) {
            setFormData({
                ...formData,
                bankAccounts: [
                    ...formData.bankAccounts,
                    {
                        ...currentAccount,
                        balance: parseFloat(currentAccount.balance)
                    }
                ]
            });
            setCurrentAccount({ name: '', type: 'savings', balance: '' });
        }
    };

    const handleRemoveAccount = (index) => {
        setFormData({
            ...formData,
            bankAccounts: formData.bankAccounts.filter((_, i) => i !== index)
        });
    };

    const handleCurrencyChange = (code) => {
        const currency = currencies.find(c => c.code === code);
        setFormData({
            ...formData,
            currency: code,
            currencySymbol: currency?.symbol || '$'
        });
    };

    const handleComplete = async () => {
        if (formData.bankAccounts.length === 0) return;

        setIsSubmitting(true);
        try {
            await actions.completeOnboarding({
                userName: formData.userName,
                monthlyBudget: parseFloat(formData.monthlyBudget) || 0,
                bankAccounts: formData.bankAccounts,
                currency: formData.currency,
                currencySymbol: formData.currencySymbol
            });
        } catch (error) {
            console.error('Onboarding failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <div className="form-group">
                            <label className="form-label">What should we call you?</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter your name"
                                value={formData.userName}
                                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Preferred Currency</label>
                            <select
                                className="form-select"
                                value={formData.currency}
                                onChange={(e) => handleCurrencyChange(e.target.value)}
                            >
                                {currencies.map(c => (
                                    <option key={c.code} value={c.code}>
                                        {c.symbol} - {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>
                );
            case 2:
                return (
                    <>
                        <div className="form-group">
                            <label className="form-label">Monthly Budget (Optional)</label>
                            <div className="currency-input-wrapper">
                                <span className="currency-symbol">{formData.currencySymbol}</span>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="Enter your monthly budget"
                                    value={formData.monthlyBudget}
                                    onChange={(e) => setFormData({ ...formData, monthlyBudget: e.target.value })}
                                />
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--fin-text-muted)', marginTop: '8px' }}>
                                This helps us track your spending against your budget
                            </p>
                        </div>
                    </>
                );
            case 3:
                return (
                    <>
                        <p style={{ fontSize: '14px', color: 'var(--fin-text-tertiary)', marginBottom: '20px' }}>
                            Add at least one bank account to start tracking your finances
                        </p>

                        {formData.bankAccounts.length > 0 && (
                            <div className="account-list">
                                {formData.bankAccounts.map((account, index) => (
                                    <div key={index} className="account-item">
                                        <div className="account-item-info">
                                            <div className="account-item-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="2" y="4" width="20" height="16" rx="2" />
                                                    <path d="M2 10H22" />
                                                </svg>
                                            </div>
                                            <div className="account-item-details">
                                                <h4>{account.name}</h4>
                                                <span>{account.type === 'savings' ? 'Savings' : 'Current'}</span>
                                            </div>
                                        </div>
                                        <span className="account-item-balance">
                                            {formData.currencySymbol}{account.balance.toLocaleString()}
                                        </span>
                                        <div className="account-item-actions">
                                            <button
                                                className="icon-btn danger"
                                                onClick={() => handleRemoveAccount(index)}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{
                            background: 'var(--fin-bg-elevated)',
                            padding: '20px',
                            borderRadius: 'var(--fin-radius-md)',
                            border: '1px solid var(--fin-border-primary)'
                        }}>
                            <div className="form-group">
                                <label className="form-label">Account Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., HDFC Savings"
                                    value={currentAccount.name}
                                    onChange={(e) => setCurrentAccount({ ...currentAccount, name: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Type</label>
                                    <select
                                        className="form-select"
                                        value={currentAccount.type}
                                        onChange={(e) => setCurrentAccount({ ...currentAccount, type: e.target.value })}
                                    >
                                        <option value="savings">Savings</option>
                                        <option value="current">Current</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label className="form-label">Balance</label>
                                    <div className="currency-input-wrapper">
                                        <span className="currency-symbol">{formData.currencySymbol}</span>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="0"
                                            value={currentAccount.balance}
                                            onChange={(e) => setCurrentAccount({ ...currentAccount, balance: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ width: '100%', marginTop: '12px' }}
                                onClick={handleAddAccount}
                                disabled={!currentAccount.name || !currentAccount.balance}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                Add Account
                            </button>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="onboarding-container">
            <div className="onboarding-card">
                <div className="onboarding-header">
                    <div className="onboarding-logo">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                        </svg>
                    </div>
                    <h1 className="onboarding-title">Welcome to FinanceAI</h1>
                    <p className="onboarding-subtitle">
                        {step === 1 && "Let's personalize your experience"}
                        {step === 2 && "Set your monthly budget"}
                        {step === 3 && "Add your bank accounts"}
                    </p>
                </div>

                <div className="onboarding-steps">
                    <div className={`onboarding-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}></div>
                    <div className={`onboarding-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}></div>
                    <div className={`onboarding-step ${step >= 3 ? 'active' : ''}`}></div>
                </div>

                <form className="onboarding-form" onSubmit={(e) => e.preventDefault()}>
                    {renderStep()}

                    <div className="onboarding-actions">
                        {step > 1 && (
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setStep(step - 1)}
                            >
                                Back
                            </button>
                        )}
                        {step < 3 ? (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => setStep(step + 1)}
                                disabled={step === 1 && !formData.userName}
                            >
                                Continue
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleComplete}
                                disabled={formData.bankAccounts.length === 0 || isSubmitting}
                            >
                                {isSubmitting ? 'Setting up...' : 'Get Started'}
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Onboarding;
