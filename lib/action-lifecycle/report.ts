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

let reporter: IllegalTransitionReporter | null = warnOutsideProduction;

/**
 * Replaces the reporter for illegal transitions (tests collect them). Returns
 * the previous reporter so callers can restore it; `null` silences reports.
 */
export function setIllegalTransitionReporter(
  next: IllegalTransitionReporter | null
): IllegalTransitionReporter | null {
  const previous = reporter;
  reporter = next;
  return previous;
}

export function reportIllegalTransition(report: IllegalTransition): void {
  try {
    reporter?.(report);
  } catch {
    // Reporting must never break the caller.
  }
}
