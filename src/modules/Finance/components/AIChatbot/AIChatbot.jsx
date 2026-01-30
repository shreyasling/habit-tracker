import { useState, useEffect, useRef } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { parseTransactionIntentAI, chatWithFinanceAI } from '../../services/financialAiService';

function AIChatbot({ onClose }) {
    const { state, derivedData, actions } = useFinance();
    const symbol = state.settings.currencySymbol || '$';

    // Initial welcome message
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'ai',
            content: `Hi! I'm your financial assistant. I can help you understand your spending patterns or answer questions about your finances.\n\nYou can also tell me to add expenses like: "I spent 500 on food for lunch"`
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);



    const processInput = async (text, context) => {
        // OPTIMIZATION: Only try to parse as transaction if it looks like one.
        // Heuristics:
        // 1. Must contain a number (amount).
        // 2. Should NOT start with question words (How, What, Why, Show, List).
        // 3. Or if it explicitly mentions "spent", "paid", "added", "expense".

        const hasNumber = /\d/.test(text);
        const isQuestion = /^(how|what|why|show|list|can you|do i)/i.test(text);

        let plans = null;

        // If it looks like a transaction request, try to parse it
        if (hasNumber && !isQuestion) {
            plans = await parseTransactionIntentAI(text, state.categories, state.bankAccounts);
        }

        if (plans && plans.length > 0) {
            return {
                type: 'plan',
                content: `I've prepared ${plans.length} transaction${plans.length > 1 ? 's' : ''} for you. Please confirm the details below:`,
                data: plans.map(p => ({
                    ...p,
                    bankAccountId: p.bankAccountId || state.bankAccounts[0]?.id || ''
                }))
            };
        }

        // 2. If not a transaction, ask the AI
        const aiResponse = await chatWithFinanceAI(text, context);

        return {
            type: 'ai',
            content: aiResponse || "I didn't understand that. Could you try rephrasing?"
        };
    };

    const handleSend = () => {
        if (!input.trim() || isTyping) return; // Prevent double submit

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: input
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        // Capture context IMMEDIATELY to avoid stale closure
        const totalBalance = state.bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
        const monthlySpend = derivedData.monthlySpend || 0;
        const budget = state.settings.monthlyBudget || 0;

        // Helper to enrich transactions with category names
        const enrichTransactions = (txs) => {
            return txs.map(tx => {
                const category = state.categories.find(c => c.id === tx.categoryId);
                return {
                    ...tx,
                    categoryName: category ? category.name : (tx.categoryName || 'Unknown')
                };
            });
        };

        const currentContext = {
            symbol,
            totalBalance,
            recentTransactions: enrichTransactions(state.transactions), // Send ALL enriched transactions
            monthlySpend,
            budget,
            remaining: budget - monthlySpend,
            accounts: state.bankAccounts,
            categories: state.categories
        };

        // Process directly (no timeout needed for async logic)
        processInput(userMessage.content, currentContext).then(response => {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                ...response
            }]);
            setIsTyping(false);
        });
    };

    const handleConfirmTransaction = async (data) => {
        try {
            await actions.addTransaction({
                amount: parseFloat(data.amount),
                note: data.note,
                categoryId: data.categoryId,
                bankAccountId: data.bankAccountId,
                type: data.type || 'expense', // Use detected type or default to expense
                date: new Date().toISOString(),
            });

            const typeLabel = data.type === 'income' ? 'Income' : 'Expense';
            const sign = data.type === 'income' ? '+' : '-';

            setMessages(prev => [...prev, {
                id: Date.now(),
                type: 'ai',
                content: `✅ ${typeLabel} of ${symbol}${data.amount} for "${data.categoryName}" added successfully!`
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now(),
                type: 'ai',
                content: `❌ Failed to add transaction: ${error.message}`
            }]);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal chatbot-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                            width: '28px',
                            height: '28px',
                            background: 'var(--fin-accent-muted)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="var(--fin-accent-primary)" strokeWidth="2" width="16" height="16">
                                <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" />
                                <circle cx="8.5" cy="14.5" r="1.5" fill="var(--fin-accent-primary)" />
                                <circle cx="15.5" cy="14.5" r="1.5" fill="var(--fin-accent-primary)" />
                            </svg>
                        </span>
                        Ask AI
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="chatbot-messages">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`chat-message ${msg.type === 'plan' ? 'ai' : msg.type}`}>
                            <div className={`chat-avatar ${msg.type === 'plan' ? 'ai' : msg.type}`}>
                                {msg.type !== 'user' ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" />
                                    </svg>
                                ) : (
                                    <span style={{ fontSize: '14px' }}>👤</span>
                                )}
                            </div>

                            {msg.type === 'plan' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                                    {(Array.isArray(msg.data) ? msg.data : [msg.data]).map((planData, idx) => (
                                        <TransactionPlanCard
                                            key={idx}
                                            initialData={planData}
                                            categories={state.categories}
                                            bankAccounts={state.bankAccounts}
                                            onConfirm={handleConfirmTransaction}
                                            symbol={symbol}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="chat-bubble">
                                    {msg.content.split('\n').map((line, i) => (
                                        <p key={i} style={{ margin: i > 0 ? '8px 0 0' : 0 }}>{line}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {isTyping && (
                        <div className="chat-message ai">
                            <div className="chat-avatar ai">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" />
                                </svg>
                            </div>
                            <div className="chat-bubble">
                                <span style={{ opacity: 0.6 }}>Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chatbot-input-area">
                    <div className="chatbot-input-wrapper">
                        <input
                            type="text"
                            className="chatbot-input"
                            placeholder="Ask AI or say 'Spent 50 on food'..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                        <button className="chatbot-send" onClick={handleSend} disabled={!input.trim()}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TransactionPlanCard({ initialData, categories, bankAccounts, onConfirm, symbol }) {
    const [data, setData] = useState(initialData);
    const [isConfirmed, setIsConfirmed] = useState(false);

    if (isConfirmed) {
        return (
            <div className="chat-bubble" style={{ background: 'var(--fin-bg-elevated)', color: 'var(--fin-text-muted)', fontStyle: 'italic' }}>
                Transaction confirmed.
            </div>
        );
    }

    return (
        <div style={{ background: 'var(--fin-bg-elevated)', padding: '16px', borderRadius: '12px', width: '100%', maxWidth: '300px', border: '1px solid var(--fin-border-primary)' }}>
            <p style={{ marginBottom: '12px', fontWeight: 600 }}>Confirm Transaction Details:</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--fin-text-tertiary)', width: '60px' }}>Type</span>
                    <div style={{ flex: 1, display: 'flex', gap: '4px' }}>
                        <button
                            onClick={() => setData({ ...data, type: 'expense' })}
                            style={{
                                flex: 1,
                                padding: '4px',
                                borderRadius: '4px',
                                border: '1px solid var(--fin-border-primary)',
                                background: data.type === 'expense' ? '#ef4444' : 'transparent',
                                color: data.type === 'expense' ? 'white' : 'var(--fin-text-primary)',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            Expense
                        </button>
                        <button
                            onClick={() => setData({ ...data, type: 'income' })}
                            style={{
                                flex: 1,
                                padding: '4px',
                                borderRadius: '4px',
                                border: '1px solid var(--fin-border-primary)',
                                background: data.type === 'income' ? '#22c55e' : 'transparent',
                                color: data.type === 'income' ? 'white' : 'var(--fin-text-primary)',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            Income
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--fin-text-tertiary)', width: '60px' }}>Amount</span>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: 'var(--fin-accent-primary)', fontWeight: 600, marginRight: '4px' }}>{symbol}</span>
                        <input
                            type="number"
                            value={data.amount}
                            onChange={(e) => setData({ ...data, amount: e.target.value })}
                            style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--fin-border-primary)', color: 'var(--fin-text-primary)', width: '100%', padding: '4px 0' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--fin-text-tertiary)', width: '60px' }}>Category</span>
                    <select
                        value={data.categoryId}
                        onChange={(e) => {
                            const cat = categories.find(c => c.id === e.target.value);
                            setData({ ...data, categoryId: e.target.value, categoryName: cat?.name });
                        }}
                        style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid var(--fin-border-primary)', color: 'var(--fin-text-primary)', padding: '4px 0' }}
                    >
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--fin-text-tertiary)', width: '60px' }}>Account</span>
                    <select
                        value={data.bankAccountId}
                        onChange={(e) => setData({ ...data, bankAccountId: e.target.value })}
                        style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid var(--fin-border-primary)', color: 'var(--fin-text-primary)', padding: '4px 0' }}
                    >
                        {bankAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--fin-text-tertiary)', width: '60px' }}>Note</span>
                    <input
                        type="text"
                        value={data.note}
                        onChange={(e) => setData({ ...data, note: e.target.value })}
                        style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid var(--fin-border-primary)', color: 'var(--fin-text-primary)', padding: '4px 0' }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
                <button
                    onClick={() => {
                        onConfirm(data);
                        setIsConfirmed(true);
                    }}
                    style={{ flex: 1, background: 'var(--fin-accent-primary)', color: 'white', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
                >
                    Confirm Add
                </button>
            </div>
        </div>
    );
}

export default AIChatbot;
