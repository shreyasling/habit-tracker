import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for persisting state in localStorage
 * @param {string} key - The localStorage key
 * @param {any} initialValue - The initial value if no stored value exists
 * @returns {[any, Function, Function]} - [value, setValue, removeValue]
 */
export function useLocalStorage(key, initialValue) {
    // Get stored value or use initial value
    const readValue = useCallback(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    }, [key, initialValue]);

    const [storedValue, setStoredValue] = useState(readValue);

    // Return a wrapped version of useState's setter function that persists to localStorage
    const setValue = useCallback((value) => {
        try {
            // Allow value to be a function for same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));

            // Dispatch custom event for cross-tab synchronization
            window.dispatchEvent(new StorageEvent('storage', {
                key,
                newValue: JSON.stringify(valueToStore),
            }));
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    // Remove value from localStorage
    const removeValue = useCallback(() => {
        try {
            window.localStorage.removeItem(key);
            setStoredValue(initialValue);
        } catch (error) {
            console.warn(`Error removing localStorage key "${key}":`, error);
        }
    }, [key, initialValue]);

    // Listen for changes in other tabs/windows
    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key === key && event.newValue !== null) {
                try {
                    setStoredValue(JSON.parse(event.newValue));
                } catch {
                    setStoredValue(event.newValue);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key]);

    return [storedValue, setValue, removeValue];
}

export default useLocalStorage;
