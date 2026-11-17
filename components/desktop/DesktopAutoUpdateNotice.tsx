"use client";

import { useId, useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  type DesktopUpdateState,
  desktopUpdateTone,
} from "@/lib/desktop/updateState";
import {
  restartDesktopToUpdate,
  startDesktopUpdate,
} from "@/services/desktop/desktopUpdateState";
import {
  DesktopUpdateHeadline,
  UPDATE_PRIMARY_CLASS,
  UPDATE_SECONDARY_CLASS,
} from "./DesktopUpdatePanel";

const NOTICE_CLASS =
  "tw-fixed tw-inset-x-4 tw-bottom-4 tw-z-[1000] tw-rounded-xl tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-950 tw-p-4 tw-text-white tw-shadow-xl sm:tw-inset-x-auto sm:tw-bottom-6 sm:tw-right-6 sm:tw-w-96";

/** States that ask something of the person, so the notice shows them. */
const NOTICE_STATES = new Set(["U4", "U5", "U8", "U11", "U12"]);
/** States with a release to download by hand ("Update now"). */
const OFFERS_UPDATE = new Set(["U4", "U5", "U12"]);

const stateKey = (state: DesktopUpdateState) =>
  `${state.id}:${state.version ?? ""}`;

/**
 * The update notice for 6529 Desktop builds that install their own updates,
 * driven by the state the app reports. It shows a newer release, an urgent
 * or unsafe one, a downloaded one ("Restart to update") and a failed one
 * ("Try again"), in the app's words. "Not now" hides it until the state
 * changes; urgent and unsafe states stay until they clear (release standard
 * R54). Background checks and downloads stay quiet.
 */
export default function DesktopAutoUpdateNotice({
  state,
}: {
  readonly state: DesktopUpdateState | null;
}) {
  const locale = useBrowserLocale();
  const messageId = useId();
  const [dismissed, setDismissed] = useState<string | null>(null);
  // The download the person started here stays visible while it runs.
  const [startedFor, setStartedFor] = useState<string | null>(null);
  const [problem, setProblem] = useState<{
    readonly key: string;
    readonly text: string;
  } | null>(null);

  if (!state) return null;
  const key = stateKey(state);
  const followingDownload =
    state.id === "U7" && startedFor !== null && startedFor === state.version;
  if ((!NOTICE_STATES.has(state.id) && !followingDownload) || dismissed === key)
    return null;

  const red = desktopUpdateTone(state.id) === "alert";
  const offerUpdate = OFFERS_UPDATE.has(state.id) && state.version !== null;

  const update = () => {
    setStartedFor(state.version);
    // A refusal is said as the app says it, never retried by itself.
    startDesktopUpdate()
      .then((reason) => {
        if (reason) setProblem({ key, text: reason });
      })
      .catch(() => undefined);
  };
  const restart = () => {
    restartDesktopToUpdate()
      .then((reason) => {
        if (reason === null) return;
        const failed = t(locale, "desktop.update.restartFailed");
        setProblem({ key, text: reason ? `${failed} ${reason}` : failed });
      })
      .catch(() =>
        setProblem({ key, text: t(locale, "desktop.update.restartFailed") })
      );
  };

  return (
    <section
      aria-labelledby={messageId}
      className={`tailwind-scope ${NOTICE_CLASS}`}
    >
      <output
        id={messageId}
        aria-live="polite"
        aria-atomic="true"
        className="tw-mb-3 tw-block"
      >
        <DesktopUpdateHeadline state={state} locale={locale} />
      </output>
      <div role="alert" className="tw-mb-3 tw-text-sm empty:tw-hidden">
        {problem?.key === key ? problem.text : null}
      </div>
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        {offerUpdate && (
          <button
            type="button"
            className={UPDATE_PRIMARY_CLASS}
            onClick={update}
          >
            {t(locale, "desktop.update.updateNow")}
          </button>
        )}
        {state.id === "U8" && (
          <button
            type="button"
            className={UPDATE_PRIMARY_CLASS}
            onClick={restart}
          >
            {t(locale, "desktop.update.restart")}
          </button>
        )}
        {state.id === "U11" && (
          <button
            type="button"
            className={UPDATE_PRIMARY_CLASS}
            onClick={update}
          >
            {t(locale, "desktop.update.tryAgain")}
          </button>
        )}
        {!red && !followingDownload && (
          <button
            type="button"
            className={UPDATE_SECONDARY_CLASS}
            onClick={() => setDismissed(key)}
          >
            {t(locale, "desktop.update.notNow")}
          </button>
        )}
      </div>
    </section>
  );
}
