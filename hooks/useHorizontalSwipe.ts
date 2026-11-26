"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import type { TouchEvent as ReactTouchEvent } from "react";

const AXIS_SLOP = 8;
const VERTICAL_SLOP = 12;
const AXIS_RATIO = 1.5;
const EDGE_RESERVE = 20;
const FLICK_DISTANCE = 24;
const FLICK_VELOCITY = 0.5;
const VELOCITY_JITTER_PX = 1;

interface HorizontalSwipeOptions {
  readonly enabled: boolean;
  readonly direction: -1 | 1;
  readonly threshold: number | (() => number);
  readonly intentRatio?: number;
  readonly flick?: boolean;
  /** Average recent source events for phone Back; other gestures keep their timing. */
  readonly velocityWindowMs?: number | undefined;
  /** Catch a running animation at touch-down, before axis intent is known. */
  readonly captureOnPress?: boolean;
  readonly allowReverse?: boolean;
  /** Rightward navigation from this left-edge zone outranks content gestures. */
  readonly priorityLeftEdgeWidth?: number;
  readonly onStart?: () => void;
  readonly onMove: (distance: number, ready: boolean) => void;
  readonly onEnd: (
    committed: boolean,
    distance: number,
    velocity: number
  ) => void;
}

interface Candidate {
  readonly element: HTMLElement;
  readonly options: { current: HorizontalSwipeOptions };
  readonly priorityEdge: boolean;
}

interface Gesture {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly candidates: Candidate[];
  readonly capture: boolean;
  owner: Candidate | null;
  distance: number;
  velocityDistance: number;
  velocityPeak: number;
  velocityPeakAt: number;
  velocity: number;
  readonly velocitySamples: { distance: number; time: number }[];
  movedAt: number;
  frame: number | null;
}

// One active finger across the app: row reply and containing navigation arbitrate
// the same touch, and a second finger cancels it even across separate roots.
// There are no document listeners or animation frames while idle.
let gesture: Gesture | null = null;
let releaseClickSuppression: (() => void) | null = null;
let clickExpiry: ReturnType<typeof setTimeout> | null = null;

function ignoreTarget(element: HTMLElement, target: Element) {
  if (
    target.closest(
      "a, button, input, textarea, select, summary, iframe, video, audio, canvas, [contenteditable]:not([contenteditable='false']), [role='slider'], [role='button']:not([data-horizontal-swipe-content='true']), [data-wave-swipe-back-ignore='true'], [data-horizontal-swipe-ignore], .swiper"
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

function isPriorityEdge(options: HorizontalSwipeOptions, x: number) {
  const width = options.priorityLeftEdgeWidth ?? 0;
  return options.direction === 1 && width > 0 && x >= 0 && x <= width;
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
  if (!options) return;
  const threshold =
    typeof options.threshold === "function"
      ? options.threshold()
      : options.threshold;
  options.onMove(current.distance, current.distance >= threshold);
}

function finish(commit: boolean, timestamp?: number) {
  const current = gesture;
  gesture = null;
  const capture = current?.capture ?? false;
  document.removeEventListener("touchmove", move, capture);
  document.removeEventListener("touchend", end, capture);
  document.removeEventListener("touchcancel", cancel, capture);
  document.removeEventListener("touchstart", additionalTouch);
  globalThis.removeEventListener("blur", cancel);
  if (!current) return;
  if (current.frame !== null) globalThis.cancelAnimationFrame(current.frame);
  for (const candidate of current.candidates) {
    if (candidate !== current.owner && candidate.options.current.captureOnPress)
      candidate.options.current.onEnd(false, 0, 0);
  }
  const options = current.owner?.options.current;
  if (!options) return;
  clickExpiry = globalThis.setTimeout(() => releaseClickSuppression?.(), 400);
  paint(current);
  const lastSample = current.velocitySamples.at(-1);
  const sampleAge =
    (options.velocityWindowMs ?? 0) > 0 && timestamp !== undefined && lastSample
      ? timestamp - lastSample.time
      : performance.now() - current.movedAt;
  const velocity = sampleAge <= 100 ? current.velocity : 0;
  const committed =
    commit &&
    options.enabled &&
    velocity > -0.2 &&
    (current.distance >=
      (typeof options.threshold === "function"
        ? options.threshold()
        : options.threshold) ||
      (options.flick === true &&
        current.distance >= FLICK_DISTANCE &&
        velocity >= FLICK_VELOCITY));
  options.onEnd(committed, current.distance, velocity * 1000);
}

function cancel() {
  finish(false);
}

function additionalTouch(event: TouchEvent) {
  if (event.touches.length !== 1) cancel();
}

function trackVelocity(current: Gesture, distance: number, timestamp: number) {
  if (distance === current.distance) return;
  const now = performance.now();
  if (distance > current.velocityPeak) {
    current.velocityPeak = distance;
    current.velocityPeakAt = now;
  }
  const reversing = current.velocityPeak - distance >= VELOCITY_JITTER_PX;
  const referenceDistance = reversing
    ? current.velocityPeak
    : current.velocityDistance;
  const referenceTime = reversing ? current.velocityPeakAt : current.movedAt;
  current.distance = distance;
  // Native WebViews interpolate tiny final moves as well as rounding release
  // coordinates. Keep either from replacing the finger's forward velocity.
  if (Math.abs(distance - referenceDistance) < VELOCITY_JITTER_PX) return;
  const windowMs = current.owner?.options.current.velocityWindowMs ?? 0;
  const samples = current.velocitySamples;
  if (windowMs > 0 && !reversing) {
    // WebKit may batch delivery and taper a flick's last few pixels. Use
    // event times over a short window, rather than the last delivered pair.
    samples.push({ distance, time: timestamp });
    while (samples.length > 2 && timestamp - samples[1]!.time >= windowMs)
      samples.shift();
    const first = samples[0]!;
    current.velocity =
      (distance - first.distance) / Math.max(1, timestamp - first.time);
  } else {
    current.velocity =
      (distance - referenceDistance) / Math.max(1, now - referenceTime);
    // Reversing must cancel immediately, without older forward samples.
    if (windowMs > 0)
      samples.splice(0, samples.length, { distance, time: timestamp });
  }
  current.movedAt = now;
  current.velocityDistance = distance;
  current.velocityPeak = distance;
  current.velocityPeakAt = now;
}

function claimGesture(current: Gesture, deltaX: number, deltaY: number) {
  const absoluteDeltaX = Math.abs(deltaX);
  const candidate =
    current.candidates.find(
      ({ priorityEdge, options }) =>
        priorityEdge && options.current.enabled && deltaX > 0
    ) ??
    current.candidates.find(
      ({ options }) =>
        options.current.enabled &&
        (deltaX * options.current.direction > 0 ||
          options.current.allowReverse === true)
    );
  if (
    !candidate?.priorityEdge &&
    globalThis.getSelection()?.isCollapsed === false
  ) {
    cancel();
    return;
  }
  if (deltaY >= VERTICAL_SLOP && deltaY >= absoluteDeltaX) {
    cancel();
    return;
  }
  if (absoluteDeltaX < AXIS_SLOP) return;
  if (!candidate) {
    if (absoluteDeltaX >= deltaY * AXIS_RATIO) cancel();
    return;
  }
  const intentRatio = candidate.options.current.intentRatio ?? AXIS_RATIO;
  if (absoluteDeltaX < deltaY * intentRatio) return;
  current.owner = candidate;
  suppressClick(current.owner.element);
  if (!current.owner.options.current.captureOnPress)
    current.owner.options.current.onStart?.();
}

function track(current: Gesture, touch: Touch, timestamp: number) {
  const deltaX = touch.clientX - current.x;
  const deltaY = Math.abs(touch.clientY - current.y);
  if (!current.owner) claimGesture(current, deltaX, deltaY);
  if (!current.owner) return;
  const delta = deltaX * current.owner.options.current.direction;
  const distance = current.owner.options.current.allowReverse
    ? delta
    : Math.max(0, delta);
  trackVelocity(current, distance, timestamp);
}

/** A long press/menu owns the remainder of its original touch sequence. */
export function cancelHorizontalSwipe() {
  cancel();
}

function isEdgeMovement(current: Gesture, touch: Touch) {
  if (current.owner) return current.owner.priorityEdge;
  return (
    touch.clientX > current.x &&
    current.candidates.some(
      ({ priorityEdge, options }) => priorityEdge && options.current.enabled
    )
  );
}

function move(event: TouchEvent) {
  const current = gesture;
  const touch = event.touches[0];
  if (
    !current ||
    !touch ||
    event.touches.length !== 1 ||
    touch.identifier !== current.id
  ) {
    cancel();
    return;
  }
  // A coasting horizontal row can make the next touch non-cancelable. An edge
  // Back still tracks that finger; ordinary content continues to yield.
  if (!event.cancelable && !isEdgeMovement(current, touch)) {
    cancel();
    return;
  }
  track(current, touch, event.timeStamp);
  if (gesture !== current || !current.owner) return;
  if (event.cancelable) event.preventDefault();
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
  if (current.owner) track(current, touch, event.timeStamp);
  finish(true, event.timeStamp);
}

function removeCandidate(candidate: Candidate | null) {
  if (!candidate || !gesture) return;
  if (gesture.owner === candidate) {
    cancel();
    return;
  }
  const index = gesture.candidates.indexOf(candidate);
  if (index >= 0) {
    gesture.candidates.splice(index, 1);
    if (candidate.options.current.captureOnPress)
      candidate.options.current.onEnd(false, 0, 0);
  }
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
    const priorityEdge = isPriorityEdge(latest.current, touch.clientX);
    // Portalled dialogs keep their own Back/draft guards, even at the edge.
    if (
      !(event.target instanceof Element) ||
      !event.currentTarget.contains(event.target)
    )
      return;
    // Other consumers retain the OS/browser reserve and all content exclusions.
    if (
      !priorityEdge &&
      (touch.clientX < EDGE_RESERVE ||
        touch.clientX > globalThis.innerWidth - EDGE_RESERVE ||
        ignoreTarget(event.currentTarget, event.target))
    )
      return;
    if (gesture?.id !== touch.identifier) {
      cancel();
      gesture = {
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        candidates: [],
        capture: priorityEdge,
        owner: null,
        distance: 0,
        velocityDistance: 0,
        velocityPeak: 0,
        velocityPeakAt: performance.now(),
        velocity: 0,
        velocitySamples: [{ distance: 0, time: event.timeStamp }],
        movedAt: performance.now(),
        frame: null,
      };
      // Edge navigation sees movement before nested controls can stop bubbling.
      document.addEventListener("touchmove", move, {
        passive: false,
        capture: priorityEdge,
      });
      document.addEventListener("touchend", end, {
        passive: true,
        capture: priorityEdge,
      });
      document.addEventListener("touchcancel", cancel, {
        passive: true,
        capture: priorityEdge,
      });
      document.addEventListener("touchstart", additionalTouch, {
        passive: true,
      });
      globalThis.addEventListener("blur", cancel);
    }
    const next = {
      element: event.currentTarget,
      options: latest,
      priorityEdge,
    };
    candidate.current = next;
    gesture.candidates.push(next);
    if (latest.current.captureOnPress) latest.current.onStart?.();
  }, []);
}
