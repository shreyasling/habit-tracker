import { useState } from 'react';
import ReactDOM from 'react-dom';
import { useFinance } from '../../context/FinanceContext';

function Accounts() {
    const { state, actions } = useFinance();
    const { bankAccounts } = state;
    const symbol = state.settings.currencySymbol || '$';

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);

    const totalBalance = bankAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    return (
        <div className="accounts-page">
            <div className="page-header" style={{
                marginBottom: '32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Bank Accounts</h1>
                    <p style={{ color: 'var(--fin-text-tertiary)', marginTop: '4px' }}>
                        Manage your connected bank accounts
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowAddModal(true)}
                    style={{ height: 'fit-content' }}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add Account
                </button>
            </div>

            {/* Total Balance Card */}
            <TotalBalanceCard
                totalBalance={totalBalance}
                symbol={symbol}
                bankAccounts={bankAccounts}
            />

            {/* Accounts Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px'
            }}>
                {bankAccounts.map((account) => (
                    <AccountCard
                        key={account.id}
                        account={account}
                        symbol={symbol}
                        onEdit={() => setEditingAccount(account)}
                        onDelete={() => actions.deleteBankAccount(account.id)}
                    />
                ))}

                {/* Add Account Card */}
                <div
                    className="card"
                    style={{
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '220px',
                        border: '2px dashed var(--fin-border-secondary)',
                        background: 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onClick={() => setShowAddModal(true)}
                >
                    <div style={{
                        width: '48px',
                        height: '48px',
                        background: 'var(--fin-bg-elevated)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '12px'
                    }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--fin-text-muted)" strokeWidth="2" width="24" height="24">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                    </div>
                    <span style={{ color: 'var(--fin-text-secondary)', fontWeight: 500 }}>Add New Account</span>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {(showAddModal || editingAccount) && (
                <AccountModal
                    account={editingAccount}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingAccount(null);
                    }}
                    onSave={async (data) => {
                        if (editingAccount) {
                            await actions.updateBankAccount(editingAccount.id, data);
                        } else {
                            await actions.addBankAccount(data);
                        }
                        setShowAddModal(false);
                        setEditingAccount(null);
                    }}
                    symbol={symbol}
                />
            )}
        </div>
    );
}

function TotalBalanceCard({ totalBalance, symbol, bankAccounts }) {
    const [isBalanceVisible, setIsBalanceVisible] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);

    const toggleBalance = () => {
        if (isBalanceVisible) {
            setIsBalanceVisible(false);
        } else {
            // Check if any account has a PIN
            const hasAnyPin = bankAccounts.some(acc => acc.pin);
            if (hasAnyPin) {
                setShowPinModal(true);
            } else {
                setIsBalanceVisible(true);
            }
        }
    };

    const handlePinVerify = () => {
        setIsBalanceVisible(true);
        setShowPinModal(false);
    };

    const verifyAnyPin = (enteredPin) => {
        // Returns true if the entered PIN matches ANY of the account PINs
        return bankAccounts.some(acc => acc.pin === enteredPin);
    };

    return (
        <div style={{
            background: 'var(--fin-card-gradient)',
            borderRadius: 'var(--fin-radius-lg)',
            padding: '24px',
            marginBottom: '32px',
            color: 'white',
            maxWidth: '400px', // Prevent it from being too long
            position: 'relative',
            boxShadow: 'var(--fin-shadow-md)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>Total Balance</p>
                    <h2 style={{ fontSize: '36px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {isBalanceVisible ? (
                            <>
                                {symbol}{totalBalance.toLocaleString()}
                            </>
                        ) : (
                            '••••••••'
                        )}
                        <button
                            onClick={toggleBalance}
                            style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'white',
                                marginLeft: '4px'
                            }}
                        >
                            {isBalanceVisible ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            )}
                        </button>
                    </h2>
                    <p style={{ fontSize: '13px', opacity: 0.7, marginTop: '8px' }}>
                        Across {bankAccounts.length} account{bankAccounts.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {showPinModal && (
                <PinVerificationModal
                    verifyPin={verifyAnyPin} // Pass a verification function
                    onSuccess={handlePinVerify}
                    onClose={() => setShowPinModal(false)}
                />
            )}
        </div>
    );
}

function AccountCard({ account, symbol, onEdit, onDelete }) {
    const [isBalanceVisible, setIsBalanceVisible] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);

    const toggleBalance = () => {
        if (isBalanceVisible) {
            setIsBalanceVisible(false);
        } else {
            // If account has a PIN, ask for it
            if (account.pin) {
                setShowPinModal(true);
            } else {
                // If no PIN set, just show (or could enforce setting one)
                setIsBalanceVisible(true);
            }
        }
    };

    const handlePinVerify = () => {
        setIsBalanceVisible(true);
        setShowPinModal(false);
    };

    const verifySpecificPin = (enteredPin) => {
        return enteredPin === account.pin;
    };

    return (
        <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'var(--fin-accent-muted)',
                    borderRadius: 'var(--fin-radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--fin-accent-primary)" strokeWidth="2" width="24" height="24">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="M2 10H22" />
                        <path d="M6 16H10" />
                    </svg>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        className="icon-btn"
                        onClick={onEdit}
                        title="Edit"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                    </button>
                    <button
                        className="icon-btn danger"
                        onClick={onDelete}
                        title="Delete"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" />
                        </svg>
                    </button>
                </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
                <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: 'var(--fin-text-muted)',
                    letterSpacing: '0.5px'
                }}>
                    {account.type === 'savings' ? 'Savings Account' : 'Current Account'}
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginTop: '4px' }}>
                    {account.name}
                </h3>
            </div>

            {account.lastFourDigits && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--fin-text-tertiary)',
                    fontSize: '13px',
                    marginBottom: '16px'
                }}>
                    <span>••••</span>
                    <span>{account.lastFourDigits}</span>
                </div>
            )}

            <div style={{
                padding: '16px',
                background: 'var(--fin-bg-elevated)',
                borderRadius: 'var(--fin-radius-md)',
                marginTop: 'auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <span style={{ fontSize: '12px', color: 'var(--fin-text-muted)' }}>Available Balance</span>
                    <p style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isBalanceVisible ? (
                            <>
                                {symbol}{(account.balance || 0).toLocaleString()}
                            </>
                        ) : (
                            '••••••••'
                        )}
                    </p>
                </div>
                <button
                    onClick={toggleBalance}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--fin-text-secondary)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    title={isBalanceVisible ? "Hide Balance" : "Show Balance"}
                >
                    {isBalanceVisible ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    )}
                </button>
            </div>

            {showPinModal && (
                <PinVerificationModal
                    verifyPin={verifySpecificPin}
                    onSuccess={handlePinVerify}
                    onClose={() => setShowPinModal(false)}
                />
            )}
        </div>
    );
}

function PinVerificationModal({ verifyPin, onSuccess, onClose }) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Uses the passed verification function
        if (verifyPin(pin)) {
            onSuccess();
        } else {
            setError('Incorrect Security PIN');
            setPin('');
        }
    };

    return ReactDOM.createPortal(
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
            <div className="modal" style={{ maxWidth: '300px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title" style={{ fontSize: '18px' }}>Enter PIN</h3>
                    <button className="modal-close" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <p style={{ fontSize: '14px', color: 'var(--fin-text-secondary)', marginBottom: '16px' }}>
                            Enter your 4-digit security PIN to view the balance.
                        </p>
                        <div className="form-group">
                            <input
                                type="password"
                                className="form-input"
                                value={pin}
                                onChange={(e) => {
                                    setPin(e.target.value);
                                    setError('');
                                }}
                                placeholder="PIN"
                                autoFocus
                                maxLength={10}
                                style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '20px' }}
                            />
                            {error && <div style={{ color: 'var(--fin-error)', fontSize: '13px', marginTop: '6px', textAlign: 'center' }}>{error}</div>}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                            Confirm
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

function AccountModal({ account, onClose, onSave, symbol }) {
    const [formData, setFormData] = useState({
        name: account?.name || '',
        type: account?.type || 'savings',
        balance: account?.balance?.toString() || '',
        lastFourDigits: account?.lastFourDigits || '',
        pin: account?.pin || ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            balance: parseFloat(formData.balance) || 0
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{account ? 'Edit Account' : 'Add Account'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Account Name</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., HDFC Savings"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Account Type</label>
                            <select
                                className="form-select"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="savings">Savings Account</option>
                                <option value="current">Current Account</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Current Balance</label>
                            <div className="currency-input-wrapper">
                                <span className="currency-symbol">{symbol}</span>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="0"
                                    value={formData.balance}
                                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Last 4 Digits (Optional)</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., 4521"
                                maxLength={4}
                                value={formData.lastFourDigits}
                                onChange={(e) => setFormData({ ...formData, lastFourDigits: e.target.value.replace(/\D/g, '') })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Security PIN (Optional)</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Set a PIN to hide balance"
                                value={formData.pin}
                                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                                autoComplete="off" // attempt to prevent autocomplete
                            />
                            <p style={{ fontSize: '12px', color: 'var(--fin-text-muted)', marginTop: '4px' }}>
                                Used to unhide your balance. Leave empty for always visible.
                            </p>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {account ? 'Save Changes' : 'Add Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Accounts;
