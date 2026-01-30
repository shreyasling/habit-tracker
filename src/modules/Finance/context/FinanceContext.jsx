import { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import {
    getUserFinanceData,
    saveUserFinanceData,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount
} from '../services/firestoreService';

const FinanceContext = createContext(null);

const initialState = {
    user: null,
    settings: {
        monthlyBudget: 0,
        currency: 'USD',
        currencySymbol: '$',
        theme: 'dark',
        budgets: {}, // { 'YYYY-MM': amount }
        onboardingCompleted: false,
    },
    bankAccounts: [],
    transactions: [],
    investments: [],
    expenseCategories: [
        { id: 'food', name: 'Food', icon: '🍔', color: '#22c55e' },
        { id: 'transport', name: 'Transport', icon: '🚗', color: '#3b82f6' },
        { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#f59e0b' },
        { id: 'bills', name: 'Bills', icon: '📄', color: '#ef4444' },
        { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#8b5cf6' },
        { id: 'health', name: 'Health', icon: '💊', color: '#ec4899' },
        { id: 'education', name: 'Education', icon: '📚', color: '#14b8a6' },
        { id: 'rent', name: 'Rent', icon: '🏠', color: '#f97316' },
        { id: 'groceries', name: 'Groceries', icon: '🛒', color: '#84cc16' },
        { id: 'subscriptions', name: 'Subscriptions', icon: '📱', color: '#06b6d4' },
        { id: 'investments', name: 'Investments', icon: '📈', color: '#10b981' },
        { id: 'others', name: 'Others', icon: '📦', color: '#6b7280' },
    ],
    incomeCategories: [
        { id: 'salary', name: 'Salary', icon: '💼', color: '#22c55e' },
        { id: 'freelance', name: 'Freelance', icon: '💻', color: '#3b82f6' },
        { id: 'stocks', name: 'Stocks/Dividends', icon: '📈', color: '#8b5cf6' },
        { id: 'business', name: 'Business', icon: '🏢', color: '#f59e0b' },
        { id: 'rental', name: 'Rental Income', icon: '🏘️', color: '#ec4899' },
        { id: 'friends', name: 'From Friends', icon: '👥', color: '#14b8a6' },
        { id: 'family', name: 'From Family', icon: '👨‍👩‍👧', color: '#f97316' },
        { id: 'borrowed', name: 'Borrowed', icon: '🤝', color: '#ef4444' },
        { id: 'gifts', name: 'Gifts', icon: '🎁', color: '#a855f7' },
        { id: 'refunds', name: 'Refunds', icon: '↩️', color: '#06b6d4' },
        { id: 'interest', name: 'Interest', icon: '🏦', color: '#84cc16' },
        { id: 'other-income', name: 'Other Income', icon: '💰', color: '#6b7280' },
    ],
    goals: [], // Initialize goals array
    // Combined categories for backward compatibility
    categories: [
        { id: 'food', name: 'Food', icon: '🍔', color: '#22c55e', type: 'expense' },
        { id: 'transport', name: 'Transport', icon: '🚗', color: '#3b82f6', type: 'expense' },
        { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#f59e0b', type: 'expense' },
        { id: 'bills', name: 'Bills', icon: '📄', color: '#ef4444', type: 'expense' },
        { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#8b5cf6', type: 'expense' },
        { id: 'health', name: 'Health', icon: '💊', color: '#ec4899', type: 'expense' },
        { id: 'education', name: 'Education', icon: '📚', color: '#14b8a6', type: 'expense' },
        { id: 'salary', name: 'Salary', icon: '💼', color: '#22c55e', type: 'income' },
        { id: 'freelance', name: 'Freelance', icon: '💻', color: '#3b82f6', type: 'income' },
        { id: 'stocks', name: 'Stocks', icon: '📈', color: '#8b5cf6', type: 'income' },
        { id: 'friends', name: 'Friends', icon: '👥', color: '#14b8a6', type: 'income' },
        { id: 'family', name: 'Family', icon: '👨‍👩‍👧', color: '#f97316', type: 'income' },
        { id: 'others', name: 'Others', icon: '📦', color: '#6b7280', type: 'expense' },
    ],
    loading: true,
    error: null,
};

function financeReducer(state, action) {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload };

        case 'SET_ERROR':
            return { ...state, error: action.payload, loading: false };

        case 'SET_USER_DATA':
            return {
                ...state,
                ...action.payload,
                loading: false
            };

        case 'UPDATE_SETTINGS':
            return {
                ...state,
                settings: { ...state.settings, ...action.payload }
            };

        case 'SET_BANK_ACCOUNTS':
            return { ...state, bankAccounts: action.payload };

        case 'ADD_BANK_ACCOUNT':
            return {
                ...state,
                bankAccounts: [...state.bankAccounts, action.payload]
            };

        case 'UPDATE_BANK_ACCOUNT':
            return {
                ...state,
                bankAccounts: state.bankAccounts.map(acc =>
                    acc.id === action.payload.id ? { ...acc, ...action.payload } : acc
                ),
            };

        case 'DELETE_BANK_ACCOUNT':
            return {
                ...state,
                bankAccounts: state.bankAccounts.filter(acc => acc.id !== action.payload),
            };

        case 'SET_TRANSACTIONS':
            return { ...state, transactions: action.payload };

        case 'ADD_TRANSACTION':
            return {
                ...state,
                transactions: [action.payload, ...state.transactions]
            };

        case 'UPDATE_TRANSACTION':
            return {
                ...state,
                transactions: state.transactions.map(tx =>
                    tx.id === action.payload.id ? { ...tx, ...action.payload } : tx
                ),
            };

        case 'DELETE_TRANSACTION':
            return {
                ...state,
                transactions: state.transactions.filter(tx => tx.id !== action.payload)
            };

        case 'SET_INVESTMENTS':
            return { ...state, investments: action.payload };

        case 'ADD_INVESTMENT':
            return {
                ...state,
                investments: [...state.investments, action.payload],
            };

        case 'UPDATE_INVESTMENT':
            return {
                ...state,
                investments: state.investments.map(inv =>
                    inv.id === action.payload.id ? { ...inv, ...action.payload } : inv
                ),
            };

        case 'ADD_GOAL':
            return {
                ...state,
                goals: [...(state.goals || []), action.payload]
            };

        case 'UPDATE_GOAL':
            return {
                ...state,
                goals: (state.goals || []).map(g =>
                    g.id === action.payload.id ? { ...g, ...action.payload } : g
                )
            };

        case 'DELETE_GOAL':
            return {
                ...state,
                goals: (state.goals || []).filter(g => g.id !== action.payload)
            };

        case 'UPDATE_ACCOUNT_BALANCE':
            return {
                ...state,
                bankAccounts: state.bankAccounts.map(acc =>
                    acc.id === action.payload.accountId
                        ? { ...acc, balance: acc.balance + action.payload.amount }
                        : acc
                ),
            };

        case 'COMPLETE_ONBOARDING':
            return {
                ...state,
                settings: { ...state.settings, onboardingCompleted: true },
            };

        default:
            return state;
    }
}

export function FinanceProvider({ children, userId }) {
    const [state, dispatch] = useReducer(financeReducer, initialState);
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

    // Load user data from Firestore
    useEffect(() => {
        if (!userId) return;

        const loadUserData = async () => {
            try {
                dispatch({ type: 'SET_LOADING', payload: true });
                const userData = await getUserFinanceData(userId);

                if (userData) {
                    dispatch({ type: 'SET_USER_DATA', payload: userData });
                    setHasCompletedOnboarding(userData.settings?.onboardingCompleted || false);
                } else {
                    dispatch({ type: 'SET_LOADING', payload: false });
                    setHasCompletedOnboarding(false);
                }
            } catch (error) {
                console.error('Error loading finance data:', error);
                dispatch({ type: 'SET_ERROR', payload: error.message });
            }
        };

        loadUserData();
    }, [userId]);

    // Save data to Firestore when state changes
    const saveData = useCallback(async (dataToSave) => {
        if (!userId) return;
        try {
            await saveUserFinanceData(userId, dataToSave);
        } catch (error) {
            console.error('Error saving finance data:', error);
        }
    }, [userId]);

    // Actions
    const actions = {
        updateSettings: async (settings) => {
            dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
            await saveData({ settings: { ...state.settings, ...settings } });
        },

        addBankAccount: async (account) => {
            const newAccount = {
                ...account,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
            };
            dispatch({ type: 'ADD_BANK_ACCOUNT', payload: newAccount });
            await addBankAccount(userId, newAccount);
            return newAccount;
        },

        updateBankAccount: async (accountId, updates) => {
            dispatch({ type: 'UPDATE_BANK_ACCOUNT', payload: { id: accountId, ...updates } });
            await updateBankAccount(userId, accountId, updates);
        },

        deleteBankAccount: async (accountId) => {
            dispatch({ type: 'DELETE_BANK_ACCOUNT', payload: accountId });
            await deleteBankAccount(userId, accountId);
        },

        addTransaction: async (transaction) => {
            const newTransaction = {
                ...transaction,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                status: 'confirmed',
            };

            dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });

            // Update bank account balance
            if (transaction.type === 'expense' && transaction.bankAccountId) {
                dispatch({
                    type: 'UPDATE_ACCOUNT_BALANCE',
                    payload: {
                        accountId: transaction.bankAccountId,
                        amount: -transaction.amount
                    }
                });
            } else if (transaction.type === 'income' && transaction.bankAccountId) {
                dispatch({
                    type: 'UPDATE_ACCOUNT_BALANCE',
                    payload: {
                        accountId: transaction.bankAccountId,
                        amount: transaction.amount
                    }
                });
            } else if (transaction.type === 'transfer' && transaction.bankAccountId && transaction.toBankAccountId) {
                // Deduct from Source
                dispatch({
                    type: 'UPDATE_ACCOUNT_BALANCE',
                    payload: {
                        accountId: transaction.bankAccountId,
                        amount: -transaction.amount
                    }
                });
                // Add to Destination
                dispatch({
                    type: 'UPDATE_ACCOUNT_BALANCE',
                    payload: {
                        accountId: transaction.toBankAccountId,
                        amount: transaction.amount
                    }
                });
            }

            await addTransaction(userId, newTransaction);
            return newTransaction;
        },

        updateTransaction: async (transactionId, updates) => {
            const oldTransaction = state.transactions.find(t => t.id === transactionId);
            if (!oldTransaction) return;

            // Optimistic update
            dispatch({ type: 'UPDATE_TRANSACTION', payload: { id: transactionId, ...updates } });

            // Handle balance updates for local state
            if (updates.amount !== undefined || updates.type || updates.bankAccountId) {
                // 1. Revert old
                if (oldTransaction.bankAccountId && oldTransaction.type === 'expense') {
                    dispatch({ type: 'UPDATE_ACCOUNT_BALANCE', payload: { accountId: oldTransaction.bankAccountId, amount: oldTransaction.amount } });
                } else if (oldTransaction.bankAccountId && oldTransaction.type === 'income') {
                    dispatch({ type: 'UPDATE_ACCOUNT_BALANCE', payload: { accountId: oldTransaction.bankAccountId, amount: -oldTransaction.amount } });
                }

                // 2. Apply new
                const newTransaction = { ...oldTransaction, ...updates };
                if (newTransaction.bankAccountId && newTransaction.type === 'expense') {
                    dispatch({ type: 'UPDATE_ACCOUNT_BALANCE', payload: { accountId: newTransaction.bankAccountId, amount: -newTransaction.amount } });
                } else if (newTransaction.bankAccountId && newTransaction.type === 'income') {
                    dispatch({ type: 'UPDATE_ACCOUNT_BALANCE', payload: { accountId: newTransaction.bankAccountId, amount: newTransaction.amount } });
                }
            }

            await updateTransaction(userId, transactionId, updates);
        },

        deleteTransaction: async (transactionId) => {
            const transaction = state.transactions.find(t => t.id === transactionId);
            if (!transaction) return;

            dispatch({ type: 'DELETE_TRANSACTION', payload: transactionId });

            // Revert balance
            if (transaction.bankAccountId && transaction.type === 'expense') {
                dispatch({ type: 'UPDATE_ACCOUNT_BALANCE', payload: { accountId: transaction.bankAccountId, amount: transaction.amount } });
            } else if (transaction.bankAccountId && transaction.type === 'income') {
                dispatch({ type: 'UPDATE_ACCOUNT_BALANCE', payload: { accountId: transaction.bankAccountId, amount: -transaction.amount } });
            }

            await deleteTransaction(userId, transactionId);
        },

        addGoal: async (goal) => {
            dispatch({ type: 'ADD_GOAL', payload: goal });
            // Save updated goals array to Firestore (Goals are part of the user document for now)
            await saveData({ goals: [...(state.goals || []), goal] });
        },

        updateGoal: async (goal) => {
            dispatch({ type: 'UPDATE_GOAL', payload: goal });
            const updatedGoals = (state.goals || []).map(g => g.id === goal.id ? goal : g);
            await saveData({ goals: updatedGoals });
        },

        deleteGoal: async (goalId) => {
            dispatch({ type: 'DELETE_GOAL', payload: goalId });
            const updatedGoals = (state.goals || []).filter(g => g.id !== goalId);
            await saveData({ goals: updatedGoals });
        },

        addInvestment: async (investment) => {
            const newInvestment = {
                ...investment,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
            };
            dispatch({ type: 'ADD_INVESTMENT', payload: newInvestment });
            await saveData({ investments: [...state.investments, newInvestment] });
            return newInvestment;
        },

        updateInvestment: async (investment) => {
            dispatch({ type: 'UPDATE_INVESTMENT', payload: investment });
            const updatedInvestments = state.investments.map(inv =>
                inv.id === investment.id ? investment : inv
            );
            await saveData({ investments: updatedInvestments });
        },

        deleteInvestment: async (investmentId) => {
            // Fix: remove from state.investments
            dispatch({ type: 'SET_INVESTMENTS', payload: state.investments.filter(inv => inv.id !== investmentId) });
            const updatedInvestments = state.investments.filter(inv => inv.id !== investmentId);
            await saveData({ investments: updatedInvestments });
        },

        completeOnboarding: async (data) => {
            const { bankAccounts, monthlyBudget, userName } = data;

            // Add bank accounts
            for (const account of bankAccounts) {
                const newAccount = {
                    ...account,
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    createdAt: new Date().toISOString(),
                };
                dispatch({ type: 'ADD_BANK_ACCOUNT', payload: newAccount });
            }

            // Update settings
            const settings = {
                monthlyBudget,
                userName,
                onboardingCompleted: true,
            };
            dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
            dispatch({ type: 'COMPLETE_ONBOARDING' });

            // Save to Firestore
            await saveUserFinanceData(userId, {
                settings: { ...state.settings, ...settings },
                bankAccounts: bankAccounts.map((acc, i) => ({
                    ...acc,
                    id: Date.now().toString() + i,
                    createdAt: new Date().toISOString(),
                })),
                transactions: [],
                investments: [],
                goals: [], // Initialize empty goals
            });

            setHasCompletedOnboarding(true);
        },

        toggleTheme: () => {
            const newTheme = state.settings.theme === 'dark' ? 'light' : 'dark';
            dispatch({ type: 'UPDATE_SETTINGS', payload: { theme: newTheme } });
            document.documentElement.setAttribute('data-theme', newTheme);
            saveData({ settings: { ...state.settings, theme: newTheme } });
        },
    };

    // Set theme on load
    useEffect(() => {
        if (state.settings.theme) {
            document.documentElement.setAttribute('data-theme', state.settings.theme);
        }
    }, [state.settings.theme]);

    // Calculate derived data
    // Calculate derived data
    const totalBalance = state.bankAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    const transactions = state.transactions || [];

    const todaysSpend = transactions
        .filter(tx => {
            const today = new Date().toDateString();
            const txDate = new Date(tx.date).toDateString();
            return txDate === today && tx.type === 'expense';
        })
        .reduce((sum, tx) => sum + tx.amount, 0);

    const monthlySpend = transactions
        .filter(tx => {
            const now = new Date();
            const txDate = new Date(tx.date);
            return txDate.getMonth() === now.getMonth() &&
                txDate.getFullYear() === now.getFullYear() &&
                tx.type === 'expense';
        })
        .reduce((sum, tx) => sum + tx.amount, 0);

    const currentMonthKey = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    const monthlyBudget = (state.settings.budgets && state.settings.budgets[currentMonthKey]) !== undefined
        ? state.settings.budgets[currentMonthKey]
        : state.settings.monthlyBudget;

    const monthlyBudgetRemaining = monthlyBudget - monthlySpend;

    const totalInvestments = (state.investments || []).reduce((sum, inv) => sum + (inv.currentValue || 0), 0);

    const totalSavedGoals = (state.goals || []).reduce((sum, g) => sum + (g.currentAmount || 0), 0);
    const totalGoalTarget = (state.goals || []).reduce((sum, g) => sum + (g.targetAmount || 0), 0);
    const savingsGoalProgress = totalGoalTarget > 0
        ? Math.min(100, Math.round((totalSavedGoals / totalGoalTarget) * 100))
        : 0;

    // Sort transactions by date descending
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentTransactions = sortedTransactions.slice(0, 10);

    const spendingByCategory = state.categories.map(cat => ({
        ...cat,
        amount: transactions
            .filter(tx => tx.categoryId === cat.id && tx.type === 'expense')
            .reduce((sum, tx) => sum + tx.amount, 0),
    })).filter(cat => cat.amount > 0);

    const derivedData = {
        totalBalance,
        todaysSpend,
        monthlySpend,
        monthlyBudgetRemaining,
        totalInvestments,
        totalSavedGoals,
        totalGoalTarget,
        savingsGoalProgress,
        recentTransactions,
        spendingByCategory
    };

    return (
        <FinanceContext.Provider value={{
            state,
            dispatch,
            actions,
            derivedData,
            hasCompletedOnboarding,
            userId
        }}>
            {children}
        </FinanceContext.Provider>
    );
}

export function useFinance() {
    const context = useContext(FinanceContext);
    if (!context) {
        throw new Error('useFinance must be used within a FinanceProvider');
    }
    return context;
}
