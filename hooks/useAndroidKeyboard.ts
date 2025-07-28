import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

export function useAndroidKeyboard() {
  const isAndroid = Capacitor.getPlatform() === 'android';
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isVisible, setIsVisible] = useState(false);


  useEffect(() => {
    if (!isAndroid) return;
    let initialHeight = window.innerHeight;
    let timer: number;
    let capacitorListenersAdded = false;

    const detectKeyboard = () => {
      const currentHeight = window.innerHeight;
      const vvHeight = window.visualViewport?.height || currentHeight;
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
      } else {
        setKeyboardHeight(0);
        setIsVisible(false);
      }

      // Set CSS custom property for use in styles
      document.documentElement.style.setProperty('--android-keyboard-height', `${Math.max(0, height)}px`);
    };

    const handleFocusIn = (e: FocusEvent) => {
      // Immediate synchronous detection for first-time responsiveness
      detectKeyboard();
      
      // Immediate fallback for input elements if no height detected
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true')) {
        if (keyboardHeight === 0) {
          const fallbackHeight = Math.floor(window.innerHeight * 0.35);
          setKeyboardHeight(fallbackHeight);
          setIsVisible(true);
          document.documentElement.style.setProperty('--android-keyboard-height', `${fallbackHeight}px`);
        }
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        setKeyboardHeight(0);
        setIsVisible(false);
        document.documentElement.style.setProperty('--android-keyboard-height', '0px');
      }, 100);
    };

    const handleResize = () => {
      detectKeyboard();
    };

    const handleVisualViewportResize = () => {
      detectKeyboard();
    };

    // Method 1: Try Capacitor Keyboard plugin (most reliable for Capacitor apps)
    const setupCapacitorKeyboard = async () => {
      try {
        console.log('[Android Keyboard] Setting up Capacitor Keyboard plugin');
        
        // Check if Keyboard plugin is available
        if (Capacitor.isPluginAvailable('Keyboard')) {
          console.log('[Android Keyboard] Capacitor Keyboard plugin available');
          
          const keyboardWillShowListener = await Keyboard.addListener('keyboardWillShow', (info) => {
            console.log('[Android Keyboard] Capacitor keyboardWillShow:', info);
            const height = info.keyboardHeight || 300; // fallback height
            setKeyboardHeight(height);
            setIsVisible(true);
            document.documentElement.style.setProperty('--android-keyboard-height', `${height}px`);
          });

          const keyboardWillHideListener = await Keyboard.addListener('keyboardWillHide', () => {
            console.log('[Android Keyboard] Capacitor keyboardWillHide');
            setKeyboardHeight(0);
            setIsVisible(false);
            document.documentElement.style.setProperty('--android-keyboard-height', '0px');
          });

          capacitorListenersAdded = true;
          console.log('[Android Keyboard] Capacitor listeners added successfully');
          
          return () => {
            keyboardWillShowListener.remove();
            keyboardWillHideListener.remove();
          };
        } else {
          console.log('[Android Keyboard] Capacitor Keyboard plugin NOT available');
          return null;
        }
      } catch (error) {
        console.log('[Android Keyboard] Error setting up Capacitor Keyboard:', error);
        return null;
      }
    };

    // Add event listeners
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportResize);
    }
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', detectKeyboard);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    // Setup Capacitor keyboard listeners
    let capacitorCleanup: (() => void) | null = null;
    setupCapacitorKeyboard().then((cleanup) => {
      capacitorCleanup = cleanup;
    });

    // Run initial detection
    detectKeyboard();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportResize);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', detectKeyboard);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      clearTimeout(timer);
      
      // Clean up Capacitor listeners
      if (capacitorCleanup) {
        capacitorCleanup();
      }
    };
  }, [isAndroid]);

  // Centralized container style for keyboard adjustments
  const getContainerStyle = (baseStyle: React.CSSProperties = {}, adjustment: number = 40): React.CSSProperties => {
    if (isAndroid && isVisible && keyboardHeight > 0) {
      const adjustedTransform = Math.max(0, keyboardHeight - adjustment);
      return {
        ...baseStyle,
        transform: `translateY(-${adjustedTransform}px)`,
        transition: 'transform 0.15s ease-out',
      };
    }
    
    return {
      ...baseStyle,
      transition: 'transform 0.15s ease-out',
    };
  };

  return { keyboardHeight, isVisible, isAndroid, getContainerStyle };
} 