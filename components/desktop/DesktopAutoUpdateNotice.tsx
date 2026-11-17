"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  type DesktopUpdateState,
  desktopUpdateTone,
} from "@/lib/desktop/updateState";
import {
  getDesktopUpdateStartedHere,
  noteDesktopUpdateStartedHere,
} from "@/services/desktop/desktopUpdateState";
import { DesktopUpdateHeadline } from "./DesktopUpdatePanel";
import {
  DesktopUpdatePrimaryButtons,
  desktopUpdateStateKey,
  UPDATE_SECONDARY_CLASS,
  useDesktopUpdateActions,
} from "./desktopUpdateActions";

const NOTICE_CLASS =
  "tw-fixed tw-inset-x-4 tw-bottom-4 tw-z-[1000] tw-rounded-xl tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-950 tw-p-4 tw-text-white tw-shadow-xl sm:tw-inset-x-auto sm:tw-bottom-6 sm:tw-right-6 sm:tw-w-96";

/** States that ask something of the person, so the notice shows them. */
const NOTICE_STATES = new Set(["U4", "U5", "U8", "U11", "U12"]);
/** States with a release to download by hand ("Update now"). */
const OFFERS_UPDATE = new Set(["U4", "U5", "U12"]);

/**
 * The update notice for 6529 Desktop builds that install their own updates,
 * driven by the state the app reports. It shows a newer release, an urgent
 * or unsafe one, a downloaded one ("Restart to update") and a failed one
 * ("Try again"), in the app's words, and follows a download started from
 * it. "Not now" hides it until the state changes; urgent and unsafe states
 * stay until they clear (release standard R54). Background checks and
 * downloads stay quiet.
 */
export default function DesktopAutoUpdateNotice({
  state,
}: {
  readonly state: DesktopUpdateState | null;
}) {
  const locale = useBrowserLocale();
  const messageId = useId();
  const key = state ? desktopUpdateStateKey(state) : "";
  const actions = useDesktopUpdateActions(locale, key);
  const sectionRef = useRef<HTMLElement>(null);
  const messageRef = useRef<HTMLOutputElement>(null);
  const focusMessageNext = useRef(false);
  // "Not now" lasts until the state changes, even if it later comes back.
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [seenKey, setSeenKey] = useState(key);
  if (seenKey !== key) {
    setSeenKey(key);
    setDismissed(null);
  }

  // The buttons change with the state; keep keyboard focus in the notice by
  // moving it to the message when the focused button goes away.
  useEffect(() => {
    if (!focusMessageNext.current) return;
    focusMessageNext.current = false;
    // Only when focus went with the button: never pull it back from
    // wherever the person moved it in the meantime.
    const active = document.activeElement;
    const lost =
      active === null ||
      active === document.body ||
      sectionRef.current?.contains(active) === true;
    if (lost) messageRef.current?.focus();
  }, [key]);

  if (!state) return null;
  const followingDownload =
    state.id === "U7" &&
    state.version !== null &&
    getDesktopUpdateStartedHere() === state.version;
  if ((!NOTICE_STATES.has(state.id) && !followingDownload) || dismissed === key)
    return null;

  const red = desktopUpdateTone(state.id) === "alert";
  const offerUpdate = OFFERS_UPDATE.has(state.id) && state.version !== null;
  const rememberFocus = () => {
    focusMessageNext.current =
      sectionRef.current?.contains(document.activeElement) === true;
  };

  return (
    <section
      ref={sectionRef}
      aria-labelledby={messageId}
      className={`tailwind-scope ${NOTICE_CLASS}`}
    >
      <output
        ref={messageRef}
        id={messageId}
        aria-live="polite"
        aria-atomic="true"
        tabIndex={-1}
        className="tw-mb-3 tw-block"
      >
        <DesktopUpdateHeadline state={state} locale={locale} />
      </output>
      <div role="alert" className="tw-mb-3 tw-text-sm empty:tw-hidden">
        {actions.problem}
      </div>
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        <DesktopUpdatePrimaryButtons
          state={state}
          offerUpdate={offerUpdate}
          locale={locale}
          onUpdate={() => {
            rememberFocus();
            noteDesktopUpdateStartedHere(state.version);
            actions.update();
          }}
          onRestart={() => {
            rememberFocus();
            actions.restart();
          }}
        />
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
