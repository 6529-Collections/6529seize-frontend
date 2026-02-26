"use client"

import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';

interface AndroidKeyboardHookReturn {
  keyboardHeight: number;
  isVisible: boolean;
  isAndroid: boolean;
  getContainerStyle: (baseStyle?: CSSProperties, adjustment?: number) => CSSProperties;
}

const DEBOUNCE_MS = 50;

export function useAndroidKeyboard(): AndroidKeyboardHookReturn {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const isSSR = typeof window === 'undefined';
  const isAndroid = !isSSR && Capacitor.getPlatform() === 'android';

  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isSSR || !isAndroid) return;

    let mounted = true;
    let showCleanup: (() => void) | undefined;
    let hideCleanup: (() => void) | undefined;

    const debouncedShow = (height: number) => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = setTimeout(() => {
        if (!mounted) return;
        setKeyboardHeight(height);
        setIsVisible(true);
        document.documentElement.style.setProperty('--android-keyboard-height', `${height}px`);
      }, DEBOUNCE_MS);
    };

    const debouncedHide = () => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = null;
      }
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => {
        if (!mounted) return;
        setKeyboardHeight(0);
        setIsVisible(false);
        document.documentElement.style.setProperty('--android-keyboard-height', '0px');
      }, DEBOUNCE_MS);
    };

    const setupKeyboardListeners = async () => {
      if (!Capacitor.isPluginAvailable('Keyboard')) return;

      try {
        const showListener = await Keyboard.addListener('keyboardWillShow', (info) => {
          const height = info.keyboardHeight ?? 300;
          debouncedShow(height);
        });

        const hideListener = await Keyboard.addListener('keyboardWillHide', () => {
          debouncedHide();
        });

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
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
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
