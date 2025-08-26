"use client"

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
  // All hooks must be called before any conditional logic
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const initialHeightRef = useRef(typeof window !== 'undefined' ? window.innerHeight : 0);

  // SSR safety check after hooks are declared
  const isSSR = typeof window === 'undefined';
  const isAndroid = !isSSR && Capacitor.getPlatform() === 'android';

  // Recalculate initial height (for orientation changes)
  const resetInitialHeight = useCallback(() => {
    if (isSSR) return;
    initialHeightRef.current = window.innerHeight;
  }, [isSSR]);

  const detectKeyboard = useCallback(() => {
    if (isSSR) return;
    
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
  }, [isSSR]);

  // Debounced version to prevent flooding React with state updates
  const debouncedDetectKeyboard = useRef(debounce(detectKeyboard, debounceMs)).current;

  const handleOrientationChange = useCallback(() => {
    if (isSSR) return;
    resetInitialHeight();
    // Use immediate detection for orientation changes (not debounced)
    detectKeyboard();
  }, [isSSR, resetInitialHeight, detectKeyboard]);

  // Simplified focus handlers - remove double state setting
  const handleFocusIn = useCallback((e: FocusEvent) => {
    if (isSSR) return;
    
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
  }, [isSSR]);

  const handleFocusOut = useCallback(() => {
    if (isSSR) return;
    
    // Immediately clear keyboard state when focus leaves input
    setKeyboardHeight(0);
    setIsVisible(false);
    document.documentElement.style.setProperty('--android-keyboard-height', '0px');
  }, [isSSR]);

  const handleResize = useCallback(() => {
    if (isSSR) return;
    debouncedDetectKeyboard();
  }, [isSSR, debouncedDetectKeyboard]);

  const handleVisualViewportResize = useCallback(() => {
    if (isSSR) return;
    debouncedDetectKeyboard();
  }, [isSSR, debouncedDetectKeyboard]);

  useEffect(() => {
    if (isSSR || !isAndroid) return;

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
  }, [isSSR, isAndroid, handleVisualViewportResize, handleResize, handleOrientationChange, handleFocusIn, handleFocusOut, resetInitialHeight, detectKeyboard]);

  // Centralized container style for keyboard adjustments
  const getContainerStyle = useCallback((
    baseStyle: React.CSSProperties = {},
    adjustment: number = 40
  ): React.CSSProperties => {
    if (isSSR || !isAndroid || !isVisible || keyboardHeight <= 0) {
      return {
        ...baseStyle,
        transition: 'transform 0.1s ease-out',
      };
    }
    
    const adjustedTransform = Math.max(0, keyboardHeight - adjustment);
    return {
      ...baseStyle,
      transform: `translateY(-${adjustedTransform}px)`,
      transition: 'transform 0.1s ease-out',
    };
  }, [isSSR, isAndroid, isVisible, keyboardHeight]);

  return { keyboardHeight, isVisible, isAndroid, getContainerStyle };
} 