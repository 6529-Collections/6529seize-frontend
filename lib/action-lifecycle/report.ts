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
