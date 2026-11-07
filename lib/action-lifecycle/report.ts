import { getNodeEnv } from "@/config/env";

import type { ActionEventType, ActionMode, ActionStateKind } from "./types";

export interface IllegalTransition {
  readonly from: ActionStateKind;
  readonly mode: ActionMode;
  readonly event: ActionEventType;
}

export type IllegalTransitionReporter = (report: IllegalTransition) => void;

const warnOutsideProduction: IllegalTransitionReporter = (report) => {
  if (getNodeEnv() === "production") {
    return;
  }
  console.warn(
    `[action-lifecycle] ignored ${report.event} in ${report.mode}/${report.from}`
  );
};

let defaultReporter: IllegalTransitionReporter | null = warnOutsideProduction;

/**
 * Replaces the module-wide default reporter; `null` silences it. Returns a
 * function that restores the previous one. Prefer passing a reporter to
 * `transition` (or to the store) over changing the default.
 */
export function setIllegalTransitionReporter(
  next: IllegalTransitionReporter | null
): () => void {
  const previous = defaultReporter;
  defaultReporter = next;
  return () => {
    defaultReporter = previous;
  };
}

/** Reports to `reporter` when given (null silences), else to the default. */
export function reportIllegalTransition(
  report: IllegalTransition,
  reporter?: IllegalTransitionReporter | null
): void {
  const target = reporter === undefined ? defaultReporter : reporter;
  try {
    target?.(report);
  } catch {
    // Reporting must never break the caller.
  }
}

/**
 * One lifecycle step, for telemetry. Kinds and types only: no payloads,
 * transaction IDs, error strings, reasons or record IDs leave the machine.
 * Illegal attempts are observed too, with `to === from` and `legal: false`.
 */
export interface ActionTransition {
  readonly from: ActionStateKind;
  readonly event: ActionEventType;
  readonly to: ActionStateKind;
  readonly mode: ActionMode;
  readonly legal: boolean;
}

export type TransitionObserver = (transition: ActionTransition) => void;

/** One entry per registration, so the same function can be added twice. */
const observers = new Set<{ readonly observe: TransitionObserver }>();

/**
 * Observes every `transition()` call, app-wide. Returns a function that
 * removes this registration; calling it again does nothing.
 */
export function addTransitionObserver(observe: TransitionObserver): () => void {
  const entry = { observe };
  observers.add(entry);
  return () => {
    observers.delete(entry);
  };
}

function safelyObserve(
  observe: TransitionObserver,
  transition: ActionTransition
): void {
  try {
    observe(transition);
  } catch {
    // One failing observer must not break the caller or the others.
  }
}

/** Tells the app-wide observers and, when given, a scoped one. */
export function notifyTransitionObservers(
  transition: ActionTransition,
  scoped?: TransitionObserver | null
): void {
  if (scoped !== undefined && scoped !== null) {
    safelyObserve(scoped, transition);
  }
  // A snapshot: observers may unsubscribe while being told.
  for (const { observe } of [...observers]) {
    safelyObserve(observe, transition);
  }
}

/** True when a transition would reach anyone; lets callers skip the object. */
export function hasTransitionObservers(
  scoped?: TransitionObserver | null
): boolean {
  return observers.size > 0 || (scoped !== undefined && scoped !== null);
}
