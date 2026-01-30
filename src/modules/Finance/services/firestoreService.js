import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    deleteDoc,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { db } from '../../../firebase/config';

const FINANCE_COLLECTION = 'financeData';

// Get user's finance data
export async function getUserFinanceData(userId) {
    try {
        const docRef = doc(db, FINANCE_COLLECTION, userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        console.error('Error getting finance data:', error);
        throw error;
    }
}

// Save user's finance data
export async function saveUserFinanceData(userId, data) {
    try {
        const docRef = doc(db, FINANCE_COLLECTION, userId);
        await setDoc(docRef, data, { merge: true });
    } catch (error) {
        console.error('Error saving finance data:', error);
        throw error;
    }
}

// Add a bank account
export async function addBankAccount(userId, account) {
    try {
        const docRef = doc(db, FINANCE_COLLECTION, userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const currentData = docSnap.data();
            const bankAccounts = currentData.bankAccounts || [];
            await updateDoc(docRef, {
                bankAccounts: [...bankAccounts, account]
            });
        } else {
            await setDoc(docRef, {
                bankAccounts: [account],
                transactions: [],
                investments: [],
                settings: {}
            });
        }
    } catch (error) {
        console.error('Error adding bank account:', error);
        throw error;
    }
}

// Update a bank account
export async function updateBankAccount(userId, accountId, updates) {
    try {
        const docRef = doc(db, FINANCE_COLLECTION, userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const currentData = docSnap.data();
            const bankAccounts = currentData.bankAccounts || [];
            const updatedAccounts = bankAccounts.map(acc =>
                acc.id === accountId ? { ...acc, ...updates } : acc
            );
            await updateDoc(docRef, { bankAccounts: updatedAccounts });
        }
    } catch (error) {
        console.error('Error updating bank account:', error);
        throw error;
    }
}

// Delete a bank account
export async function deleteBankAccount(userId, accountId) {
    try {
        const docRef = doc(db, FINANCE_COLLECTION, userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const currentData = docSnap.data();
            const bankAccounts = currentData.bankAccounts || [];
            const filteredAccounts = bankAccounts.filter(acc => acc.id !== accountId);
            await updateDoc(docRef, { bankAccounts: filteredAccounts });
        }
    } catch (error) {
        console.error('Error deleting bank account:', error);
        throw error;
    }
}

// Add a transaction
export async function addTransaction(userId, transaction) {
    try {
        const docRef = doc(db, FINANCE_COLLECTION, userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const currentData = docSnap.data();
            const transactions = currentData.transactions || [];
            const bankAccounts = currentData.bankAccounts || [];

            // Update bank account balance if applicable
            let updatedAccounts = bankAccounts;
            if (transaction.bankAccountId) {
                updatedAccounts = bankAccounts.map(acc => {
                    if (acc.id === transaction.bankAccountId) {
                        const balanceChange = transaction.type === 'expense'
                            ? -transaction.amount
                            : transaction.amount;
                        return { ...acc, balance: (acc.balance || 0) + balanceChange };
                    }
                    return acc;
                });
            }

            await updateDoc(docRef, {
                transactions: [transaction, ...transactions],
                bankAccounts: updatedAccounts
            });
        } else {
            await setDoc(docRef, {
                transactions: [transaction],
                bankAccounts: [],
                investments: [],
                settings: {}
            });
        }
    } catch (error) {
        console.error('Error adding transaction:', error);
        throw error;
    }
}

// Update a transaction
export async function updateTransaction(userId, transactionId, updates) {
    try {
        const docRef = doc(db, FINANCE_COLLECTION, userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const currentData = docSnap.data();
            const transactions = currentData.transactions || [];
            const bankAccounts = currentData.bankAccounts || [];

            const oldTransaction = transactions.find(tx => tx.id === transactionId);
            if (!oldTransaction) throw new Error("Transaction not found");

            let updatedAccounts = [...bankAccounts];

            // If amount, type, or bank account changed, update balances
            if (updates.amount !== undefined || updates.type || updates.bankAccountId) {
                // 1. Revert old transaction effect
                if (oldTransaction.bankAccountId) {
                    updatedAccounts = updatedAccounts.map(acc => {
                        if (acc.id === oldTransaction.bankAccountId) {
                            const reverseChange = oldTransaction.type === 'expense'
                                ? oldTransaction.amount // Add back expense
                                : -oldTransaction.amount; // Remove income
                            return { ...acc, balance: (acc.balance || 0) + reverseChange };
                        }
                        return acc;
                    });
                }

                // 2. Apply new transaction effect
                const newTransaction = { ...oldTransaction, ...updates };
                if (newTransaction.bankAccountId) {
                    updatedAccounts = updatedAccounts.map(acc => {
                        if (acc.id === newTransaction.bankAccountId) {
                            const newChange = newTransaction.type === 'expense'
                                ? -newTransaction.amount
                                : newTransaction.amount;
                            return { ...acc, balance: (acc.balance || 0) + newChange };
                        }
                        return acc;
                    });
                }
            }

            const updatedTransactions = transactions.map(tx =>
                tx.id === transactionId ? { ...tx, ...updates } : tx
            );

            await updateDoc(docRef, {
                transactions: updatedTransactions,
                bankAccounts: updatedAccounts
            });
        }
    } catch (error) {
        console.error('Error updating transaction:', error);
        throw error;
    }
}

// Delete a transaction
export async function deleteTransaction(userId, transactionId) {
    try {
        const docRef = doc(db, FINANCE_COLLECTION, userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const currentData = docSnap.data();
            const transactions = currentData.transactions || [];
            const bankAccounts = currentData.bankAccounts || [];

            const transactionToDelete = transactions.find(tx => tx.id === transactionId);
            if (!transactionToDelete) return;

            // Revert balance effect
            let updatedAccounts = [...bankAccounts];
            if (transactionToDelete.bankAccountId) {
                updatedAccounts = updatedAccounts.map(acc => {
                    if (acc.id === transactionToDelete.bankAccountId) {
                        const reverseChange = transactionToDelete.type === 'expense'
                            ? transactionToDelete.amount
                            : -transactionToDelete.amount;
                        return { ...acc, balance: (acc.balance || 0) + reverseChange };
                    }
                    return acc;
                });
            }

            const updatedTransactions = transactions.filter(tx => tx.id !== transactionId);

            await updateDoc(docRef, {
                transactions: updatedTransactions,
                bankAccounts: updatedAccounts
            });
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        throw error;
    }
}

// Get transactions for a specific date range
export async function getTransactionsByDateRange(userId, startDate, endDate) {
    try {
        const docRef = doc(db, FINANCE_COLLECTION, userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const transactions = data.transactions || [];

            return transactions.filter(tx => {
                const txDate = new Date(tx.date);
                return txDate >= new Date(startDate) && txDate <= new Date(endDate);
            });
        }
        return [];
    } catch (error) {
        console.error('Error getting transactions by date range:', error);
        throw error;
    }
}

// Add investment
export async function addInvestment(userId, investment) {
    try {
        const docRef = doc(db, FINANCE_COLLECTION, userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const currentData = docSnap.data();
            const investments = currentData.investments || [];
            await updateDoc(docRef, {
                investments: [...investments, investment]
            });
        }
    } catch (error) {
        console.error('Error adding investment:', error);
        throw error;
    }
}

// Update investment
export async function updateInvestment(userId, investmentId, updates) {
    try {
        const docRef = doc(db, FINANCE_COLLECTION, userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const currentData = docSnap.data();
            const investments = currentData.investments || [];
            const updatedInvestments = investments.map(inv =>
                inv.id === investmentId ? { ...inv, ...updates } : inv
            );
            await updateDoc(docRef, { investments: updatedInvestments });
        }
    } catch (error) {
        console.error('Error updating investment:', error);
        throw error;
    }
}
