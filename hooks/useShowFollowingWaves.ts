import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'show_following_waves';

/**
 * Hook to manage showing following waves preference
 * Uses localStorage to persist the setting
 * Maintains reactivity across multiple components
 * @returns [showFollowingWaves, setShowFollowingWaves] - Current value and setter function
 */
export function useShowFollowingWaves(): [boolean, (value: boolean) => void] {
  // Get initial value from localStorage or use default (false)
  const getStoredValue = (): boolean => {
    if (typeof window === 'undefined') {
      return false; // Default value for SSR
    }
    
    try {
      const storedValue = localStorage.getItem(STORAGE_KEY);
      return storedValue === 'true';
    } catch (error) {
      // In case of localStorage errors (private browsing etc.)
      console.error('Error accessing localStorage:', error);
      return false;
    }
  };

  // Initialize state with value from localStorage
  const [stateValue, setStateValue] = useState<boolean>(getStoredValue);

  // Update localStorage and state when the value changes
  const setShowFollowingWaves = useCallback((value: boolean) => {
    if (typeof window === 'undefined') return;
    
    try {
      // Update localStorage
      localStorage.setItem(STORAGE_KEY, String(value));
      
      // Update state
      setStateValue(value);
      
      // Dispatch a custom event to notify other instances
      window.dispatchEvent(new CustomEvent('following-waves-change', { 
        detail: { value } 
      }));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, []);

  // Listen for changes from other components
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setStateValue(event.newValue === 'true');
      }
    };

    // Listen for the custom event from other hook instances
    const handleCustomEvent = (event: CustomEvent<{ value: boolean }>) => {
      setStateValue(event.detail.value);
    };

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('following-waves-change', handleCustomEvent as EventListener);

    // Clean up
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('following-waves-change', handleCustomEvent as EventListener);
    };
  }, []);

  return [stateValue, setShowFollowingWaves];
}
