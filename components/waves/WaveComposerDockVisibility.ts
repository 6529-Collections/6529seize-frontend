"use client";

import { useSyncExternalStore } from "react";

type VisibilityListener = () => void;

const EMPTY_DOCK_ELEMENTS: readonly HTMLElement[] = [];

const listeners = new Set<VisibilityListener>();
// Bottom-docked wave composer containers currently on screen. Overlays that
// float in the bottom-right corner (the quick-DM launcher) measure these to
// decide whether their spot would cover composer controls.
const dockElements = new Set<HTMLElement>();
let dockElementsSnapshot: readonly HTMLElement[] = EMPTY_DOCK_ELEMENTS;

const emitDockChange = () => {
  dockElementsSnapshot =
    dockElements.size === 0 ? EMPTY_DOCK_ELEMENTS : Array.from(dockElements);
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: VisibilityListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = (): readonly HTMLElement[] => dockElementsSnapshot;

const getServerSnapshot = (): readonly HTMLElement[] => EMPTY_DOCK_ELEMENTS;

export const registerWaveComposerDock = (element: HTMLElement): (() => void) => {
  dockElements.add(element);
  emitDockChange();

  return () => {
    if (dockElements.delete(element)) {
      emitDockChange();
    }
  };
};

export const getWaveComposerDockElements = (): readonly HTMLElement[] =>
  dockElementsSnapshot;

// Snapshot identity changes whenever a composer dock mounts or unmounts.
export const useWaveComposerDockElements = (): readonly HTMLElement[] =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
