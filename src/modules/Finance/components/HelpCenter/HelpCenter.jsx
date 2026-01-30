function HelpCenter() {
    const faqs = [
        {
            question: "How do I add a new transaction?",
            answer: "Click the 'Pay' button or 'Add Expense' in the header. Enter the amount, select a category, choose your bank account, and confirm. The transaction will be recorded immediately."
        },
        {
            question: "Can I edit a confirmed transaction?",
            answer: "For data integrity, confirmed transactions cannot be edited or deleted. You can only add notes to existing transactions. This ensures your financial records remain accurate and trustworthy."
        },
        {
            question: "How is my budget calculated?",
            answer: "Your remaining budget is calculated by subtracting all expenses for the current month from your set monthly budget. You can update your monthly budget in Settings."
        },
        {
            question: "Is my financial data secure?",
            answer: "Yes! Your data is stored securely in your personal account. We don't have access to your actual bank accounts - all balances and transactions are user-entered and controlled by you."
        },
        {
            question: "How does the AI assistant work?",
            answer: "The AI assistant analyzes your spending patterns to provide insights. Ask questions like 'How much did I spend this week?' or 'Where am I overspending?' to get personalized advice."
        },
        {
            question: "Can I track multiple bank accounts?",
            answer: "Yes! You can add as many bank accounts as you need. Each transaction can be linked to a specific account, and balances are updated automatically when you record expenses or income."
        },
        {
            question: "What do the colored dots on the calendar mean?",
            answer: "Purple dots indicate days with transactions. Red dots indicate high-spend days (days where you spent more than 1.5x your daily average). Tap any date to see the transactions for that day."
        },
        {
            question: "How do categories work?",
            answer: "Categories help organize your spending. When adding a transaction, select the most appropriate category. The Analytics page shows your spending breakdown by category to help identify patterns."
        }
    ];

    return (
        <div className="help-page">
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Help Center</h1>
                <p style={{ color: 'var(--fin-text-tertiary)', marginTop: '4px' }}>
                    Find answers to common questions
                </p>
            </div>

            {/* Quick Help Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '32px'
            }}>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        background: 'var(--fin-accent-muted)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px'
                    }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--fin-accent-primary)" strokeWidth="2" width="24" height="24">
                            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                            <path d="M12 16v-4M12 8h.01" />
                        </svg>
                    </div>
                    <h4 style={{ fontWeight: 600, marginBottom: '4px' }}>Getting Started</h4>
                    <p style={{ fontSize: '13px', color: 'var(--fin-text-tertiary)' }}>
                        Learn the basics of tracking
                    </p>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        background: 'var(--fin-success-muted)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px'
                    }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--fin-success)" strokeWidth="2" width="24" height="24">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="M2 10h20" />
                        </svg>
                    </div>
                    <h4 style={{ fontWeight: 600, marginBottom: '4px' }}>Managing Accounts</h4>
                    <p style={{ fontSize: '13px', color: 'var(--fin-text-tertiary)' }}>
                        Add and manage bank accounts
                    </p>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        background: 'var(--fin-info-muted)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px'
                    }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--fin-info)" strokeWidth="2" width="24" height="24">
                            <path d="M18 20V10M12 20V4M6 20v-6" />
                        </svg>
                    </div>
                    <h4 style={{ fontWeight: 600, marginBottom: '4px' }}>Understanding Analytics</h4>
                    <p style={{ fontSize: '13px', color: 'var(--fin-text-tertiary)' }}>
                        Read your spending insights
                    </p>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        background: 'var(--fin-warning-muted)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px'
                    }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--fin-warning)" strokeWidth="2" width="24" height="24">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
                        </svg>
                    </div>
                    <h4 style={{ fontWeight: 600, marginBottom: '4px' }}>Budgeting Tips</h4>
                    <p style={{ fontSize: '13px', color: 'var(--fin-text-tertiary)' }}>
                        Set and track your budget
                    </p>
                </div>
            </div>

            {/* FAQs */}
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                Frequently Asked Questions
            </h2>
            <div className="card">
                {faqs.map((faq, index) => (
                    <details
                        key={index}
                        style={{
                            borderBottom: index < faqs.length - 1 ? '1px solid var(--fin-border-primary)' : 'none'
                        }}
                    >
                        <summary style={{
                            padding: '20px',
                            cursor: 'pointer',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            {faq.question}
                        </summary>
                        <div style={{
                            padding: '0 20px 20px',
                            color: 'var(--fin-text-secondary)',
                            fontSize: '14px',
                            lineHeight: 1.6
                        }}>
                            {faq.answer}
                        </div>
                    </details>
                ))}
            </div>

            {/* Contact Section */}
            <div className="card" style={{ padding: '24px', marginTop: '24px', textAlign: 'center' }}>
                <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>Still need help?</h3>
                <p style={{ color: 'var(--fin-text-tertiary)', marginBottom: '16px' }}>
                    Use the AI Assistant to get personalized answers about your finances
                </p>
                <button className="btn btn-primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    Ask AI Assistant
                </button>
            </div>
        </div>
    );
}

export default HelpCenter;
