// Firestore Database Service for Tasks and Completion Data
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    onSnapshot
} from 'firebase/firestore';
import { db } from './config';

/**
 * Get user document reference
 * @param {string} userId - User ID
 * @returns {DocumentReference} Firestore document reference
 */
function getUserDocRef(userId) {
    return doc(db, 'users', userId);
}

/**
 * Format month key (YYYY-MM)
 * @param {number} year 
 * @param {number} month 
 * @returns {string}
 */
export function formatMonthKey(year, month) {
    return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/**
 * Get previous month key
 * @param {number} year 
 * @param {number} month 
 * @returns {string}
 */
export function getPreviousMonthKey(year, month) {
    if (month === 0) {
        return formatMonthKey(year - 1, 11);
    }
    return formatMonthKey(year, month - 1);
}

/**
 * Initialize user data in Firestore (if doesn't exist)
 * @param {string} userId - User ID
 */
export async function initializeUserData(userId) {
    const userRef = getUserDocRef(userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        // Create new user document with empty data structure
        await setDoc(userRef, {
            monthlyTasks: {},  // { "2026-01": [{ id, name, days }], ... }
            completionData: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        return { monthlyTasks: {}, completionData: {} };
    }

    return userSnap.data();
}

/**
 * Get user data from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User data
 */
export async function getUserData(userId) {
    const userRef = getUserDocRef(userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return userSnap.data();
    }

    return null;
}

/**
 * Get tasks for a specific month
 * @param {string} userId - User ID
 * @param {string} monthKey - Month key (YYYY-MM)
 * @returns {Promise<Array>} Tasks for the month
 */
export async function getMonthTasks(userId, monthKey) {
    const userData = await getUserData(userId);
    if (userData && userData.monthlyTasks && userData.monthlyTasks[monthKey]) {
        return userData.monthlyTasks[monthKey];
    }
    return null; // null means no tasks set for this month yet
}

/**
 * Update tasks for a specific month in Firestore
 * @param {string} userId - User ID
 * @param {string} monthKey - Month key (YYYY-MM)
 * @param {Array} tasks - Tasks array for the month
 */
export async function updateMonthTasks(userId, monthKey, tasks) {
    const userRef = getUserDocRef(userId);
    const userData = await getUserData(userId);

    const monthlyTasks = userData?.monthlyTasks || {};
    monthlyTasks[monthKey] = tasks;

    await updateDoc(userRef, {
        monthlyTasks,
        updatedAt: new Date().toISOString()
    });
}

/**
 * Copy tasks from one month to another
 * @param {string} userId - User ID
 * @param {string} sourceMonthKey - Source month key
 * @param {string} targetMonthKey - Target month key
 * @param {Array} selectedTaskIds - IDs of tasks to copy (optional, copies all if not provided)
 * @param {number} daysInMonth - Number of days in target month
 * @returns {Promise<Array>} Copied tasks
 */
export async function copyTasksToMonth(userId, sourceMonthKey, targetMonthKey, selectedTaskIds = null, daysInMonth = 31) {
    const userData = await getUserData(userId);
    const sourceTasks = userData?.monthlyTasks?.[sourceMonthKey] || [];

    // Filter tasks if specific IDs provided
    const tasksToCopy = selectedTaskIds
        ? sourceTasks.filter(t => selectedTaskIds.includes(t.id))
        : sourceTasks;

    // Create new tasks with new IDs for the target month
    const copiedTasks = tasksToCopy.map(task => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: task.name,
        days: task.days ? task.days.filter(d => d <= daysInMonth) : Array.from({ length: daysInMonth }, (_, i) => i + 1),
        createdFromPreviousMonth: true,
        sourceMonth: sourceMonthKey
    }));

    await updateMonthTasks(userId, targetMonthKey, copiedTasks);
    return copiedTasks;
}

/**
 * Update completion data in Firestore
 * @param {string} userId - User ID
 * @param {Object} completionData - Updated completion data
 */
export async function updateCompletionData(userId, completionData) {
    const userRef = getUserDocRef(userId);
    await updateDoc(userRef, {
        completionData,
        updatedAt: new Date().toISOString()
    });
}

/**
 * Subscribe to real-time updates for user data
 * @param {string} userId - User ID
 * @param {Function} callback - Called with updated data
 * @returns {Function} Unsubscribe function
 */
export function subscribeToUserData(userId, callback) {
    const userRef = getUserDocRef(userId);

    return onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data());
        }
    }, (error) => {
        console.error('Error listening to user data:', error);
    });
}

/**
 * Check if tasks exist for a month
 * @param {Object} monthlyTasks - All monthly tasks
 * @param {string} monthKey - Month key to check
 * @returns {boolean}
 */
export function hasTasksForMonth(monthlyTasks, monthKey) {
    return monthlyTasks && monthlyTasks[monthKey] && monthlyTasks[monthKey].length > 0;
}

// Legacy support: Migrate old tasks format to new monthly format
export async function migrateOldTasks(userId, year, month) {
    const userData = await getUserData(userId);

    // If user has old 'tasks' array but no monthlyTasks
    if (userData && userData.tasks && Array.isArray(userData.tasks) && (!userData.monthlyTasks || Object.keys(userData.monthlyTasks).length === 0)) {
        const monthKey = formatMonthKey(year, month);
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Convert old tasks to new format with all days selected
        const migratedTasks = userData.tasks.map(task => ({
            id: task.id,
            name: task.name,
            days: Array.from({ length: daysInMonth }, (_, i) => i + 1),
            createdFromPreviousMonth: false
        }));

        await updateMonthTasks(userId, monthKey, migratedTasks);
        return migratedTasks;
    }

    return null;
}
