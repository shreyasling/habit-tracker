import React from 'react';

function ProcessingOverlay({ method, amount, symbol, onCancel }) {
    return (
        <div className="modal-overlay" style={{ zIndex: 1200, flexDirection: 'column', gap: '24px' }}>
            <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: '3px solid var(--fin-bg-elevated)',
                borderTopColor: 'var(--fin-accent-primary)',
                animation: 'spin 1s linear infinite'
            }} />

            <div style={{ textAlign: 'center', color: 'white' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                    Processing Payment
                </h3>
                <p style={{ opacity: 0.7, fontSize: '14px', marginBottom: '24px' }}>
                    Confirming {symbol}{amount} via {method?.name || 'Selected Method'}...
                </p>

                <button
                    onClick={onCancel}
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        color: 'white',
                        fontSize: '13px',
                        cursor: 'pointer'
                    }}
                >
                    Cancel
                </button>
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default ProcessingOverlay;
