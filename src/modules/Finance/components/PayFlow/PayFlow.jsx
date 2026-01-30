import { useState, useEffect, useRef } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { paymentService, PAYMENT_METHODS } from './services/PaymentService';
import PaymentModal from './components/PaymentModal/PaymentModal';
import ProcessingOverlay from './components/ProcessingOverlay/ProcessingOverlay';
import { Html5QrcodeScanner } from 'html5-qrcode';

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

    // Payment Flow States
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

    // Scanner State
    const [showScanner, setShowScanner] = useState(false);
    const [scannedUri, setScannedUri] = useState(null);

    useEffect(() => {
        if (showScanner) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );

            scanner.render((decodedText) => {
                handleScanSuccess(decodedText, scanner);
            }, (error) => {
                // handle scan failure, usually better to ignore as it triggers on every frame check
            });

            return () => {
                scanner.clear().catch(error => console.error("Failed to clear scanner", error));
            };
        }
    }, [showScanner]);

    const handleScanSuccess = (decodedText, scanner) => {
        console.log("Scanned:", decodedText);

        // Simple validation for UPI
        if (decodedText.toLowerCase().includes("upi://") || decodedText.toLowerCase().includes("tez://")) {
            setScannedUri(decodedText);

            // Try parse params
            try {
                const url = new URL(decodedText);
                const am = url.searchParams.get('am');
                const pn = url.searchParams.get('pn');
                const tn = url.searchParams.get('tn'); // Transaction Note

                setFormData(prev => ({
                    ...prev,
                    amount: am || prev.amount,
                    note: tn || (pn ? `Pay to ${pn}` : prev.note)
                }));
            } catch (e) {
                console.warn("Could not parse URI params", e);
            }

            cancelScan(scanner);
        } else {
            alert("Not a valid UPI QR Code");
        }
    };

    const cancelScan = (scannerInstance) => {
        if (scannerInstance) {
            scannerInstance.clear().catch(console.error);
        }
        setShowScanner(false);
    };

    const handleAmountChange = (value) => {
        // Only allow numbers and decimal point
        const cleaned = value.replace(/[^0-9.]/g, '');
        setFormData({ ...formData, amount: cleaned });
    };

    const handleProceed = async () => {
        if (!formData.amount || parseFloat(formData.amount) <= 0) return;

        if (mode === 'transfer') {
            if (formData.bankAccountId === formData.toBankAccountId) {
                alert("Source and Destination accounts cannot be the same.");
                return;
            }
            setStep('confirm');
            return;
        }

        // For Expense ("Pay"): Trigger Payment Flow
        startPaymentFlow();
    };

    const startPaymentFlow = async () => {
        const amount = parseFloat(formData.amount);
        try {
            await paymentService.requestNativePayment(amount, formData.note || 'Payment');
            simulateProcessing({ id: 'native', name: 'Native Payment' });
        } catch (error) {
            console.log('Native payment not available or cancelled, showing modal', error);
            setShowPaymentModal(true);
        }
    };

    const handleMethodSelect = async (methodId) => {
        const method = PAYMENT_METHODS.find(m => m.id === methodId);
        setSelectedPaymentMethod(method);
        setShowPaymentModal(false);

        // Attempt to launch app
        setIsProcessingPayment(true);

        try {
            // Pass scannedUri if available
            const result = await paymentService.launchNativeApp(method, parseFloat(formData.amount), scannedUri);

            if (result.success) {
                setIsProcessingPayment(false);
                setStep('success');
                handleRecordTransaction();
            } else {
                console.log("App launch timeout - user might still be on page or unlocking app");
                setIsProcessingPayment(false);
            }
        } catch (e) {
            console.error(e);
            setIsProcessingPayment(false);
        }
    };

    const simulateProcessing = async (method) => {
        // Legacy simulation
        setIsProcessingPayment(true);
        setSelectedPaymentMethod(method);
        await paymentService.processPayment(method.id, parseFloat(formData.amount));
        await handleRecordTransaction();
        setIsProcessingPayment(false);
        setStep('success');
    };

    const handleRecordTransaction = async () => {
        try {
            await actions.addTransaction({
                amount: parseFloat(formData.amount),
                note: formData.note,
                categoryId: mode === 'transfer' ? 'transfer' : formData.categoryId,
                bankAccountId: formData.bankAccountId,
                toBankAccountId: mode === 'transfer' ? formData.toBankAccountId : null,
                type: mode,
                date: new Date().toISOString(),
                paymentMethod: selectedPaymentMethod?.name || 'Manual'
            });
        } catch (error) {
            console.error('Failed to record transaction', error);
            alert('Payment successful but failed to record record. Please check logs.');
        }
    };

    // For manual confirmation (Transfer mode)
    const handleConfirmTransfer = async () => {
        setIsSubmitting(true);
        try {
            await handleRecordTransaction();
            setStep('success');
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
        if (showScanner) {
            return (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <h3 style={{ marginBottom: '20px' }}>Scan UPI QR</h3>
                    <div id="reader" style={{ width: '100%' }}></div>
                    <button
                        onClick={() => setShowScanner(false)}
                        className="btn btn-secondary"
                        style={{ marginTop: '20px', width: '100%' }}
                    >
                        Cancel Scan
                    </button>
                </div>
            );
        }

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

                        {/* Scan Button (Only for Expense) */}
                        {mode === 'expense' && !scannedUri && (
                            <div style={{ padding: '0 24px 16px', display: 'flex', justifyContent: 'center' }}>
                                <button
                                    onClick={() => setShowScanner(true)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        background: 'var(--fin-bg-elevated)',
                                        border: '1px solid var(--fin-border)',
                                        color: 'var(--fin-text-primary)',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    <span style={{ fontSize: '18px' }}>📷</span>
                                    Scan QR to Pay
                                </button>
                            </div>
                        )}

                        {scannedUri && (
                            <div style={{
                                margin: '0 24px 16px',
                                padding: '12px',
                                background: '#f0fdf4',
                                borderRadius: '8px',
                                border: '1px solid #86efac',
                                color: '#15803d',
                                fontSize: '14px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span>✅ QR Scanned. Paying to detected ID.</span>
                                <button
                                    onClick={() => { setScannedUri(null); setFormData(p => ({ ...p, note: '' })); }}
                                    style={{ background: 'none', border: 'none', color: '#15803d', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                    Reset
                                </button>
                            </div>
                        )}

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
                                {mode === 'transfer' ? 'Review Transfer' : 'Pay Now'}
                            </button>
                        </div>
                    </>
                );
            case 'confirm':
                // Only for Transfers now, or manual fallback
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
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setStep('input')}>
                                Back
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleConfirmTransfer}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Processing...' : `Confirm Transfer`}
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
                            {mode === 'transfer' ? 'Transfer Successful!' : 'Payment Paid!'}
                        </h3>
                        <p style={{ color: 'var(--fin-text-tertiary)', marginBottom: '32px' }}>
                            {selectedPaymentMethod ? `Paid via ${selectedPaymentMethod.name}` : 'Transaction recorded'}
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
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal payflow-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2 className="modal-title">
                            {showScanner ? 'Scan QR' : (step === 'input' ? (mode === 'expense' ? 'Pay' : 'Transfer') : (step === 'confirm' ? 'Confirm Transaction' : 'Success'))}
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

            {/* Payment Modal */}
            {showPaymentModal && (
                <PaymentModal
                    amount={formData.amount}
                    symbol={symbol}
                    onClose={() => setShowPaymentModal(false)}
                    onSelectMethod={handleMethodSelect}
                />
            )}

            {/* Processing Overlay */}
            {isProcessingPayment && (
                <ProcessingOverlay
                    method={selectedPaymentMethod}
                    amount={formData.amount}
                    symbol={symbol}
                    onCancel={() => setIsProcessingPayment(false)}
                />
            )}
        </>
    );
}

export default PayFlow;
