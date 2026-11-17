"use client";

import { useId, useState } from "react";
import { getDesktopShellApi } from "@/helpers/desktop-shell";
import type { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { DEFAULT_DESKTOP_DOWNLOAD_PAGE } from "@/lib/desktop/updateDownloadPage";
import {
  type DesktopUpdateState,
  desktopUpdateTone,
  formatDesktopUpdateTime,
} from "@/lib/desktop/updateState";
import {
  checkDesktopUpdateNow,
  setDesktopUpdateSettings,
} from "@/services/desktop/desktopUpdateState";
import {
  DesktopUpdatePrimaryButtons,
  desktopUpdateStateKey,
  UPDATE_SECONDARY_CLASS,
  useDesktopUpdateActions,
} from "./desktopUpdateActions";

type Locale = ReturnType<typeof useBrowserLocale>;

const LINK_CLASS =
  "tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 tw-text-left tw-text-sm tw-font-medium tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

/** States whose release can be downloaded by hand ("Update now"). */
const OFFERS_UPDATE = new Set(["U4", "U5", "U6", "U12", "U13"]);
/** States about a release whose notes the person may want first (R57). */
const HAS_NOTES = new Set(["U4", "U5", "U6", "U7", "U8", "U12", "U13"]);

const TONE_CLASS = {
  quiet: "tw-border-iron-700 tw-text-iron-100",
  warning: "tw-border-amber-400/60 tw-text-amber-100",
  alert: "tw-border-red-400/70 tw-bg-red-500/10 tw-text-red-100",
} as const;

/** Opens a 6529.io page in the system browser. */
function openOnWebsite(url: string): void {
  try {
    getDesktopShellApi()?.openExternal(url);
  } catch {
    // The link text names the page, so it can be opened by hand.
  }
}

const releaseNotesUrl = (version: string) =>
  `${DEFAULT_DESKTOP_DOWNLOAD_PAGE}/releases#${encodeURIComponent(version)}`;

/** The app's sentence for a state, in the look the standard gives it. */
export function DesktopUpdateHeadline({
  state,
  locale,
}: {
  readonly state: DesktopUpdateState;
  readonly locale: Locale;
}) {
  const tone = desktopUpdateTone(state);
  const lastChecked =
    state.checkedAt !== null && state.id !== "U1"
      ? t(locale, "desktop.update.lastChecked", {
          time: formatDesktopUpdateTime(state.checkedAt),
        })
      : null;
  return (
    <div
      className={`tw-rounded-lg tw-border tw-border-solid tw-p-3 ${TONE_CLASS[tone]}`}
    >
      <p className="tw-m-0 tw-text-sm tw-font-semibold">{state.headline}</p>
      {state.note && (
        <p className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-300">
          {state.note}
        </p>
      )}
      {lastChecked && (
        <p className="tw-m-0 tw-mt-1 tw-text-xs tw-text-iron-400">
          {lastChecked}
        </p>
      )}
    </div>
  );
}

function SettingSwitch({
  label,
  checked,
  disabled,
  description,
  onChange,
}: {
  readonly label: string;
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly description: string | null;
  readonly onChange: (next: boolean) => void;
}) {
  const labelId = useId();
  const descriptionId = useId();
  return (
    <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
      <div className="tw-min-w-0">
        <span
          id={labelId}
          className="tw-text-sm tw-font-medium tw-text-iron-100"
        >
          {label}
        </span>
        {description && (
          <p
            id={descriptionId}
            className="tw-m-0 tw-mt-0.5 tw-text-xs tw-text-iron-400"
          >
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`tw-relative tw-inline-flex tw-h-6 tw-w-11 tw-flex-none tw-cursor-pointer tw-items-center tw-rounded-full tw-border-2 tw-border-solid tw-border-transparent tw-p-0 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 motion-reduce:tw-transition-none ${
          checked ? "tw-bg-primary-500" : "tw-bg-iron-700"
        }`}
      >
        <span
          aria-hidden="true"
          className={`tw-inline-block tw-h-5 tw-w-5 tw-rounded-full tw-bg-iron-50 tw-transition-transform motion-reduce:tw-transition-none ${
            checked ? "tw-translate-x-5" : "tw-translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

/**
 * The update view of 6529 Desktop's About dialog, for builds that install
 * their own updates: the running version, the state in the app's own words,
 * the buttons the release standard names for it (Check now, Update now,
 * Restart to update, Try again), the release notes link, and the two
 * settings. An install that cannot update by itself shows no switches.
 */
export default function DesktopUpdatePanel({
  state,
  locale,
}: {
  readonly state: DesktopUpdateState;
  readonly locale: Locale;
}) {
  const headingId = useId();
  const notesHeadingId = useId();
  const [saving, setSaving] = useState(false);
  const actions = useDesktopUpdateActions(locale, desktopUpdateStateKey(state));

  const changeSetting = (settings: {
    readonly check?: boolean;
    readonly auto?: boolean;
  }) => {
    setSaving(true);
    actions.clearProblem();
    setDesktopUpdateSettings(settings)
      .then((reason) => {
        if (reason === null) return;
        actions.showProblem(
          reason || t(locale, "desktop.update.settingsFailed")
        );
      })
      .catch(() =>
        actions.showProblem(t(locale, "desktop.update.settingsFailed"))
      )
      .finally(() => setSaving(false));
  };

  const offerUpdate = OFFERS_UPDATE.has(state.id) && state.version !== null;
  const notesVersion =
    HAS_NOTES.has(state.id) && state.version !== null ? state.version : null;

  return (
    <section
      aria-labelledby={headingId}
      className="tw-flex tw-flex-col tw-gap-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pb-4 tw-pt-4"
    >
      <h3 id={headingId} className="tw-m-0 tw-text-base tw-font-semibold">
        {t(locale, "desktop.update.heading")}
      </h3>
      <output aria-live="polite" aria-atomic="true" className="tw-block">
        <DesktopUpdateHeadline state={state} locale={locale} />
        {actions.progress && (
          <span className="tw-mt-2 tw-block tw-text-sm tw-text-iron-300">
            {actions.progress}
          </span>
        )}
      </output>
      {notesVersion && state.releaseNotes && (
        <section aria-labelledby={notesHeadingId}>
          <h4
            id={notesHeadingId}
            className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100"
          >
            {t(locale, "desktop.update.notesHeading", {
              version: notesVersion,
            })}
          </h4>
          <p
            // Scrollable by keyboard when the notes are long.
            tabIndex={0}
            className="tw-m-0 tw-mt-1 tw-max-h-40 tw-overflow-y-auto tw-whitespace-pre-wrap tw-break-words tw-rounded-lg tw-bg-iron-900 tw-p-3 tw-text-sm tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {state.releaseNotes}
          </p>
        </section>
      )}
      {notesVersion && (
        <button
          type="button"
          className={LINK_CLASS}
          onClick={() =>
            openOnWebsite(state.notesUrl ?? releaseNotesUrl(notesVersion))
          }
        >
          {t(locale, "desktop.update.releaseNotes", { version: notesVersion })}
        </button>
      )}
      {state.id === "U14" && (
        <button
          type="button"
          className={LINK_CLASS}
          onClick={() => openOnWebsite(DEFAULT_DESKTOP_DOWNLOAD_PAGE)}
        >
          {t(locale, "desktop.update.downloadPage")}
        </button>
      )}
      <div
        role="alert"
        className="tw-text-sm tw-text-amber-100 empty:tw-hidden"
      >
        {actions.problem}
      </div>
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        <DesktopUpdatePrimaryButtons
          state={state}
          offerUpdate={offerUpdate}
          locale={locale}
          onUpdate={actions.update}
          onRestart={actions.restart}
        />
        <button
          type="button"
          className={UPDATE_SECONDARY_CLASS}
          onClick={checkDesktopUpdateNow}
        >
          {t(locale, "desktop.update.checkNow")}
        </button>
      </div>
      {state.canInstall && (
        <div className="tw-flex tw-flex-col tw-gap-3 tw-pt-1">
          <SettingSwitch
            label={t(locale, "desktop.update.settingCheck")}
            checked={state.check}
            disabled={saving}
            description={null}
            onChange={(check) => changeSetting({ check })}
          />
          <SettingSwitch
            label={t(locale, "desktop.update.settingAuto")}
            checked={state.auto && state.check}
            disabled={saving || !state.check}
            description={
              state.check
                ? null
                : t(locale, "desktop.update.settingAutoNeedsCheck")
            }
            onChange={(auto) => changeSetting({ auto })}
          />
        </div>
      )}
    </section>
  );
}
