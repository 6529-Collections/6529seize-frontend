"use client";

import { useEffect, useState } from "react";

export type PointerType = "mouse" | "touch" | "pen" | null;

interface InteractionModeState {
  readonly canHover: boolean;
  readonly hasFinePointer: boolean;
  readonly hoverNone: boolean;
  readonly lastPointerType: PointerType;
}

const DEFAULT_STATE: InteractionModeState = {
  canHover: false,
  hasFinePointer: false,
  hoverNone: false,
  lastPointerType: null,
};

let cachedState: InteractionModeState = DEFAULT_STATE;
let initialized = false;
const subscribers = new Set<(state: InteractionModeState) => void>();
let mediaQueriesRef: MediaQueryList[] | null = null;
let handlePointerDownRef: ((event: PointerEvent) => void) | null = null;
let handlePointerMoveRef: ((event: PointerEvent) => void) | null = null;

const getMediaMatch = (query: string): boolean => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(query).matches;
};

const getCapabilityState = (): Pick<InteractionModeState, "canHover" | "hasFinePointer" | "hoverNone"> => ({
  canHover: getMediaMatch("(any-hover: hover)"),
  hasFinePointer: getMediaMatch("(any-pointer: fine)"),
  hoverNone: getMediaMatch("(hover: none)"),
});

const emit = (nextState: InteractionModeState) => {
  cachedState = nextState;
  subscribers.forEach((subscriber) => {
    subscriber(cachedState);
  });
};

const updateCapabilities = () => {
  emit({ ...cachedState, ...getCapabilityState() });
};

const updatePointerType = (pointerType: string) => {
  if (pointerType !== "mouse" && pointerType !== "touch" && pointerType !== "pen") {
    return;
  }
  if (cachedState.lastPointerType === pointerType) {
    return;
  }
  emit({ ...cachedState, lastPointerType: pointerType });
};

function teardown() {
  if (typeof window === "undefined" || !mediaQueriesRef || !handlePointerDownRef || !handlePointerMoveRef) {
    return;
  }
  mediaQueriesRef.forEach((query) => {
    query.removeEventListener("change", updateCapabilities);
  });
  window.removeEventListener("pointerdown", handlePointerDownRef, { passive: true } as EventListenerOptions);
  window.removeEventListener("pointermove", handlePointerMoveRef, { passive: true } as EventListenerOptions);
  mediaQueriesRef = null;
  handlePointerDownRef = null;
  handlePointerMoveRef = null;
  initialized = false;
}

const init = () => {
  if (initialized || typeof window === "undefined") {
    return;
  }

  initialized = true;
  cachedState = { ...cachedState, ...getCapabilityState() };

  const mediaQueries = [
    window.matchMedia("(any-hover: hover)"),
    window.matchMedia("(any-pointer: fine)"),
    window.matchMedia("(hover: none)"),
  ];
  mediaQueriesRef = mediaQueries;

  const handlePointerDown = (event: PointerEvent) => updatePointerType(event.pointerType);
  const handlePointerMove = (event: PointerEvent) => updatePointerType(event.pointerType);
  handlePointerDownRef = handlePointerDown;
  handlePointerMoveRef = handlePointerMove;

  mediaQueries.forEach((query) => {
    query.addEventListener("change", updateCapabilities);
  });

  window.addEventListener("pointerdown", handlePointerDown, { passive: true });
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
};

export default function useInteractionMode() {
  const [state, setState] = useState<InteractionModeState>(() => cachedState);

  useEffect(() => {
    init();
    const onChange = (nextState: InteractionModeState) => setState(nextState);
    subscribers.add(onChange);
    onChange(cachedState);

    return () => {
      subscribers.delete(onChange);
      if (subscribers.size === 0) {
        teardown();
      }
    };
  }, []);

  const { canHover, hasFinePointer, hoverNone, lastPointerType } = state;

  return {
    canHover,
    hasFinePointer,
    hoverNone,
    lastPointerType,
    enableHoverUI: canHover || hasFinePointer,
    enableLongPress: hoverNone || lastPointerType === "touch",
  };
}
