import { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';

function AddExpense({ onClose, transactionToEdit = null }) {
    const { state, actions } = useFinance();
    const { bankAccounts, expenseCategories, incomeCategories, customCategories = [] } = state;
    const symbol = state.settings.currencySymbol || '$';

    // Combine default + custom categories
    const customExpense = customCategories.filter(c => c.type === 'expense');
    const customIncome = customCategories.filter(c => c.type === 'income');
    const allExpenseCategories = [...expenseCategories, ...customExpense];
    const allIncomeCategories = [...incomeCategories, ...customIncome];

    const [formData, setFormData] = useState(() => {
        const now = new Date();
        // Format date as YYYY-MM-DD in local time
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const localDate = `${year}-${month}-${day}`;

        return {
            amount: '',
            note: '',
            categoryId: allExpenseCategories[0]?.id || 'others',
            bankAccountId: bankAccounts[0]?.id || '',
            type: 'expense',
            date: localDate, // Use local date
            time: now.toTimeString().slice(0, 5)
        };
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize form if editing
    useEffect(() => {
        if (transactionToEdit) {
            const dateObj = new Date(transactionToEdit.date);
            setFormData({
                amount: transactionToEdit.amount.toString(),
                note: transactionToEdit.note || '',
                categoryId: transactionToEdit.categoryId,
                bankAccountId: transactionToEdit.bankAccountId || '',
                type: transactionToEdit.type,
                date: dateObj.toISOString().split('T')[0],
                time: dateObj.toTimeString().slice(0, 5)
            });
        }
    }, [transactionToEdit]);

    // Update category when type changes (only if not editing or explicit user change)
    useEffect(() => {
        if (!transactionToEdit) {
            if (formData.type === 'expense' && allExpenseCategories.length > 0) {
                setFormData(prev => ({ ...prev, categoryId: allExpenseCategories[0].id }));
            } else if (formData.type === 'income' && allIncomeCategories.length > 0) {
                setFormData(prev => ({ ...prev, categoryId: allIncomeCategories[0].id }));
            }
        }
    }, [formData.type, allExpenseCategories.length, allIncomeCategories.length, transactionToEdit]);

    const currentCategories = formData.type === 'expense' ? allExpenseCategories : allIncomeCategories;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.amount || parseFloat(formData.amount) <= 0) return;

        setIsSubmitting(true);
        try {
            const dateTime = new Date(`${formData.date}T${formData.time}`);
            const transactionData = {
                amount: parseFloat(formData.amount),
                note: formData.note,
                categoryId: formData.categoryId,
                bankAccountId: formData.bankAccountId,
                type: formData.type,
                date: dateTime.toISOString(),
            };

            if (transactionToEdit) {
                await actions.updateTransaction(transactionToEdit.id, transactionData);
            } else {
                await actions.addTransaction(transactionData);
            }
            onClose();
        } catch (error) {
            console.error('Failed to save transaction:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{transactionToEdit ? 'Edit Transaction' : 'Add Transaction'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Transaction Type Toggle */}
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            marginBottom: '20px',
                            background: 'var(--fin-bg-elevated)',
                            padding: '4px',
                            borderRadius: 'var(--fin-radius-md)'
                        }}>
                            <button
                                type="button"
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    border: 'none',
                                    borderRadius: 'var(--fin-radius-sm)',
                                    background: formData.type === 'expense' ? 'var(--fin-error)' : 'transparent',
                                    color: formData.type === 'expense' ? 'white' : 'var(--fin-text-secondary)',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => setFormData({ ...formData, type: 'expense' })}
                            >
                                Expense
                            </button>
                            <button
                                type="button"
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    border: 'none',
                                    borderRadius: 'var(--fin-radius-sm)',
                                    background: formData.type === 'income' ? 'var(--fin-success)' : 'transparent',
                                    color: formData.type === 'income' ? 'white' : 'var(--fin-text-secondary)',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => setFormData({ ...formData, type: 'income' })}
                            >
                                Income
                            </button>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Amount</label>
                            <div className="currency-input-wrapper">
                                <span className="currency-symbol">{symbol}</span>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="0"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Note / Description</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder={formData.type === 'expense' ? "What was this for?" : "Income source or note"}
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                {formData.type === 'expense' ? 'Expense Category' : 'Income Category'}
                            </label>
                            <div className="category-grid" style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '8px'
                            }}>
                                {currentCategories.map(cat => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, categoryId: cat.id })}
                                        style={{
                                            padding: '12px 8px',
                                            border: formData.categoryId === cat.id
                                                ? `2px solid ${cat.color}`
                                                : '1px solid var(--fin-border-primary)',
                                            borderRadius: '8px',
                                            background: formData.categoryId === cat.id
                                                ? cat.color + '20'
                                                : 'var(--fin-bg-elevated)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '4px',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <span style={{ fontSize: '20px' }}>{cat.icon}</span>
                                        <span style={{
                                            fontSize: '11px',
                                            color: 'var(--fin-text-secondary)',
                                            textAlign: 'center',
                                            lineHeight: 1.2
                                        }}>
                                            {cat.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Account</label>
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

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Time</label>
                                <input
                                    type="time"
                                    className="form-input"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting}
                            style={{
                                background: formData.type === 'expense' ? 'var(--fin-error)' : 'var(--fin-success)'
                            }}
                        >
                            {isSubmitting ? 'Saving...' : (transactionToEdit ? 'Save Changes' : `Add ${formData.type === 'expense' ? 'Expense' : 'Income'}`)}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddExpense;
