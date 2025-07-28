import { useEffect, useState, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

// Debounce utility (simple implementation to avoid lodash dependency)
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface AndroidKeyboardHookReturn {
  keyboardHeight: number;
  isVisible: boolean;
  isAndroid: boolean;
  getContainerStyle: (baseStyle?: React.CSSProperties, adjustment?: number) => React.CSSProperties;
}

export function useAndroidKeyboard(debounceMs: number = 50): AndroidKeyboardHookReturn {
  // SSR safety check
  if (typeof window === 'undefined') {
    return {
      keyboardHeight: 0,
      isVisible: false,
      isAndroid: false,
      getContainerStyle: (baseStyle: React.CSSProperties = {}) => ({
        ...baseStyle,
        transition: 'transform 0.1s ease-out',
      }),
    };
  }

  const isAndroid = Capacitor.getPlatform() === 'android';
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  // Use ref for initialHeight so it can be recalculated on orientation changes
  const initialHeightRef = useRef(window.innerHeight);

  // Recalculate initial height (for orientation changes)
  const resetInitialHeight = useCallback(() => {
    initialHeightRef.current = window.innerHeight;
  }, []);

  const detectKeyboard = useCallback(() => {
    const currentHeight = window.innerHeight;
    const initialHeight = initialHeightRef.current;
    let height = 0;
    
    // Method 1: VisualViewport API (most reliable)
    if (window.visualViewport) {
      height = initialHeight - window.visualViewport.height;
    } 
    // Method 2: Window resize fallback
    else {
      height = initialHeight - currentHeight;
    }

    // Only consider it a keyboard if height difference is significant
    if (height > 50) {
      setKeyboardHeight(height);
      setIsVisible(true);
      document.documentElement.style.setProperty('--android-keyboard-height', `${height}px`);
    } else {
      setKeyboardHeight(0);
      setIsVisible(false);
      document.documentElement.style.setProperty('--android-keyboard-height', '0px');
    }
  }, []);

  // Debounced version to prevent flooding React with state updates
  const debouncedDetectKeyboard = useRef(debounce(detectKeyboard, debounceMs)).current;

  const handleOrientationChange = useCallback(() => {
    resetInitialHeight();
    // Use immediate detection for orientation changes (not debounced)
    detectKeyboard();
  }, [resetInitialHeight, detectKeyboard]);

  // Simplified focus handlers - remove double state setting
  const handleFocusIn = useCallback((e: FocusEvent) => {
    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true')) {
      // Only use fallback if plugin isn't available
      if (!Capacitor.isPluginAvailable('Keyboard')) {
        const fallbackHeight = Math.floor(window.innerHeight * 0.35);
        setKeyboardHeight(fallbackHeight);
        setIsVisible(true);
        document.documentElement.style.setProperty('--android-keyboard-height', `${fallbackHeight}px`);
      }
    }
  }, []);

  const handleFocusOut = useCallback(() => {
    // Immediately clear keyboard state when focus leaves input
    setKeyboardHeight(0);
    setIsVisible(false);
    document.documentElement.style.setProperty('--android-keyboard-height', '0px');
  }, []);

  const handleResize = useCallback(() => {
    debouncedDetectKeyboard();
  }, [debouncedDetectKeyboard]);

  const handleVisualViewportResize = useCallback(() => {
    debouncedDetectKeyboard();
  }, [debouncedDetectKeyboard]);

  useEffect(() => {
    if (!isAndroid) return;

    let keyboardShowCleanup: (() => void) | undefined;
    let keyboardHideCleanup: (() => void) | undefined;

    // Setup Capacitor keyboard listeners (if available)
    const setupCapacitorKeyboard = async () => {
      if (Capacitor.isPluginAvailable('Keyboard')) {
        try {
          const keyboardWillShowListener = await Keyboard.addListener('keyboardWillShow', (info) => {
            const height = info.keyboardHeight || 300;
            setKeyboardHeight(height);
            setIsVisible(true);
            document.documentElement.style.setProperty('--android-keyboard-height', `${height}px`);
          });

          const keyboardWillHideListener = await Keyboard.addListener('keyboardWillHide', () => {
            setKeyboardHeight(0);
            setIsVisible(false);
            document.documentElement.style.setProperty('--android-keyboard-height', '0px');
          });

          keyboardShowCleanup = () => keyboardWillShowListener.remove();
          keyboardHideCleanup = () => keyboardWillHideListener.remove();
        } catch (error) {
          console.error('[Android Keyboard] Error setting up Capacitor Keyboard:', error);
        }
      }
    };

    // Add event listeners with proper cleanup references
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportResize);
    }
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    // Setup Capacitor keyboard listeners
    setupCapacitorKeyboard();

    // Initial measurement
    resetInitialHeight();
    detectKeyboard();

    return () => {
      // Cleanup Capacitor listeners
      keyboardShowCleanup?.();
      keyboardHideCleanup?.();
      
      // Cleanup DOM listeners (using same function references)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportResize);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [isAndroid, handleVisualViewportResize, handleResize, handleOrientationChange, handleFocusIn, handleFocusOut, resetInitialHeight, detectKeyboard]);

  // Centralized container style for keyboard adjustments
  const getContainerStyle = useCallback((
    baseStyle: React.CSSProperties = {},
    adjustment: number = 40
  ): React.CSSProperties => {
    if (isAndroid && isVisible && keyboardHeight > 0) {
      const adjustedTransform = Math.max(0, keyboardHeight - adjustment);
      return {
        ...baseStyle,
        transform: `translateY(-${adjustedTransform}px)`,
        transition: 'transform 0.1s ease-out',
      };
    }
    
    return {
      ...baseStyle,
      transition: 'transform 0.1s ease-out',
    };
  }, [isAndroid, isVisible, keyboardHeight]);

  return { keyboardHeight, isVisible, isAndroid, getContainerStyle };
} 