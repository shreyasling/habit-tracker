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
        const isQuestion = /^(how|what|why|show|list|can you|do i|where|which|top|compare)/i.test(text);

        let plans = null;

        // If it looks like a transaction request, try to parse it
        if (hasNumber && !isQuestion) {
            plans = await parseTransactionIntentAI(text, context.categories, state.bankAccounts);
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

        // Handle new response format with text and richData
        if (typeof aiResponse === 'object' && aiResponse.text) {
            return {
                type: 'ai',
                content: aiResponse.text || "I didn't understand that. Could you try rephrasing?",
                richData: aiResponse.richData || null
            };
        }

        // Fallback for old string format
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
        const budget = derivedData.monthlyBudget || 0;

        // Combine all categories (default + custom)
        const allCategories = [
            ...state.expenseCategories,
            ...state.incomeCategories,
            ...(state.customCategories || [])
        ];

        // Helper to enrich transactions with category names
        const enrichTransactions = (txs) => {
            return txs.map(tx => {
                const category = allCategories.find(c => c.id === tx.categoryId);
                return {
                    ...tx,
                    categoryName: category ? category.name : (tx.categoryName || 'Unknown')
                };
            });
        };

        const currentContext = {
            symbol,
            totalBalance,
            // Send ALL transactions for comprehensive analysis
            allTransactions: enrichTransactions(state.transactions),
            recentTransactions: enrichTransactions(state.transactions.slice(0, 50)),
            monthlySpend,
            budget,
            remaining: budget - monthlySpend,
            accounts: state.bankAccounts,
            categories: allCategories
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
            // Use date from AI parsing if available (e.g., "yesterday"), otherwise use now
            let transactionDate = new Date().toISOString();
            if (data.date) {
                // Parse the YYYY-MM-DD date and set to current time
                const [year, month, day] = data.date.split('-').map(Number);
                const parsedDate = new Date(year, month - 1, day, new Date().getHours(), new Date().getMinutes());
                transactionDate = parsedDate.toISOString();
            }

            await actions.addTransaction({
                amount: parseFloat(data.amount),
                note: data.note,
                categoryId: data.categoryId,
                bankAccountId: data.bankAccountId,
                type: data.type || 'expense',
                date: transactionDate,
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

    // Rich Data Renderer Component
    const RichDataRenderer = ({ data }) => {
        if (!data) return null;

        const { type } = data;

        // Category Breakdown Table
        if (type === 'category_breakdown') {
            return (
                <div style={{
                    background: 'linear-gradient(135deg, var(--fin-accent-primary) 0%, var(--fin-accent-secondary) 100%)',
                    borderRadius: 'var(--fin-radius-lg)',
                    padding: '16px',
                    marginTop: '12px',
                    color: 'white'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '18px' }}>📊</span>
                        <span style={{ fontWeight: 600 }}>{data.title || 'Top Spending Categories'}</span>
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '16px' }}>
                        {data.subtitle || 'Based on your monthly spending'}
                    </div>

                    {/* Table Header */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto auto',
                        gap: '12px',
                        padding: '8px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.2)',
                        fontSize: '11px',
                        fontWeight: 500,
                        opacity: 0.8
                    }}>
                        <span>Category</span>
                        <span style={{ textAlign: 'right' }}>Avg. Monthly</span>
                        <span style={{ textAlign: 'right' }}>% of Income</span>
                    </div>

                    {/* Table Rows */}
                    {(data.data || []).map((item, idx) => (
                        <div key={idx} style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto auto',
                            gap: '12px',
                            padding: '12px 0',
                            borderBottom: idx < data.data.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '16px' }}>{item.icon || '📦'}</span>
                                <span style={{ fontWeight: 500 }}>{item.category}</span>
                            </div>
                            <span style={{ fontWeight: 600, textAlign: 'right' }}>
                                {symbol}{(item.amount || 0).toLocaleString()}
                            </span>
                            <span style={{
                                background: 'rgba(255,255,255,0.2)',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 600
                            }}>
                                {item.percentage || 0}%
                            </span>
                        </div>
                    ))}

                    {/* Summary */}
                    {data.summary && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: '16px',
                            paddingTop: '12px',
                            borderTop: '1px solid rgba(255,255,255,0.2)',
                            fontSize: '12px'
                        }}>
                            <div>
                                <div style={{ opacity: 0.8 }}>Total Income (Monthly)</div>
                                <div style={{ fontWeight: 600, fontSize: '14px' }}>{symbol}{(data.summary.totalIncome || 0).toLocaleString()}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ opacity: 0.8 }}>Total Spent (Top {data.data?.length || 0})</div>
                                <div style={{ fontWeight: 600, fontSize: '14px' }}>{symbol}{(data.summary.totalSpent || 0).toLocaleString()}</div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // Comparison Card
        if (type === 'comparison') {
            const isIncrease = data.change > 0;
            return (
                <div style={{
                    background: 'var(--fin-bg-elevated)',
                    borderRadius: 'var(--fin-radius-lg)',
                    padding: '16px',
                    marginTop: '12px',
                    border: '1px solid var(--fin-border-primary)'
                }}>
                    <div style={{ fontWeight: 600, marginBottom: '16px' }}>{data.title || 'Comparison'}</div>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                        {(data.periods || []).map((period, idx) => (
                            <div key={idx} style={{
                                flex: 1,
                                background: 'var(--fin-bg-secondary)',
                                padding: '12px',
                                borderRadius: 'var(--fin-radius-md)',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '12px', color: 'var(--fin-text-muted)', marginBottom: '4px' }}>{period.label}</div>
                                <div style={{ fontSize: '18px', fontWeight: 600 }}>{symbol}{(period.amount || 0).toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '8px',
                        background: isIncrease ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                        borderRadius: 'var(--fin-radius-sm)',
                        color: isIncrease ? 'var(--fin-error)' : 'var(--fin-success)',
                        fontWeight: 600
                    }}>
                        <span>{isIncrease ? '📈' : '📉'}</span>
                        <span>{Math.abs(data.change || 0)}% {data.changeLabel || (isIncrease ? 'increase' : 'decrease')}</span>
                    </div>
                </div>
            );
        }

        // Stats Cards
        if (type === 'stats') {
            return (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                    marginTop: '12px'
                }}>
                    {(data.cards || []).map((card, idx) => (
                        <div key={idx} style={{
                            background: 'var(--fin-bg-elevated)',
                            padding: '12px',
                            borderRadius: 'var(--fin-radius-md)',
                            border: '1px solid var(--fin-border-primary)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                <span style={{ fontSize: '16px' }}>{card.icon || '📊'}</span>
                                <span style={{ fontSize: '11px', color: 'var(--fin-text-muted)' }}>{card.label}</span>
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: card.color || 'inherit' }}>
                                {card.value}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        // Transaction List
        if (type === 'transactions') {
            return (
                <div style={{
                    background: 'var(--fin-bg-elevated)',
                    borderRadius: 'var(--fin-radius-lg)',
                    padding: '12px',
                    marginTop: '12px',
                    border: '1px solid var(--fin-border-primary)'
                }}>
                    <div style={{ fontWeight: 600, marginBottom: '12px' }}>{data.title || 'Transactions'}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(data.data || []).slice(0, 5).map((tx, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px',
                                background: 'var(--fin-bg-secondary)',
                                borderRadius: 'var(--fin-radius-sm)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>{tx.icon || '📦'}</span>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{tx.category}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--fin-text-muted)' }}>{tx.note || tx.date}</div>
                                    </div>
                                </div>
                                <span style={{
                                    fontWeight: 600,
                                    color: tx.type === 'expense' ? 'var(--fin-error)' : 'var(--fin-success)'
                                }}>
                                    {tx.type === 'expense' ? '-' : '+'}{symbol}{(tx.amount || 0).toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return null;
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
                                <div className="chat-bubble" style={{ maxWidth: '100%' }}>
                                    {msg.content.split('\n').map((line, i) => (
                                        <p key={i} style={{ margin: i > 0 ? '8px 0 0' : 0 }}>{line}</p>
                                    ))}
                                    {/* Render rich data components if available */}
                                    {msg.richData && <RichDataRenderer data={msg.richData} />}
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

                    {/* Quick Action Chips */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap',
                        marginTop: '8px'
                    }}>
                        {[
                            { label: '📊 Top categories', query: 'What categories did I spend most on this month?' },
                            { label: '📅 Yesterday', query: 'How much did I spend yesterday?' },
                            { label: '💡 Suggestions', query: 'Analyze my spending and give me tips to save money' },
                            { label: '📈 Compare weeks', query: 'Compare my spending this week vs last week' }
                        ].map((chip, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setInput(chip.query);
                                    // Auto-send after a small delay
                                    setTimeout(() => {
                                        const userMessage = {
                                            id: Date.now(),
                                            type: 'user',
                                            content: chip.query
                                        };
                                        setMessages(prev => [...prev, userMessage]);
                                        setInput('');
                                        setIsTyping(true);

                                        const allCategories = [
                                            ...state.expenseCategories,
                                            ...state.incomeCategories,
                                            ...(state.customCategories || [])
                                        ];
                                        const enrichTransactions = (txs) => txs.map(tx => {
                                            const category = allCategories.find(c => c.id === tx.categoryId);
                                            return { ...tx, categoryName: category?.name || tx.categoryName || 'Unknown' };
                                        });
                                        const totalBalance = state.bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
                                        const currentContext = {
                                            symbol,
                                            totalBalance,
                                            allTransactions: enrichTransactions(state.transactions),
                                            recentTransactions: enrichTransactions(state.transactions.slice(0, 50)),
                                            monthlySpend: derivedData.monthlySpend || 0,
                                            budget: derivedData.monthlyBudget || 0,
                                            remaining: derivedData.monthlyBudgetRemaining || 0,
                                            accounts: state.bankAccounts,
                                            categories: allCategories
                                        };

                                        processInput(chip.query, currentContext).then(response => {
                                            setMessages(prev => [...prev, { id: Date.now() + 1, ...response }]);
                                            setIsTyping(false);
                                        });
                                    }, 100);
                                }}
                                style={{
                                    background: 'var(--fin-bg-elevated)',
                                    border: '1px solid var(--fin-border-primary)',
                                    borderRadius: '16px',
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    color: 'var(--fin-text-secondary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {chip.label}
                            </button>
                        ))}
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
