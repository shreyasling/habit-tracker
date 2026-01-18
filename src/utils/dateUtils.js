/**
 * Get the number of days in a specific month
 * @param {number} year - The year
 * @param {number} month - The month (0-indexed)
 * @returns {number} - Number of days in the month
 */
export function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * Get month name from month index
 * @param {number} month - The month (0-indexed)
 * @returns {string} - Month name
 */
export function getMonthName(month) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
}

/**
 * Get short month name from month index
 * @param {number} month - The month (0-indexed)
 * @returns {string} - Short month name
 */
export function getShortMonthName(month) {
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month];
}

/**
 * Get day name from date
 * @param {number} year - The year
 * @param {number} month - The month (0-indexed)
 * @param {number} day - The day
 * @returns {string} - Day name
 */
export function getDayName(year, month, day) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[new Date(year, month, day).getDay()];
}

/**
 * Check if a date is today
 * @param {number} year - The year
 * @param {number} month - The month (0-indexed)
 * @param {number} day - The day
 * @returns {boolean} - Whether the date is today
 */
export function isToday(year, month, day) {
    const today = new Date();
    return (
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === day
    );
}

/**
 * Check if a date is in the past
 * @param {number} year - The year
 * @param {number} month - The month (0-indexed)
 * @param {number} day - The day
 * @returns {boolean} - Whether the date is in the past
 */
export function isPast(year, month, day) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(year, month, day);
    return date < today;
}

/**
 * Check if a date is in the future
 * @param {number} year - The year
 * @param {number} month - The month (0-indexed)
 * @param {number} day - The day
 * @returns {boolean} - Whether the date is in the future
 */
export function isFuture(year, month, day) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(year, month, day);
    return date > today;
}

/**
 * Format a date key for storage
 * @param {number} year - The year
 * @param {number} month - The month (0-indexed)
 * @param {number} day - The day
 * @returns {string} - Formatted date key (YYYY-MM-DD)
 */
export function formatDateKey(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Get an array of days for a month
 * @param {number} year - The year
 * @param {number} month - The month (0-indexed)
 * @returns {number[]} - Array of day numbers
 */
export function getDaysArray(year, month) {
    const daysInMonth = getDaysInMonth(year, month);
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
}

/**
 * Get the current date information
 * @returns {Object} - { year, month, day }
 */
export function getCurrentDate() {
    const now = new Date();
    return {
        year: now.getFullYear(),
        month: now.getMonth(),
        day: now.getDate()
    };
}

/**
 * Navigate to previous month
 * @param {number} year - Current year
 * @param {number} month - Current month (0-indexed)
 * @returns {Object} - { year, month }
 */
export function getPreviousMonth(year, month) {
    if (month === 0) {
        return { year: year - 1, month: 11 };
    }
    return { year, month: month - 1 };
}

/**
 * Navigate to next month
 * @param {number} year - Current year
 * @param {number} month - Current month (0-indexed)
 * @returns {Object} - { year, month }
 */
export function getNextMonth(year, month) {
    if (month === 11) {
        return { year: year + 1, month: 0 };
    }
    return { year, month: month + 1 };
}
