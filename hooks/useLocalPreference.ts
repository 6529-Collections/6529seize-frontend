import { useState, useEffect } from 'react';

/**
 * A hook for managing user preferences stored in localStorage
 * 
 * @param key The localStorage key to use
 * @param defaultValue The default value to use if no preference is found
 * @param validator Optional function to validate stored value
 * @returns [preference, updatePreference] - current preference value and function to update it
 */
function useLocalPreference<T>(
  key: string,
  defaultValue: T,
  validator?: (value: any) => boolean
): [T, (newValue: T) => void] {
  // Initialize state with a function to avoid unnecessary localStorage lookups
  const [preference, setPreference] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue; // Return default during SSR
    }

    try {
      // Try to get the value from localStorage
      const storedValue = localStorage.getItem(key);
      
      // If there's no stored value, return the default
      if (storedValue === null) return defaultValue;
      
      // Parse the stored value
      const parsedValue = JSON.parse(storedValue);
      
      // If a validator is provided, check if the value is valid
      if (validator && !validator(parsedValue)) return defaultValue;
      
      return parsedValue;
    } catch (e) {
      // If there's an error reading from localStorage, return the default
      console.warn(`Error reading ${key} from localStorage:`, e);
      return defaultValue;
    }
  });
  

  // Listen for storage events from other tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        try {
          const newValue = JSON.parse(event.newValue);
          // Apply validator if it exists
          if (validator && !validator(newValue)) {
            return;
          }
          setPreference(newValue);
        } catch (e) {
          console.warn(`Error processing storage event:`, e);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, validator, setPreference]);

  // Renamed wrapper function that updates state and localStorage
  const updatePreference = (newValue: T) => {
    if (typeof window === 'undefined') {
      setPreference(newValue);
      return;
    }

    try {
      // Save to state
      setPreference(newValue);
      
      // Save to localStorage
      localStorage.setItem(key, JSON.stringify(newValue));
    } catch (e) {
      // If there's an error writing to localStorage, just update the state
      console.warn(`Error writing ${key} to localStorage:`, e);
      setPreference(newValue);
    }
  };

  return [preference, updatePreference];
}

export default useLocalPreference;