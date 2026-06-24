"use client";

import { Capacitor } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { useSyncExternalStore } from "react";

export type NativeKeyboardPhase = "hidden" | "showing" | "visible" | "hiding";

export interface NativeKeyboardState {
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

  if (listenerHandles.length === 0) {
    return;
  }

  const handles = listenerHandles;
  listenerHandles = [];
  void removeListenerHandles(handles);
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
  currentState = defaultState;
  subscribers.clear();
  listenerHandles = [];
  listenerSetupPromise = null;
  listenerSetupToken = 0;
}
