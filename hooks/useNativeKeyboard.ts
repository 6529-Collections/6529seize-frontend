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
let keyboardClosedViewportHeight = 0;
let keyboardClosedLayoutViewportHeight = 0;
let nativeKeyboardLifecycleActive = false;

const KEYBOARD_INSET_CSS_VARIABLE = "--native-keyboard-inset-bottom";
const KEYBOARD_LAYOUT_TRANSITION_DURATION_CSS_VARIABLE =
  "--native-keyboard-layout-transition-duration";
const KEYBOARD_EVENT_LAYOUT_TRANSITION_MS = 250;
const VIEWPORT_KEYBOARD_HEIGHT_TOLERANCE_PX = 8;
const VIEWPORT_KEYBOARD_CLOSED_TOLERANCE_PX = 24;
const FOCUSOUT_KEYBOARD_HIDE_FALLBACK_MS = 180;
const NATIVE_KEYBOARD_HIDE_FALLBACK_MS = 500;

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
  >,
  options: { readonly transitionMs?: number | undefined } = {}
): void {
  const nextState = {
    ...currentState,
    ...readPlatformState(),
    ...keyboardState,
  };

  applyKeyboardLayoutVariables(nextState, options.transitionMs ?? 0);
  emitState(nextState);
}

function clearHiddenFallbackTimeout(): void {
  if (hiddenFallbackTimeout === null) {
    return;
  }

  clearTimeout(hiddenFallbackTimeout);
  hiddenFallbackTimeout = null;
}

function normalizeKeyboardHeight(height: number | null | undefined): number {
  return typeof height === "number" && Number.isFinite(height) && height > 0
    ? Math.round(height)
    : 0;
}

function applyKeyboardLayoutVariables(
  state: Pick<NativeKeyboardState, "keyboardHeight" | "phase" | "isAndroid">,
  transitionMs: number
): void {
  const documentRef = (globalThis as Partial<{ readonly document: Document }>)
    .document;
  const documentElement = documentRef?.documentElement;
  if (documentElement === undefined) {
    return;
  }

  const keyboardHeight = normalizeKeyboardHeight(state.keyboardHeight);
  const keyboardInset = getKeyboardLayoutInset(keyboardHeight, state.isAndroid);
  const isKeyboardActive = keyboardHeight > 0 || state.phase !== "hidden";
  documentElement.style.setProperty(
    KEYBOARD_INSET_CSS_VARIABLE,
    `${keyboardInset}px`
  );
  documentElement.style.setProperty(
    KEYBOARD_LAYOUT_TRANSITION_DURATION_CSS_VARIABLE,
    `${Math.max(0, transitionMs)}ms`
  );

  if (isKeyboardActive) {
    documentElement.dataset["nativeKeyboardVisible"] = "true";
  } else {
    delete documentElement.dataset["nativeKeyboardVisible"];
  }
}

function resetKeyboardLayoutVariables(): void {
  applyKeyboardLayoutVariables(defaultState, 0);
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

function getLayoutViewportHeight(): number {
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

function getLayoutViewportShrinkHeight(): number {
  const layoutViewportHeight = getLayoutViewportHeight();
  if (keyboardClosedLayoutViewportHeight <= 0 || layoutViewportHeight <= 0) {
    return 0;
  }

  return Math.max(0, keyboardClosedLayoutViewportHeight - layoutViewportHeight);
}

function getKeyboardLayoutInset(
  keyboardHeight: number,
  isAndroid: boolean
): number {
  if (!isAndroid) {
    return normalizeKeyboardHeight(keyboardHeight);
  }

  // Android WebViews can shrink the layout viewport themselves. Only publish
  // the keyboard overlap that has not already been removed from 100dvh.
  return normalizeKeyboardHeight(
    Math.max(0, keyboardHeight - getLayoutViewportShrinkHeight())
  );
}

function rememberKeyboardClosedViewportHeight(): number {
  const viewportHeight = getViewportHeight();
  if (viewportHeight > 0) {
    keyboardClosedViewportHeight = viewportHeight;
  }

  const layoutViewportHeight = getLayoutViewportHeight();
  if (layoutViewportHeight > 0) {
    keyboardClosedLayoutViewportHeight = layoutViewportHeight;
  }

  return viewportHeight;
}

function getViewportKeyboardHeight(): number {
  const visualViewport = (
    globalThis as Partial<{ readonly visualViewport: VisualViewport }>
  ).visualViewport;
  if (visualViewport === undefined) {
    return 0;
  }

  const visualViewportHeight = visualViewport.height;
  if (
    typeof visualViewportHeight !== "number" ||
    !Number.isFinite(visualViewportHeight) ||
    visualViewportHeight <= 0
  ) {
    return 0;
  }

  const visualViewportShrinkHeight =
    keyboardClosedViewportHeight > 0
      ? keyboardClosedViewportHeight -
        visualViewport.offsetTop -
        visualViewportHeight
      : 0;
  const windowHeight = typeof window !== "undefined" ? window.innerHeight : 0;
  const viewportBottomOverlap =
    windowHeight > 0
      ? windowHeight - visualViewport.offsetTop - visualViewportHeight
      : 0;
  const unappliedViewportShrinkHeight = currentState.isAndroid
    ? visualViewportShrinkHeight - getLayoutViewportShrinkHeight()
    : visualViewportShrinkHeight;

  // Use the closed-viewport shrink when available, but keep bottom overlap as
  // the first-focus/offsetTop fallback for WebViews that do not expose a stable
  // pre-keyboard baseline.
  return normalizeKeyboardHeight(
    Math.max(unappliedViewportShrinkHeight, viewportBottomOverlap)
  );
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
  const documentRef = globalThis.document as Document | undefined;

  if (documentRef === undefined) {
    return false;
  }

  return isEditableElement(documentRef.activeElement);
}

function markKeyboardHiddenFromFallback(): void {
  clearHiddenFallbackTimeout();
  nativeKeyboardLifecycleActive = false;

  if (!currentState.isVisible) {
    rememberKeyboardClosedViewportHeight();
    return;
  }

  setKeyboardState({
    isVisible: false,
    keyboardHeight: 0,
    phase: "hidden",
  });
  rememberKeyboardClosedViewportHeight();
}

function syncKeyboardVisibilityFromViewport(): void {
  // Native iOS events provide the final keyboard frame. Viewport updates can
  // arrive late and report device-specific intermediate geometry.
  if (currentState.isIos && nativeKeyboardLifecycleActive) {
    return;
  }

  const viewportHeight = getViewportHeight();
  if (viewportHeight <= 0) {
    return;
  }

  const viewportKeyboardHeight = getViewportKeyboardHeight();
  if (viewportKeyboardHeight > VIEWPORT_KEYBOARD_HEIGHT_TOLERANCE_PX) {
    clearHiddenFallbackTimeout();
    setKeyboardState({
      isVisible: true,
      keyboardHeight: viewportKeyboardHeight,
      phase: currentState.phase === "hidden" ? "showing" : currentState.phase,
    });
    return;
  }

  if (currentState.isVisible || currentState.phase !== "hidden") {
    applyKeyboardLayoutVariables(currentState, 0);
  }

  if (!currentState.isVisible) {
    rememberKeyboardClosedViewportHeight();
    return;
  }

  if (keyboardClosedViewportHeight <= 0) {
    keyboardClosedViewportHeight = viewportHeight;
    return;
  }

  if (
    viewportHeight >=
    keyboardClosedViewportHeight - VIEWPORT_KEYBOARD_CLOSED_TOLERANCE_PX
  ) {
    markKeyboardHiddenFromFallback();
  }
}

function scheduleFocusoutKeyboardHideFallback(): void {
  clearHiddenFallbackTimeout();
  const fallbackDelay = nativeKeyboardLifecycleActive
    ? NATIVE_KEYBOARD_HIDE_FALLBACK_MS
    : FOCUSOUT_KEYBOARD_HIDE_FALLBACK_MS;

  hiddenFallbackTimeout = setTimeout(() => {
    hiddenFallbackTimeout = null;
    if (!currentState.isVisible || hasEditableFocus()) {
      return;
    }

    markKeyboardHiddenFromFallback();
  }, fallbackDelay);
}

function setupBrowserKeyboardFallbackListeners(): void {
  const windowRef = globalThis.window as Window | undefined;
  const documentRef = globalThis.document as Document | undefined;

  if (
    browserFallbackTeardown !== null ||
    windowRef === undefined ||
    documentRef === undefined
  ) {
    return;
  }

  rememberKeyboardClosedViewportHeight();
  let viewportAnimationFrame: number | null = null;

  const handleFocusIn = () => {
    clearHiddenFallbackTimeout();
    if (!currentState.isVisible) {
      rememberKeyboardClosedViewportHeight();
    }
  };
  const handleFocusOut = () => {
    scheduleFocusoutKeyboardHideFallback();
  };
  const handleViewportChange = () => {
    if (viewportAnimationFrame !== null) {
      return;
    }

    viewportAnimationFrame = windowRef.requestAnimationFrame(() => {
      viewportAnimationFrame = null;
      syncKeyboardVisibilityFromViewport();
    });
  };
  const handleVisibilityChange = () => {
    if (documentRef.visibilityState === "hidden") {
      markKeyboardHiddenFromFallback();
      return;
    }

    handleViewportChange();
  };

  documentRef.addEventListener("focusin", handleFocusIn, true);
  documentRef.addEventListener("focusout", handleFocusOut, true);
  documentRef.addEventListener("visibilitychange", handleVisibilityChange);
  windowRef.addEventListener("resize", handleViewportChange, {
    passive: true,
  });
  windowRef.addEventListener("orientationchange", handleViewportChange, {
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
    if (viewportAnimationFrame !== null) {
      windowRef.cancelAnimationFrame(viewportAnimationFrame);
      viewportAnimationFrame = null;
    }
    documentRef.removeEventListener("focusin", handleFocusIn, true);
    documentRef.removeEventListener("focusout", handleFocusOut, true);
    documentRef.removeEventListener("visibilitychange", handleVisibilityChange);
    windowRef.removeEventListener("resize", handleViewportChange);
    windowRef.removeEventListener("orientationchange", handleViewportChange);
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
  return normalizeKeyboardHeight(info?.keyboardHeight);
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
  nativeKeyboardLifecycleActive = false;
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
          const keyboardHeight = getKeyboardHeight(info);
          nativeKeyboardLifecycleActive = keyboardHeight > 0;
          setKeyboardState(
            {
              isVisible: keyboardHeight > 0,
              keyboardHeight,
              phase: keyboardHeight > 0 ? "showing" : "hidden",
            },
            { transitionMs: KEYBOARD_EVENT_LAYOUT_TRANSITION_MS }
          );
        }),
        Keyboard.addListener("keyboardDidShow", (info) => {
          const keyboardHeight = getKeyboardHeight(info);
          nativeKeyboardLifecycleActive = keyboardHeight > 0;
          setKeyboardState({
            isVisible: keyboardHeight > 0,
            keyboardHeight,
            phase: keyboardHeight > 0 ? "visible" : "hidden",
          });
        }),
        Keyboard.addListener("keyboardWillHide", () => {
          const wasKeyboardActive =
            currentState.isVisible || currentState.keyboardHeight > 0;
          nativeKeyboardLifecycleActive = wasKeyboardActive;
          // willHide starts the native dismissal animation; target zero inset
          // now so the app layout travels down with the keyboard instead of
          // waiting for didHide.
          setKeyboardState(
            {
              isVisible: wasKeyboardActive,
              keyboardHeight: 0,
              phase: wasKeyboardActive ? "hiding" : "hidden",
            },
            { transitionMs: KEYBOARD_EVENT_LAYOUT_TRANSITION_MS }
          );
        }),
        Keyboard.addListener("keyboardDidHide", () => {
          nativeKeyboardLifecycleActive = false;
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
  keyboardClosedViewportHeight = 0;
  keyboardClosedLayoutViewportHeight = 0;
  nativeKeyboardLifecycleActive = false;
  resetKeyboardLayoutVariables();
}
