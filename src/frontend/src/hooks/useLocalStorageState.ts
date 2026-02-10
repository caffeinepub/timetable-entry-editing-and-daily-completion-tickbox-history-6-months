import { useState, useEffect } from 'react';

/**
 * Custom hook to persist state in localStorage with safe parsing and clamping for numeric values
 */
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
  options?: {
    min?: number;
    max?: number;
  }
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        
        // If options are provided and value is a number, clamp it to the valid range
        if (typeof parsed === 'number' && options) {
          const { min, max } = options;
          let clamped = parsed;
          if (min !== undefined && clamped < min) clamped = min;
          if (max !== undefined && clamped > max) clamped = max;
          return clamped as T;
        }
        
        return parsed;
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
    return defaultValue;
  });

  const setStateWithClamping = (value: T) => {
    // If options are provided and value is a number, clamp it before setting
    if (typeof value === 'number' && options) {
      const { min, max } = options;
      let clamped: number = value;
      if (min !== undefined && clamped < min) clamped = min;
      if (max !== undefined && clamped > max) clamped = max;
      setState(clamped as T);
    } else {
      setState(value);
    }
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setStateWithClamping];
}
