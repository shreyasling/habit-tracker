import { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useFinance } from '../../context/FinanceContext';

function AccountsPanel({ accounts, symbol }) {
    const { actions } = useFinance();
    const [showAddModal, setShowAddModal] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const carouselRef = useRef(null);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    const handlePrev = () => {
        setCurrentIndex(prev => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex(prev => Math.min(accounts.length - 1, prev + 1));
    };

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        const diff = touchStartX.current - touchEndX.current;
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                handleNext();
            } else {
                handlePrev();
            }
        }
    };

    const cardColors = [
        'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
        'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    ];

    return (
        <div className="accounts-section">
            <div className="accounts-header">
                <h3 className="accounts-title">My Accounts</h3>
                {accounts.length > 1 && (
                    <div className="carousel-nav">
                        <button
                            className="carousel-btn"
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </button>
                        <span className="carousel-indicator">
                            {currentIndex + 1} / {accounts.length}
                        </span>
                        <button
                            className="carousel-btn"
                            onClick={handleNext}
                            disabled={currentIndex === accounts.length - 1}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            <div
                className="accounts-carousel"
                ref={carouselRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div
                    className="accounts-track"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {accounts.map((account, index) => (
                        <div
                            key={account.id}
                            className={`account-card-wrapper ${index === currentIndex ? 'active' : ''}`}
                        >
                            <DashboardAccountCard
                                account={account}
                                symbol={symbol}
                                color={cardColors[index % cardColors.length]}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Pagination dots */}
            {accounts.length > 1 && (
                <div className="carousel-dots">
                    {accounts.map((_, index) => (
                        <button
                            key={index}
                            className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                            onClick={() => setCurrentIndex(index)}
                        />
                    ))}
                </div>
            )}

            <button className="add-account-btn" onClick={() => setShowAddModal(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M12 5v14M5 12h14" />
                </svg>
                Add new account
            </button>

            {showAddModal && (
                <AddAccountModal
                    onClose={() => setShowAddModal(false)}
                    onAdd={actions.addBankAccount}
                    symbol={symbol}
                />
            )}
        </div>
    );
}

function DashboardAccountCard({ account, symbol, color }) {
    const [isBalanceVisible, setIsBalanceVisible] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);

    const toggleBalance = () => {
        if (isBalanceVisible) {
            setIsBalanceVisible(false);
        } else {
            if (account.pin) {
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

    return (
        <>
            <div
                className="account-card"
                style={{ background: color, position: 'relative' }}
            >
                <div className="account-wifi-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                        <path d="M5 12.55a11 11 0 0114.08 0" />
                        <path d="M1.42 9a16 16 0 0121.16 0" />
                        <path d="M8.53 16.11a6 6 0 016.95 0" />
                        <circle cx="12" cy="20" r="1" fill="currentColor" />
                    </svg>
                </div>
                <div className="account-type">
                    {account.type === 'savings' ? 'SAVINGS ACCOUNT' :
                        account.type === 'current' ? 'CURRENT ACCOUNT' :
                            account.type === 'credit' ? 'CREDIT CARD' : 'ACCOUNT'}
                </div>
                <div className="account-name">{account.name}</div>
                <div className="account-number">
                    <div className="dots">
                        <span></span><span></span><span></span><span></span>
                    </div>
                    <span>{account.lastFourDigits || '****'}</span>
                </div>
                <div className="account-balance-label">Available Balance</div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <div className="account-balance">
                        {isBalanceVisible ? (
                            <>
                                {symbol}{(account.balance || 0).toLocaleString()}
                            </>
                        ) : (
                            '••••••••'
                        )}
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleBalance();
                        }}
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
                            color: 'white'
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
                </div>
            </div>

            {showPinModal && (
                <PinVerificationModal
                    expectedPin={account.pin}
                    onSuccess={handlePinVerify}
                    onClose={() => setShowPinModal(false)}
                />
            )}
        </>
    );
}

function PinVerificationModal({ expectedPin, onSuccess, onClose }) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (pin === expectedPin) {
            onSuccess();
        } else {
            setError('Incorrect Security PIN');
            setPin('');
        }
    };

    // Use Portal to render outside the carousel's transformed container
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

function AddAccountModal({ onClose, onAdd, symbol }) {
    const [formData, setFormData] = useState({
        name: '',
        type: 'savings',
        balance: '',
        lastFourDigits: '',
        pin: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onAdd({
            ...formData,
            balance: parseFloat(formData.balance) || 0
        });
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Add Bank Account</h2>
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
                                <option value="credit">Credit Card</option>
                                <option value="wallet">Digital Wallet</option>
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
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Add Account
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AccountsPanel;
