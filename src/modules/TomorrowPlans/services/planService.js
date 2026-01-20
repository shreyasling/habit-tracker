/**
 * Firebase service for Tomorrow Plans module
 * Handles CRUD operations for daily plans
 */

import { db } from '../../../firebase/config';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy
} from 'firebase/firestore';

// Format date key for Firestore (YYYY-MM-DD)
export const formatDateKey = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Get month key for querying (YYYY-MM)
export const getMonthKey = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Get a daily plan for a specific date
 */
export const getDailyPlan = async (userId, date) => {
    const dateKey = formatDateKey(date);
    const planRef = doc(db, 'users', userId, 'dailyPlans', dateKey);

    const planSnap = await getDoc(planRef);
    if (planSnap.exists()) {
        return { id: planSnap.id, ...planSnap.data() };
    }
    return null;
};

/**
 * Save or update a daily plan
 */
export const saveDailyPlan = async (userId, date, planData) => {
    const dateKey = formatDateKey(date);
    const planRef = doc(db, 'users', userId, 'dailyPlans', dateKey);

    const data = {
        ...planData,
        dateKey,
        updatedAt: new Date().toISOString()
    };

    await setDoc(planRef, data, { merge: true });
    return { id: dateKey, ...data };
};

/**
 * Update a specific task in a daily plan
 */
export const updateTask = async (userId, date, taskId, updates) => {
    const plan = await getDailyPlan(userId, date);
    if (!plan || !plan.tasks) return null;

    const updatedTasks = plan.tasks.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
    );

    return saveDailyPlan(userId, date, { ...plan, tasks: updatedTasks });
};

/**
 * Delete a task from a daily plan
 */
export const deleteTask = async (userId, date, taskId) => {
    const plan = await getDailyPlan(userId, date);
    if (!plan || !plan.tasks) return null;

    const updatedTasks = plan.tasks.filter(task => task.id !== taskId);
    return saveDailyPlan(userId, date, { ...plan, tasks: updatedTasks });
};

/**
 * Add a task to a daily plan
 */
export const addTask = async (userId, date, task) => {
    const plan = await getDailyPlan(userId, date) || { tasks: [] };
    const newTask = {
        ...task,
        id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
        status: 'not-started',
        notificationEnabled: true
    };

    const updatedTasks = [...(plan.tasks || []), newTask];
    return saveDailyPlan(userId, date, { ...plan, tasks: updatedTasks });
};

/**
 * Get plans for a month (for calendar view)
 */
export const getMonthPlans = async (userId, year, month) => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const startKey = formatDateKey(startDate);
    const endKey = formatDateKey(endDate);

    const plansRef = collection(db, 'users', userId, 'dailyPlans');
    const q = query(
        plansRef,
        where('dateKey', '>=', startKey),
        where('dateKey', '<=', endKey)
    );

    const snapshot = await getDocs(q);
    const plans = {};
    snapshot.forEach(doc => {
        plans[doc.id] = { id: doc.id, ...doc.data() };
    });

    return plans;
};

/**
 * Move unfinished tasks from one day to another
 */
export const moveUnfinishedTasks = async (userId, fromDate, toDate) => {
    const fromPlan = await getDailyPlan(userId, fromDate);
    if (!fromPlan || !fromPlan.tasks) return [];

    // Get unfinished tasks
    const unfinishedTasks = fromPlan.tasks.filter(task =>
        task.status !== 'completed'
    );

    if (unfinishedTasks.length === 0) return [];

    // Get or create destination plan
    const toPlan = await getDailyPlan(userId, toDate) || { tasks: [] };

    // Create new tasks for destination (with new IDs and reset status)
    const movedTasks = unfinishedTasks.map(task => ({
        ...task,
        id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        status: 'not-started',
        movedFrom: formatDateKey(fromDate),
        createdAt: new Date().toISOString()
    }));

    // Save moved tasks to destination
    await saveDailyPlan(userId, toDate, {
        ...toPlan,
        tasks: [...(toPlan.tasks || []), ...movedTasks]
    });

    return movedTasks;
};

/**
 * Get task statistics for a day
 */
export const getDayStats = (tasks) => {
    if (!tasks || tasks.length === 0) {
        return { total: 0, completed: 0, partial: 0, tried: 0, notStarted: 0 };
    }

    return {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        partial: tasks.filter(t => t.status === 'partial').length,
        tried: tasks.filter(t => t.status === 'tried').length,
        notStarted: tasks.filter(t => t.status === 'not-started').length
    };
};
