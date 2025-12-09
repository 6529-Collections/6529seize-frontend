"use client"

import { useEffect, useState, useCallback, type CSSProperties } from 'react';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

interface AndroidKeyboardHookReturn {
  keyboardHeight: number;
  isVisible: boolean;
  isAndroid: boolean;
  getContainerStyle: (baseStyle?: CSSProperties, adjustment?: number) => CSSProperties;
}

export function useAndroidKeyboard(): AndroidKeyboardHookReturn {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const isSSR = typeof window === 'undefined';
  const isAndroid = !isSSR && Capacitor.getPlatform() === 'android';

  useEffect(() => {
    if (isSSR || !isAndroid) return;

    let mounted = true;
    let showCleanup: (() => void) | undefined;
    let hideCleanup: (() => void) | undefined;

    const setupKeyboardListeners = async () => {
      if (!Capacitor.isPluginAvailable('Keyboard')) return;

      try {
        const showListener = await Keyboard.addListener('keyboardWillShow', (info) => {
          const height = info.keyboardHeight ?? 300;
          setKeyboardHeight(height);
          setIsVisible(true);
          document.documentElement.style.setProperty('--android-keyboard-height', `${height}px`);
        });

        const hideListener = await Keyboard.addListener('keyboardWillHide', () => {
          setKeyboardHeight(0);
          setIsVisible(false);
          document.documentElement.style.setProperty('--android-keyboard-height', '0px');
        });

        // If unmounted during async setup, remove listeners immediately
        if (!mounted) {
          showListener.remove();
          hideListener.remove();
          return;
        }

        showCleanup = () => showListener.remove();
        hideCleanup = () => hideListener.remove();
      } catch (error) {
        console.error('[Android Keyboard] Error setting up listeners:', error);
      }
    };

    setupKeyboardListeners();

    return () => {
      mounted = false;
      showCleanup?.();
      hideCleanup?.();
      document.documentElement.style.setProperty('--android-keyboard-height', '0px');
    };
  }, [isSSR, isAndroid]);

  const getContainerStyle = useCallback((
    baseStyle: CSSProperties = {},
    adjustment: number = 40
  ): CSSProperties => {
    if (isSSR || !isAndroid || !isVisible || keyboardHeight <= 0) {
      return {
        ...baseStyle,
        transition: baseStyle.transition ?? 'transform 0.1s ease-out',
      };
    }

    const adjustedTransform = Math.max(0, keyboardHeight - adjustment);
    const baseTransform = baseStyle.transform ?? '';
    const translateY = adjustedTransform > 0 ? `translateY(-${adjustedTransform}px)` : '';
    const combinedTransform = `${baseTransform} ${translateY}`.trim();

    return {
      ...baseStyle,
      transform: combinedTransform || undefined,
      transition: baseStyle.transition ?? 'transform 0.1s ease-out',
    };
  }, [isSSR, isAndroid, isVisible, keyboardHeight]);

  return { keyboardHeight, isVisible, isAndroid, getContainerStyle };
}
