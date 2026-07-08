"use client";

import { Capacitor } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { useSyncExternalStore } from "react";

type NativeKeyboardPhase = "hidden" | "showing" | "visible" | "hiding";

interface NativeKeyboardState {
  readonly isVisible: boolean;
  readonly keyboardHeight: number;
  readonly phase: NativeKeyboardPhase;
  readonly isNative: boolean;
  readonly isIos: boolean;
  readonly isAndroid: boolean;
}

type KeyboardStateSubscriber = () => void;

const defaultState: NativeKeyboardState = {
  isVisible: false,
  keyboardHeight: 0,
  phase: "hidden",
  isNative: false,
  isIos: false,
  isAndroid: false,
};

let currentState = defaultState;
const subscribers = new Set<KeyboardStateSubscriber>();
let listenerHandles: PluginListenerHandle[] = [];
let listenerSetupPromise: Promise<void> | null = null;
let listenerSetupToken = 0;
let browserFallbackTeardown: (() => void) | null = null;
let hiddenFallbackTimeout: ReturnType<typeof setTimeout> | null = null;
let largestObservedViewportHeight = 0;

const VIEWPORT_KEYBOARD_CLOSED_TOLERANCE_PX = 24;
const FOCUSOUT_KEYBOARD_HIDE_FALLBACK_MS = 180;

function readPlatformState(): Pick<
  NativeKeyboardState,
  "isNative" | "isIos" | "isAndroid"
> {
  if (typeof window === "undefined") {
    return { isNative: false, isIos: false, isAndroid: false };
  }

  const platform = Capacitor.getPlatform();

  return {
    isNative: Capacitor.isNativePlatform(),
    isIos: platform === "ios",
    isAndroid: platform === "android",
  };
}

function statesAreEqual(
  left: NativeKeyboardState,
  right: NativeKeyboardState
): boolean {
  return (
    left.isVisible === right.isVisible &&
    left.keyboardHeight === right.keyboardHeight &&
    left.phase === right.phase &&
    left.isNative === right.isNative &&
    left.isIos === right.isIos &&
    left.isAndroid === right.isAndroid
  );
}

function getCurrentState(): NativeKeyboardState {
  return currentState;
}

function refreshPlatformState(): void {
  const nextState = {
    ...currentState,
    ...readPlatformState(),
  };

  emitState(nextState);
}

function emitState(nextState: NativeKeyboardState): void {
  if (statesAreEqual(currentState, nextState)) {
    return;
  }

  currentState = nextState;
  subscribers.forEach((subscriber) => subscriber());
}

function setKeyboardState(
  keyboardState: Pick<
    NativeKeyboardState,
    "isVisible" | "keyboardHeight" | "phase"
  >
): void {
  emitState({
    ...currentState,
    ...readPlatformState(),
    ...keyboardState,
  });
}

function clearHiddenFallbackTimeout(): void {
  if (hiddenFallbackTimeout === null) {
    return;
  }

  clearTimeout(hiddenFallbackTimeout);
  hiddenFallbackTimeout = null;
}

function getViewportHeight(): number {
  const visualViewportHeight = globalThis.visualViewport?.height;
  if (
    typeof visualViewportHeight === "number" &&
    Number.isFinite(visualViewportHeight) &&
    visualViewportHeight > 0
  ) {
    return visualViewportHeight;
  }

  const windowHeight = typeof window !== "undefined" ? window.innerHeight : 0;
  if (
    typeof windowHeight === "number" &&
    Number.isFinite(windowHeight) &&
    windowHeight > 0
  ) {
    return windowHeight;
  }

  return typeof document !== "undefined"
    ? document.documentElement.clientHeight
    : 0;
}

function rememberLargestViewportHeight(): number {
  const viewportHeight = getViewportHeight();
  if (viewportHeight > largestObservedViewportHeight) {
    largestObservedViewportHeight = viewportHeight;
  }

  return viewportHeight;
}

function isEditableElement(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  return (
    element.isContentEditable ||
    element.matches(
      'input:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), select:not([disabled]), [contenteditable="true"], [contenteditable="plaintext-only"]'
    )
  );
}

function hasEditableFocus(): boolean {
  if (typeof globalThis.document === "undefined") {
    return false;
  }

  return isEditableElement(globalThis.document.activeElement);
}

function markKeyboardHiddenFromFallback(): void {
  clearHiddenFallbackTimeout();

  if (!currentState.isVisible) {
    rememberLargestViewportHeight();
    return;
  }

  setKeyboardState({
    isVisible: false,
    keyboardHeight: 0,
    phase: "hidden",
  });
  rememberLargestViewportHeight();
}

function syncKeyboardVisibilityFromViewport(): void {
  const viewportHeight = getViewportHeight();
  if (viewportHeight <= 0) {
    return;
  }

  if (!currentState.isVisible) {
    rememberLargestViewportHeight();
    return;
  }

  if (largestObservedViewportHeight <= 0) {
    largestObservedViewportHeight = viewportHeight;
    return;
  }

  if (
    viewportHeight >=
    largestObservedViewportHeight - VIEWPORT_KEYBOARD_CLOSED_TOLERANCE_PX
  ) {
    markKeyboardHiddenFromFallback();
  }
}

function scheduleFocusoutKeyboardHideFallback(): void {
  clearHiddenFallbackTimeout();

  hiddenFallbackTimeout = setTimeout(() => {
    hiddenFallbackTimeout = null;
    if (!currentState.isVisible || hasEditableFocus()) {
      return;
    }

    markKeyboardHiddenFromFallback();
  }, FOCUSOUT_KEYBOARD_HIDE_FALLBACK_MS);
}

function setupBrowserKeyboardFallbackListeners(): void {
  if (
    browserFallbackTeardown !== null ||
    typeof globalThis.window === "undefined" ||
    typeof globalThis.document === "undefined"
  ) {
    return;
  }

  rememberLargestViewportHeight();

  const handleFocusIn = () => {
    clearHiddenFallbackTimeout();
  };
  const handleFocusOut = () => {
    scheduleFocusoutKeyboardHideFallback();
  };
  const handleViewportChange = () => {
    syncKeyboardVisibilityFromViewport();
  };
  const handleVisibilityChange = () => {
    if (globalThis.document.visibilityState === "hidden") {
      markKeyboardHiddenFromFallback();
    }
  };

  globalThis.document.addEventListener("focusin", handleFocusIn, true);
  globalThis.document.addEventListener("focusout", handleFocusOut, true);
  globalThis.document.addEventListener(
    "visibilitychange",
    handleVisibilityChange
  );
  globalThis.window.addEventListener("resize", handleViewportChange, {
    passive: true,
  });
  globalThis.visualViewport?.addEventListener("resize", handleViewportChange, {
    passive: true,
  });
  globalThis.visualViewport?.addEventListener("scroll", handleViewportChange, {
    passive: true,
  });

  browserFallbackTeardown = () => {
    clearHiddenFallbackTimeout();
    globalThis.document.removeEventListener("focusin", handleFocusIn, true);
    globalThis.document.removeEventListener("focusout", handleFocusOut, true);
    globalThis.document.removeEventListener(
      "visibilitychange",
      handleVisibilityChange
    );
    globalThis.window.removeEventListener("resize", handleViewportChange);
    globalThis.visualViewport?.removeEventListener(
      "resize",
      handleViewportChange
    );
    globalThis.visualViewport?.removeEventListener(
      "scroll",
      handleViewportChange
    );
    browserFallbackTeardown = null;
  };
}

function getKeyboardHeight(info?: { keyboardHeight?: number | null }): number {
  const height = info?.keyboardHeight;

  // Keep missing heights as 0 for now; current consumers only key off visibility.
  return typeof height === "number" && Number.isFinite(height) && height > 0
    ? height
    : 0;
}

async function removeListenerHandles(
  handles: readonly PluginListenerHandle[]
): Promise<void> {
  await Promise.all(
    handles.map((handle) =>
      Promise.resolve(handle.remove()).catch((error: unknown) => {
        console.error("[Native Keyboard] Error removing listener:", error);
      })
    )
  );
}

function teardownKeyboardListeners(): void {
  listenerSetupToken += 1;
  browserFallbackTeardown?.();

  if (listenerHandles.length === 0) {
    setKeyboardState({
      isVisible: false,
      keyboardHeight: 0,
      phase: "hidden",
    });
    return;
  }

  const handles = listenerHandles;
  listenerHandles = [];
  void removeListenerHandles(handles);
  setKeyboardState({
    isVisible: false,
    keyboardHeight: 0,
    phase: "hidden",
  });
}

function ensureKeyboardListeners(): void {
  refreshPlatformState();
  const platformState = getCurrentState();

  if (
    typeof window === "undefined" ||
    !platformState.isNative ||
    (!platformState.isIos && !platformState.isAndroid) ||
    !Capacitor.isPluginAvailable("Keyboard") ||
    listenerHandles.length > 0 ||
    listenerSetupPromise
  ) {
    return;
  }

  setupBrowserKeyboardFallbackListeners();

  const setupToken = listenerSetupToken;

  listenerSetupPromise = (async () => {
    try {
      if (platformState.isIos) {
        try {
          await Keyboard.setAccessoryBarVisible({ isVisible: true });
        } catch (error) {
          console.error(
            "[Native Keyboard] Error setting iOS accessory bar visibility:",
            error
          );
        }
      }

      const handles = await Promise.all([
        Keyboard.addListener("keyboardWillShow", (info) => {
          setKeyboardState({
            isVisible: true,
            keyboardHeight: getKeyboardHeight(info),
            phase: "showing",
          });
        }),
        Keyboard.addListener("keyboardDidShow", (info) => {
          setKeyboardState({
            isVisible: true,
            keyboardHeight: getKeyboardHeight(info),
            phase: "visible",
          });
        }),
        Keyboard.addListener("keyboardWillHide", () => {
          setKeyboardState({
            isVisible: false,
            keyboardHeight: 0,
            phase: "hiding",
          });
        }),
        Keyboard.addListener("keyboardDidHide", () => {
          setKeyboardState({
            isVisible: false,
            keyboardHeight: 0,
            phase: "hidden",
          });
        }),
      ]);

      if (setupToken !== listenerSetupToken || subscribers.size === 0) {
        await removeListenerHandles(handles);
        return;
      }

      listenerHandles = handles;
    } catch (error) {
      console.error("[Native Keyboard] Error setting up listeners:", error);
    } finally {
      const shouldRetrySetup =
        setupToken !== listenerSetupToken &&
        subscribers.size > 0 &&
        listenerHandles.length === 0;

      listenerSetupPromise = null;

      if (shouldRetrySetup) {
        ensureKeyboardListeners();
      }
    }
  })();
}

function subscribeToNativeKeyboard(
  subscriber: KeyboardStateSubscriber
): () => void {
  subscribers.add(subscriber);
  refreshPlatformState();
  ensureKeyboardListeners();

  return () => {
    subscribers.delete(subscriber);

    if (subscribers.size === 0) {
      teardownKeyboardListeners();
    }
  };
}

function getServerSnapshot(): NativeKeyboardState {
  return defaultState;
}

export function useNativeKeyboard(): NativeKeyboardState {
  return useSyncExternalStore(
    subscribeToNativeKeyboard,
    getCurrentState,
    getServerSnapshot
  );
}

export function __resetNativeKeyboardForTests(): void {
  teardownKeyboardListeners();
  browserFallbackTeardown?.();
  clearHiddenFallbackTimeout();
  currentState = defaultState;
  subscribers.clear();
  listenerHandles = [];
  listenerSetupPromise = null;
  listenerSetupToken = 0;
  largestObservedViewportHeight = 0;
}
