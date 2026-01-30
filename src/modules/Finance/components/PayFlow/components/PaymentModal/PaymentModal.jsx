import React from 'react';
import { PAYMENT_METHODS } from '../../services/PaymentService';

function PaymentModal({ amount, symbol, onClose, onSelectMethod }) {
    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
            <div
                className="modal"
                onClick={e => e.stopPropagation()}
                style={{
                    maxWidth: '400px',
                    animation: 'slideUp 0.3s ease'
                }}
            >
                <div className="modal-header">
                    <h3 className="modal-title">Pay {symbol}{amount}</h3>
                    <button className="modal-close" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '0 24px 24px' }}>
                    <p style={{
                        fontSize: '13px',
                        color: 'var(--fin-text-tertiary)',
                        marginBottom: '16px'
                    }}>
                        Select a payment method to proceed
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {PAYMENT_METHODS.map(method => (
                            <button
                                key={method.id}
                                onClick={() => onSelectMethod(method.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '16px',
                                    border: '1px solid var(--fin-border-primary)',
                                    borderRadius: '12px',
                                    background: 'var(--fin-bg-elevated)',
                                    color: 'var(--fin-text-primary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    textAlign: 'left'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--fin-bg-hover)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'var(--fin-bg-elevated)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        background: method.color,
                                        color: method.textColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '16px'
                                    }}>
                                        {method.icon}
                                    </span>
                                    <span style={{ fontWeight: 500 }}>{method.name}</span>
                                </div>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ opacity: 0.5 }}>
                                    <path d="M9 18l6-6-6-6" />
                                </svg>
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{
                    padding: '16px 24px',
                    background: 'var(--fin-bg-secondary)',
                    borderTop: '1px solid var(--fin-border-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    color: 'var(--fin-text-muted)'
                }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Secure Payment Simulation
                </div>
            </div>
        </div>
    );
}

export default PaymentModal;
