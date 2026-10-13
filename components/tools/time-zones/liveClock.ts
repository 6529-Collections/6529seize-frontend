"use client";

import { useSyncExternalStore } from "react";

// One shared timer drives every live value on the page. Minute subscribers
// are notified once per minute, aligned to the minute boundary; second
// subscribers (small clock readouts only) once per second. The timer stops
// while the document is hidden and catches up immediately when it is shown.

type Listener = () => void;

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
// Fire slightly after the boundary so the new minute is always observed.
const BOUNDARY_DELAY_MS = 20;

const minuteListeners = new Set<Listener>();
const secondListeners = new Set<Listener>();

let currentSecond = 0;
let currentMinute = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
let visibilityListenerAttached = false;

function floorTo(value: number, unit: number): number {
  return value - (value % unit);
}

function hasListeners(): boolean {
  return minuteListeners.size > 0 || secondListeners.size > 0;
}

function isDocumentHidden(): boolean {
  return (
    typeof document !== "undefined" && document.visibilityState === "hidden"
  );
}

// Updates the snapshots; returns which granularities changed.
function refreshSnapshots(now: number) {
  const second = floorTo(now, MS_PER_SECOND);
  const minute = floorTo(now, MS_PER_MINUTE);
  const secondChanged = second !== currentSecond;
  const minuteChanged = minute !== currentMinute;
  currentSecond = second;
  currentMinute = minute;
  return { secondChanged, minuteChanged };
}

function notify(listeners: ReadonlySet<Listener>) {
  for (const listener of listeners) {
    listener();
  }
}

function clearTimer() {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
}

function scheduleNextTick() {
  clearTimer();
  if (!hasListeners() || isDocumentHidden()) {
    return;
  }
  const now = Date.now();
  const unit = secondListeners.size > 0 ? MS_PER_SECOND : MS_PER_MINUTE;
  const delay = floorTo(now, unit) + unit - now + BOUNDARY_DELAY_MS;
  timer = setTimeout(tick, delay);
}

function tick() {
  // Also called directly (subscribe, visibility); never leave a stale timer.
  clearTimer();
  const { secondChanged, minuteChanged } = refreshSnapshots(Date.now());
  if (minuteChanged) {
    notify(minuteListeners);
  }
  if (secondChanged) {
    notify(secondListeners);
  }
  scheduleNextTick();
}

function handleVisibilityChange() {
  if (isDocumentHidden()) {
    clearTimer();
    return;
  }
  tick();
}

function attachVisibilityListener() {
  if (visibilityListenerAttached || typeof document === "undefined") {
    return;
  }
  document.addEventListener("visibilitychange", handleVisibilityChange);
  visibilityListenerAttached = true;
}

function detachVisibilityListenerWhenIdle() {
  if (hasListeners() || !visibilityListenerAttached) {
    return;
  }
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  visibilityListenerAttached = false;
  clearTimer();
}

function subscribeTo(listeners: Set<Listener>) {
  return (listener: Listener) => {
    listeners.add(listener);
    attachVisibilityListener();
    // Catch every subscriber up to the current time and (re)arm the timer
    // at the finest granularity anyone needs.
    tick();
    return () => {
      listeners.delete(listener);
      if (hasListeners()) {
        scheduleNextTick();
      } else {
        detachVisibilityListenerWhenIdle();
      }
    };
  };
}

const subscribeToMinute = subscribeTo(minuteListeners);
const subscribeToSecond = subscribeTo(secondListeners);

// While nobody is subscribed the timer is idle, so a first render reads the
// current time instead of a value left over from an earlier visit.
function refreshWhenIdle() {
  if (!hasListeners()) {
    refreshSnapshots(Date.now());
  }
}

function getMinuteSnapshot(): number {
  refreshWhenIdle();
  return currentMinute;
}

function getSecondSnapshot(): number {
  refreshWhenIdle();
  return currentSecond;
}

// The server render and hydration see `null`, so live values render only
// after mount and never cause hydration mismatches.
function getServerSnapshot(): null {
  return null;
}

export function useMinuteNow(): number | null {
  return useSyncExternalStore(
    subscribeToMinute,
    getMinuteSnapshot,
    getServerSnapshot
  );
}

export function useSecondNow(): number | null {
  return useSyncExternalStore(
    subscribeToSecond,
    getSecondSnapshot,
    getServerSnapshot
  );
}
