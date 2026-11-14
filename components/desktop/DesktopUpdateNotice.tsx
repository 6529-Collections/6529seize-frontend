"use client";

import { useEffect, useId, useState } from "react";
import { getDesktopUpdater } from "@/helpers/desktop-shell";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatNumber } from "@/i18n/format";
import { t } from "@/i18n/messages";

type UpdateState =
  | { readonly kind: "idle" }
  | { readonly kind: "available"; readonly version: string | null }
  | { readonly kind: "downloading"; readonly percent: number | null }
  | { readonly kind: "ready"; readonly version: string | null }
  | { readonly kind: "failed"; readonly version: string | null };

const NOTICE_CLASS =
  "tw-fixed tw-inset-x-4 tw-bottom-4 tw-z-[1000] tw-rounded-xl tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-950 tw-p-4 tw-text-white tw-shadow-xl sm:tw-inset-x-auto sm:tw-bottom-6 sm:tw-right-6 sm:tw-w-96";
const PRIMARY_CLASS =
  "tw-min-h-11 tw-rounded-lg tw-border-0 tw-bg-white tw-px-4 tw-py-2 tw-font-semibold tw-text-black focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";
const SECONDARY_CLASS =
  "tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-transparent tw-px-4 tw-py-2 tw-font-semibold tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400";

/** The version an updater event reports, if it reports a plausible one. */
const readVersion = (info: unknown): string | null => {
  if (typeof info !== "object" || info === null) return null;
  const version = (info as { readonly version?: unknown }).version;
  return typeof version === "string" && /^[\w.+-]{1,64}$/.test(version)
    ? version
    : null;
};

const readPercent = (progress: unknown): number | null => {
  if (typeof progress !== "object" || progress === null) return null;
  const percent = (progress as { readonly percent?: unknown }).percent;
  return typeof percent === "number" && Number.isFinite(percent)
    ? Math.min(100, Math.max(0, percent))
    : null;
};

/**
 * Inside 6529 Desktop: offers an app update when the desktop updater reports
 * one (download, progress, restart to install). Silent when there is no
 * update, when the updater reports none, and on the web.
 */
export default function DesktopUpdateNotice() {
  const locale = useBrowserLocale();
  const messageId = useId();
  const [state, setState] = useState<UpdateState>({ kind: "idle" });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const updater = getDesktopUpdater();
    if (!updater) return undefined;
    const onAvailable = (_event: unknown, info?: unknown) => {
      setDismissed(false);
      setState({ kind: "available", version: readVersion(info) });
    };
    const onNotAvailable = () => {
      setState({ kind: "idle" });
    };
    const onProgress = (_event: unknown, progress?: unknown) => {
      setState({ kind: "downloading", percent: readPercent(progress) });
    };
    const onDownloaded = (_event: unknown, info?: unknown) => {
      setDismissed(false);
      setState((current) => ({
        kind: "ready",
        version:
          readVersion(info) ?? ("version" in current ? current.version : null),
      }));
    };
    const onError = () => {
      // Errors matter only while the user is getting an update; a failed
      // background check stays silent.
      setState((current) =>
        current.kind === "idle"
          ? current
          : {
              kind: "failed",
              version: "version" in current ? current.version : null,
            }
      );
    };
    updater.onUpdateAvailable(onAvailable);
    updater.onUpdateNotAvailable(onNotAvailable);
    updater.onUpdateProgress(onProgress);
    updater.onUpdateDownloaded(onDownloaded);
    updater.onUpdateError(onError);
    updater.checkUpdates();
    return () => {
      updater.offUpdateAvailable(onAvailable);
      updater.offUpdateNotAvailable(onNotAvailable);
      updater.offUpdateProgress(onProgress);
      updater.offUpdateDownloaded(onDownloaded);
      updater.offUpdateError(onError);
    };
  }, []);

  if (state.kind === "idle" || dismissed) return null;

  const startDownload = () => {
    setState({ kind: "downloading", percent: null });
    getDesktopUpdater()?.downloadUpdate();
  };

  let message: string;
  if (state.kind === "downloading") {
    message =
      state.percent === null
        ? t(locale, "desktopUpdate.downloading")
        : t(locale, "desktopUpdate.downloadingPercent", {
            percent: formatNumber(locale, state.percent / 100, {
              style: "percent",
              maximumFractionDigits: 0,
            }),
          });
  } else if (state.kind === "failed") {
    message = t(locale, "desktopUpdate.failed");
  } else if (state.kind === "ready") {
    message = t(locale, "desktopUpdate.ready");
  } else {
    message = state.version
      ? t(locale, "desktopUpdate.availableVersion", { version: state.version })
      : t(locale, "desktopUpdate.available");
  }

  return (
    <section
      aria-labelledby={messageId}
      className={`tailwind-scope ${NOTICE_CLASS}`}
    >
      {state.kind === "failed" ? (
        <p id={messageId} role="alert" className="tw-mb-3 tw-mt-0">
          {message}
        </p>
      ) : (
        <output id={messageId} className="tw-mb-3 tw-block">
          {message}
        </output>
      )}
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        {state.kind === "available" && (
          <button
            type="button"
            className={PRIMARY_CLASS}
            onClick={startDownload}
          >
            {t(locale, "desktopUpdate.download")}
          </button>
        )}
        {state.kind === "failed" && (
          <button
            type="button"
            className={PRIMARY_CLASS}
            onClick={startDownload}
          >
            {t(locale, "desktopUpdate.retry")}
          </button>
        )}
        {state.kind === "ready" && (
          <button
            type="button"
            className={PRIMARY_CLASS}
            onClick={() => getDesktopUpdater()?.installUpdate()}
          >
            {t(locale, "desktopUpdate.restart")}
          </button>
        )}
        {state.kind !== "downloading" && (
          <button
            type="button"
            className={SECONDARY_CLASS}
            onClick={() => setDismissed(true)}
          >
            {t(locale, "desktopUpdate.later")}
          </button>
        )}
      </div>
    </section>
  );
}
