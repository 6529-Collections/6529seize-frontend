"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import type { TouchEvent as ReactTouchEvent } from "react";

const AXIS_SLOP = 12;
const AXIS_RATIO = 1.5;
const EDGE_RESERVE = 20;
const FLICK_DISTANCE = 24;
const FLICK_VELOCITY = 0.5;
const RELEASE_JITTER_PX = 1;

interface HorizontalSwipeOptions {
  readonly enabled: boolean;
  readonly direction: -1 | 1;
  readonly threshold: number;
  readonly intentRatio?: number;
  readonly flick?: boolean;
  readonly onStart?: () => void;
  readonly onMove: (distance: number, ready: boolean) => void;
  readonly onEnd: (committed: boolean, distance: number) => void;
}

interface Candidate {
  readonly element: HTMLElement;
  readonly options: { current: HorizontalSwipeOptions };
}

interface Gesture {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly candidates: Candidate[];
  owner: Candidate | null;
  distance: number;
  velocity: number;
  movedAt: number;
  frame: number | null;
}

// One active finger across the app: row reply and containing navigation arbitrate
// the same touch, and a second finger cancels it even across separate roots.
// There are no document listeners or animation frames while idle.
let gesture: Gesture | null = null;
let releaseClickSuppression: (() => void) | null = null;
let clickExpiry: ReturnType<typeof setTimeout> | null = null;

function ignoreTarget(element: HTMLElement, target: EventTarget | null) {
  if (!(target instanceof Element) || !element.contains(target)) return true;
  if (
    target.closest(
      "a, button, input, textarea, select, summary, iframe, video, audio, canvas, [contenteditable]:not([contenteditable='false']), [role='slider'], [role='button'], [data-wave-swipe-back-ignore='true'], [data-horizontal-swipe-ignore], .swiper"
    ) ||
    globalThis.getSelection()?.isCollapsed === false
  ) {
    return true;
  }
  for (
    let node: Element | null = target;
    node && node !== element;
    node = node.parentElement
  ) {
    if (node.scrollWidth <= node.clientWidth) continue;
    const overflow =
      (node instanceof HTMLElement && node.style.overflowX) ||
      globalThis.getComputedStyle(node).overflowX;
    if (overflow === "auto" || overflow === "scroll") return true;
  }
  return false;
}

function suppressClick(element: HTMLElement) {
  releaseClickSuppression?.();
  const onNewPress = () => releaseClickSuppression?.();
  const onClick = (event: MouseEvent) => {
    if (event.detail === 0) return;
    event.preventDefault();
    event.stopPropagation();
    releaseClickSuppression?.();
  };
  element.addEventListener("click", onClick, true);
  element.addEventListener("pointerdown", onNewPress, true);
  releaseClickSuppression = () => {
    if (clickExpiry !== null) globalThis.clearTimeout(clickExpiry);
    clickExpiry = null;
    element.removeEventListener("click", onClick, true);
    element.removeEventListener("pointerdown", onNewPress, true);
    releaseClickSuppression = null;
  };
}

function paint(current: Gesture) {
  current.frame = null;
  const options = current.owner?.options.current;
  options?.onMove(current.distance, current.distance >= options.threshold);
}

function finish(commit: boolean) {
  const current = gesture;
  gesture = null;
  document.removeEventListener("touchmove", move);
  document.removeEventListener("touchend", end);
  document.removeEventListener("touchcancel", cancel);
  document.removeEventListener("touchstart", additionalTouch);
  globalThis.removeEventListener("blur", cancel);
  if (!current) return;
  if (current.frame !== null) globalThis.cancelAnimationFrame(current.frame);
  const options = current.owner?.options.current;
  if (!options) return;
  clickExpiry = globalThis.setTimeout(() => releaseClickSuppression?.(), 400);
  paint(current);
  const velocity =
    performance.now() - current.movedAt <= 100 ? current.velocity : 0;
  const committed =
    commit &&
    options.enabled &&
    velocity > -0.2 &&
    (current.distance >= options.threshold ||
      (options.flick === true &&
        current.distance >= FLICK_DISTANCE &&
        velocity >= FLICK_VELOCITY));
  options.onEnd(committed, current.distance);
}

function cancel() {
  finish(false);
}

function additionalTouch(event: TouchEvent) {
  if (event.touches.length !== 1) cancel();
}

function track(current: Gesture, touch: Touch, isRelease = false) {
  const deltaX = touch.clientX - current.x;
  const absoluteDeltaX = Math.abs(deltaX);
  const deltaY = Math.abs(touch.clientY - current.y);
  if (!current.owner) {
    if (globalThis.getSelection()?.isCollapsed === false) {
      cancel();
      return;
    }
    if (deltaY >= AXIS_SLOP && deltaY >= absoluteDeltaX) {
      cancel();
      return;
    }
    if (absoluteDeltaX < AXIS_SLOP) return;
    const candidate = current.candidates.find(
      ({ options }) =>
        options.current.enabled && deltaX * options.current.direction > 0
    );
    if (!candidate) {
      cancel();
      return;
    }
    const intentRatio = candidate.options.current.intentRatio ?? AXIS_RATIO;
    if (absoluteDeltaX < deltaY * intentRatio) return;
    current.owner = candidate;
    suppressClick(current.owner.element);
    current.owner.options.current.onStart?.();
  }
  const distance = Math.max(
    0,
    deltaX * current.owner.options.current.direction
  );
  if (distance !== current.distance) {
    // Native WebViews can round the release coordinate back by a fraction of
    // a CSS pixel. Keep that from replacing a forward drag with reverse speed.
    if (
      !isRelease ||
      Math.abs(distance - current.distance) >= RELEASE_JITTER_PX
    ) {
      const now = performance.now();
      current.velocity =
        (distance - current.distance) / Math.max(1, now - current.movedAt);
      current.movedAt = now;
    }
    current.distance = distance;
  }
}

/** A long press/menu owns the remainder of its original touch sequence. */
export function cancelHorizontalSwipe() {
  cancel();
}

function move(event: TouchEvent) {
  const current = gesture;
  const touch = event.touches[0];
  if (
    !current ||
    !touch ||
    event.touches.length !== 1 ||
    touch.identifier !== current.id ||
    !event.cancelable
  ) {
    cancel();
    return;
  }
  track(current, touch);
  if (gesture !== current || !current.owner) return;
  event.preventDefault();
  current.frame ??= globalThis.requestAnimationFrame(() => paint(current));
}

function end(event: TouchEvent) {
  const current = gesture;
  if (!current) return;
  const touch = Array.from(event.changedTouches).find(
    ({ identifier }) => identifier === current.id
  );
  if (!touch || event.touches.length !== 0) {
    cancel();
    return;
  }
  // An end event cannot acquire a gesture: vertical scrolling or a tap must
  // have demonstrated horizontal intent while the finger was down.
  if (current.owner) track(current, touch, true);
  finish(true);
}

function removeCandidate(candidate: Candidate | null) {
  if (!candidate || !gesture) return;
  if (gesture.owner === candidate) {
    cancel();
    return;
  }
  const index = gesture.candidates.indexOf(candidate);
  if (index >= 0) gesture.candidates.splice(index, 1);
  if (gesture.candidates.length === 0) cancel();
}

export function useHorizontalSwipe(
  options: HorizontalSwipeOptions,
  scope: string
) {
  const latest = useRef(options);
  const candidate = useRef<Candidate | null>(null);
  useLayoutEffect(() => {
    latest.current = options;
    if (!options.enabled) removeCandidate(candidate.current);
  });
  useLayoutEffect(() => () => removeCandidate(candidate.current), [scope]);

  return useCallback((event: ReactTouchEvent<HTMLElement>) => {
    releaseClickSuppression?.();
    const touch = event.touches[0];
    if (!latest.current.enabled || !touch || event.touches.length !== 1) return;
    // Leave OS/browser edge navigation available on both platforms.
    if (
      touch.clientX < EDGE_RESERVE ||
      touch.clientX > globalThis.innerWidth - EDGE_RESERVE
    )
      return;
    if (ignoreTarget(event.currentTarget, event.target)) return;
    if (gesture?.id !== touch.identifier) {
      cancel();
      gesture = {
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        candidates: [],
        owner: null,
        distance: 0,
        velocity: 0,
        movedAt: performance.now(),
        frame: null,
      };
      document.addEventListener("touchmove", move, { passive: false });
      document.addEventListener("touchend", end, { passive: true });
      document.addEventListener("touchcancel", cancel, { passive: true });
      document.addEventListener("touchstart", additionalTouch, {
        passive: true,
      });
      globalThis.addEventListener("blur", cancel);
    }
    const next = { element: event.currentTarget, options: latest };
    candidate.current = next;
    gesture.candidates.push(next);
  }, []);
}
