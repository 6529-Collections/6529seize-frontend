"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { DesktopUpdateState } from "@/lib/desktop/updateState";
import {
  noteDesktopUpdateStartedHere,
  restartDesktopToUpdate,
  startDesktopUpdate,
} from "@/services/desktop/desktopUpdateState";

type Locale = ReturnType<typeof useBrowserLocale>;

const UPDATE_PRIMARY_CLASS =
  "tw-min-h-11 tw-rounded-lg tw-border-0 tw-bg-white tw-px-4 tw-py-2 tw-font-semibold tw-text-black focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50";
export const UPDATE_SECONDARY_CLASS =
  "tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-transparent tw-px-4 tw-py-2 tw-font-semibold tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50";

/** Identifies a state for "until the state changes" (dismissal, problems). */
export const desktopUpdateStateKey = (state: DesktopUpdateState): string =>
  `${state.id}:${state.version ?? ""}:${state.mustUpdate === true ? "must" : ""}`;

/**
 * "Update now", "Try again" and "Restart to update", with what to say when
 * the app does not go ahead. The app's own reason is shown as it gives it
 * (for example "Please wait a moment and try again."), never as a failed
 * update, and nothing is retried by itself. A problem belongs to the state
 * it happened in and is gone once the state changes.
 */
export function useDesktopUpdateActions(locale: Locale, stateKey: string) {
  const [problem, setProblem] = useState<{
    readonly key: string;
    readonly text: string;
  } | null>(null);
  // What the app is doing after it took "Update now" / "Try again", until
  // its state says more.
  const [progress, setProgress] = useState<string | null>(null);
  // Feedback belongs to one state: a new state clears it, and an answer to
  // an action taken before any state change is dropped, even if the same
  // state comes back (each change starts a new generation).
  const generation = useRef(0);
  const [seenKey, setSeenKey] = useState(stateKey);
  if (seenKey !== stateKey) {
    setSeenKey(stateKey);
    setProblem(null);
    setProgress(null);
  }
  useLayoutEffect(() => {
    generation.current += 1;
  }, [stateKey]);
  const still = (taken: number) => generation.current === taken;
  const show = (taken: number, key: string, text: string) => {
    if (still(taken)) setProblem({ key, text });
  };

  const update = () => {
    const key = stateKey;
    const taken = generation.current;
    setProblem(null);
    setProgress(null);
    startDesktopUpdate()
      .then((reason) => {
        if (reason === null) {
          if (still(taken)) setProgress(key);
          return;
        }
        // Refused: no download started from here after all.
        noteDesktopUpdateStartedHere(null);
        show(
          taken,
          key,
          reason || t(locale, "desktop.update.updateNotStarted")
        );
      })
      .catch(() => {
        noteDesktopUpdateStartedHere(null);
        show(taken, key, t(locale, "desktop.update.updateNotStarted"));
      });
  };

  const restart = () => {
    const key = stateKey;
    const taken = generation.current;
    setProblem(null);
    restartDesktopToUpdate()
      .then((reason) => {
        if (reason === null) return;
        show(
          taken,
          key,
          reason
            ? t(locale, "desktop.update.restartFailedReason", { reason })
            : t(locale, "desktop.update.restartFailed")
        );
      })
      .catch(() => show(taken, key, t(locale, "desktop.update.restartFailed")));
  };

  return {
    problem: problem?.key === stateKey ? problem.text : null,
    progress:
      progress === stateKey ? t(locale, "desktop.update.requested") : null,
    showProblem: (text: string) => setProblem({ key: stateKey, text }),
    clearProblem: () => setProblem(null),
    update,
    restart,
  };
}

/** The state's own action, by the names the release standard gives them. */
export function DesktopUpdatePrimaryButtons({
  state,
  offerUpdate,
  locale,
  onUpdate,
  onRestart,
}: {
  readonly state: DesktopUpdateState;
  readonly offerUpdate: boolean;
  readonly locale: Locale;
  readonly onUpdate: () => void;
  readonly onRestart: () => void;
}) {
  let action: { readonly label: string; readonly run: () => void } | null =
    null;
  if (offerUpdate) {
    action = { label: t(locale, "desktop.update.updateNow"), run: onUpdate };
  } else if (state.id === "U8") {
    action = { label: t(locale, "desktop.update.restart"), run: onRestart };
  } else if (state.id === "U11" && state.state !== "went_back") {
    // After a release went back, the app does not try the same release
    // again (R49): "Try again" would do nothing, so it is not offered.
    action = { label: t(locale, "desktop.update.tryAgain"), run: onUpdate };
  }
  if (!action) return null;
  return (
    <button type="button" className={UPDATE_PRIMARY_CLASS} onClick={action.run}>
      {action.label}
    </button>
  );
}
