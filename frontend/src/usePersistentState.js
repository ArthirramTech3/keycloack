// usePersistentState.js
import { useState, useEffect } from 'react';

function usePersistentState(key, initialValue) {
    // 1. Initialize state from localStorage or use initialValue
    const [state, setState] = useState(() => {
        try {
            const storedValue = localStorage.getItem(key);
            return storedValue ? JSON.parse(storedValue) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // 2. Update localStorage whenever the state changes
    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(`Error writing localStorage key "${key}":`, error);
        }
    }, [key, state]);

    return [state, setState];
}

export default usePersistentState;