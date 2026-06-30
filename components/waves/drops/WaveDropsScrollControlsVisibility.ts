"use client";

import { useSyncExternalStore } from "react";

type VisibilityListener = () => void;

const listeners = new Set<VisibilityListener>();
let visibleControlsCount = 0;

const emitVisibilityChange = () => {
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: VisibilityListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = (): boolean => visibleControlsCount > 0;

export const registerWaveDropsScrollControlsVisible = (): (() => void) => {
  let isRegistered = true;
  visibleControlsCount += 1;
  emitVisibilityChange();

  return () => {
    if (!isRegistered) {
      return;
    }

    isRegistered = false;
    visibleControlsCount = Math.max(0, visibleControlsCount - 1);
    emitVisibilityChange();
  };
};

export const useWaveDropsScrollControlsVisible = (): boolean =>
  useSyncExternalStore(subscribe, getSnapshot, () => false);
