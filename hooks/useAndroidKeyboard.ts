"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import type { KeyboardInfo, KeyboardPlugin } from "@capacitor/keyboard";
import type { CSSProperties } from "react";

interface AndroidKeyboardHookReturn {
  readonly bottomInset: number;
  readonly isVisible: boolean;
  readonly isAndroid: boolean;
  readonly getContainerStyle: (
    baseStyle?: CSSProperties,
    adjustment?: number
  ) => CSSProperties;
}

const TRANSITION = "transform 120ms ease-out";
const MIN_KEYBOARD = 32;
const KEYBOARD_EVENTS = [
  "keyboardWillShow",
  "keyboardDidShow",
  "keyboardWillHide",
  "keyboardDidHide",
] as const;
type KeyboardEventName = (typeof KEYBOARD_EVENTS)[number];

export function useAndroidKeyboard(
  debounceMs: number = 30
): AndroidKeyboardHookReturn {
  const isSSR = typeof window === "undefined";
  const isAndroid = !isSSR && Capacitor.getPlatform() === "android";

  const [bottomInset, setBottomInset] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const baseHeightRef = useRef(
    typeof window !== "undefined" ? window.innerHeight : 0
  );
  const pluginHeightRef = useRef(0);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const getViewportInset = useCallback(() => {
    if (isSSR) return 0;
    const vv = window.visualViewport;
    if (!vv) return Math.max(0, baseHeightRef.current - window.innerHeight);
    return Math.max(0, window.innerHeight - (vv.height + vv.offsetTop));
  }, [isSSR]);

  const getLayoutShrink = useCallback(() => {
    if (isSSR) return 0;
    return Math.max(0, baseHeightRef.current - window.innerHeight);
  }, [isSSR]);

  const updateInset = useCallback(() => {
    const viewportInset = getViewportInset();
    const layoutShrink = getLayoutShrink();
    const residual = Math.max(0, pluginHeightRef.current - layoutShrink);

    const inset = viewportInset > MIN_KEYBOARD
      ? residual
      : Math.max(viewportInset, residual);
    setBottomInset(inset);
    setIsVisible(inset > MIN_KEYBOARD);
    if (!isSSR) {
      document.documentElement.style.setProperty(
        "--android-keyboard-height",
        `${inset}px`
      );
    }
  }, [getViewportInset, getLayoutShrink, isSSR]);

  const scheduleUpdate = useCallback(() => {
    if (isSSR) return;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(updateInset, debounceMs);
  }, [updateInset, debounceMs, isSSR]);

  useEffect(() => {
    if (isSSR || !isAndroid) return;

    const vv = window.visualViewport;
    const handleResize = () => scheduleUpdate();
    const handleOrientation = () => {
      baseHeightRef.current = window.innerHeight;
      updateInset();
    };

    vv?.addEventListener("resize", scheduleUpdate);
    vv?.addEventListener("scroll", scheduleUpdate);
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleOrientation);

    const listeners: PluginListenerHandle[] = [];
    const typedAddListener = Keyboard.addListener as KeyboardPlugin["addListener"];

    const attach = async (event: KeyboardEventName) => {
      const handler = await typedAddListener(event as any, (info?: KeyboardInfo) => {
        if (event === "keyboardWillHide" || event === "keyboardDidHide") {
          pluginHeightRef.current = 0;
          baseHeightRef.current = window.innerHeight;
        } else {
          pluginHeightRef.current = info?.keyboardHeight || 0;
        }
        updateInset();
      });
      listeners.push(handler);
    };

    if (Capacitor.isPluginAvailable("Keyboard")) {
      KEYBOARD_EVENTS.forEach((event) => {
        attach(event).catch((error) => {
          console.error("[Android Keyboard] Listener attach failed", error);
        });
      });
    }

    updateInset();

    return () => {
      vv?.removeEventListener("resize", scheduleUpdate);
      vv?.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientation);
      listeners.forEach((listener) => {
        void listener.remove();
      });
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [isSSR, isAndroid, scheduleUpdate, updateInset]);

  const getContainerStyle = useCallback(
    (baseStyle: CSSProperties = {}, adjustment: number = 40) => {
      if (isSSR || !isAndroid) {
        return baseStyle;
      }

      const translate = Math.max(0, bottomInset - adjustment);
      if (translate <= 0) {
        return baseStyle;
      }

      const transform = baseStyle.transform
        ? `${baseStyle.transform} translateY(-${translate}px)`
        : `translateY(-${translate}px)`;

      return {
        ...baseStyle,
        transform,
        transition: baseStyle.transition ?? TRANSITION,
      };
    },
    [isSSR, isAndroid, bottomInset]
  );

  return { bottomInset, isVisible, isAndroid, getContainerStyle };
}
