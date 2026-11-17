"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { getDesktopShellApi, getDesktopUpdater } from "@/helpers/desktop-shell";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatNumber } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { checkDesktopUpdates } from "@/lib/desktop/checkDesktopUpdates";
import {
  DEFAULT_DESKTOP_DOWNLOAD_PAGE,
  readDesktopDownloadPage,
} from "@/lib/desktop/updateDownloadPage";
import {
  getDesktopAutoUpdate,
  getServerDesktopAutoUpdate,
  subscribeDesktopAutoUpdate,
} from "@/services/desktop/desktopUpdateState";
import DesktopAutoUpdateNotice from "./DesktopAutoUpdateNotice";

type UpdateState =
  | { readonly kind: "idle" }
  | { readonly kind: "available"; readonly version: string | null }
  | { readonly kind: "downloading"; readonly percent: number | null }
  | { readonly kind: "ready"; readonly version: string | null }
  | { readonly kind: "failed"; readonly version: string | null }
  /** The download page was opened in the system browser. */
  | { readonly kind: "pageOpened"; readonly version: string | null }
  /** The download page could not be opened. */
  | { readonly kind: "pageFailed"; readonly version: string | null };

/**
 * Whether this app downloads and installs updates itself (the older 6529
 * Desktop does). The new app says it does not (`getInfo()` reports
 * `supportsInAppUpdates: false`); then, or when the shell cannot be asked
 * or has no download, the notice opens the download page instead.
 */
async function readInAppUpdates(): Promise<boolean> {
  const api = getDesktopShellApi();
  const updater = getDesktopUpdater();
  if (!api || typeof updater?.downloadUpdate !== "function") return false;
  try {
    const info = await api.getInfo();
    return info.supportsInAppUpdates !== false;
  } catch {
    return false;
  }
}

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
 * one. An app that updates itself downloads it (progress, restart to
 * install); the new app, which does not, opens the download page in the
 * system browser and never asks the shell to download. Silent when there is
 * no update, when the updater reports none, and on the web.
 */
function EventUpdateNotice() {
  const locale = useBrowserLocale();
  const messageId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const messageRef = useRef<HTMLElement>(null);
  const focusMessageNext = useRef(false);
  const [state, setState] = useState<UpdateState>({ kind: "idle" });
  const [dismissed, setDismissed] = useState(false);
  // Until the shell answers, opening the download page is the safe action.
  const [inAppUpdates, setInAppUpdates] = useState(false);
  const inAppUpdatesRef = useRef(false);
  const [downloadPage, setDownloadPage] = useState(
    DEFAULT_DESKTOP_DOWNLOAD_PAGE
  );

  useEffect(() => {
    const updater = getDesktopUpdater();
    if (!updater) return undefined;
    let active = true;
    readInAppUpdates()
      .then((value) => {
        if (!active) return;
        inAppUpdatesRef.current = value;
        setInAppUpdates(value);
      })
      .catch(() => undefined);
    const onAvailable = (_event: unknown, info?: unknown) => {
      setDismissed(false);
      setDownloadPage(readDesktopDownloadPage(info));
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
      // background check stays silent. An app that does not download only
      // reports check errors, never a failed download.
      if (!inAppUpdatesRef.current) return;
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
    void checkDesktopUpdates(updater);
    return () => {
      active = false;
      updater.offUpdateAvailable(onAvailable);
      updater.offUpdateNotAvailable(onNotAvailable);
      updater.offUpdateProgress(onProgress);
      updater.offUpdateDownloaded(onDownloaded);
      updater.offUpdateError(onError);
    };
  }, []);

  // The buttons change with each step; keep keyboard focus in the notice
  // by moving it to the message when the focused button goes away.
  useEffect(() => {
    if (!focusMessageNext.current) return;
    focusMessageNext.current = false;
    messageRef.current?.focus();
  }, [state.kind]);

  if (state.kind === "idle" || dismissed) return null;

  const rememberFocus = () => {
    focusMessageNext.current =
      sectionRef.current?.contains(document.activeElement) === true;
  };

  const openDownloadPage = () => {
    const version = "version" in state ? state.version : null;
    const api = getDesktopShellApi();
    try {
      if (!api) throw new Error("No desktop shell");
      api.openExternal(downloadPage);
      setState({ kind: "pageOpened", version });
    } catch {
      setState({ kind: "pageFailed", version });
    }
  };

  const startDownload = () => {
    if (!inAppUpdates) {
      openDownloadPage();
      return;
    }
    rememberFocus();
    const version = "version" in state ? state.version : null;
    const fail = () => setState({ kind: "failed", version });
    setState({ kind: "downloading", percent: null });
    const updater = getDesktopUpdater();
    if (!updater) {
      fail();
      return;
    }
    try {
      // A throw or a rejected IPC promise leaves the notice in "failed";
      // errors the host reports later arrive through onUpdateError.
      updater.downloadUpdate()?.catch(fail);
    } catch {
      fail();
    }
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
  } else if (state.kind === "pageOpened") {
    message = t(locale, "desktopUpdate.pageOpened");
  } else if (state.kind === "pageFailed") {
    message = t(locale, "desktopUpdate.pageFailed", { url: downloadPage });
  } else if (state.kind === "ready") {
    message = t(locale, "desktopUpdate.ready");
  } else {
    message = state.version
      ? t(locale, "desktopUpdate.availableVersion", { version: state.version })
      : t(locale, "desktopUpdate.available");
  }

  return (
    <section
      ref={sectionRef}
      aria-labelledby={messageId}
      className={`tailwind-scope ${NOTICE_CLASS}`}
    >
      {state.kind === "failed" || state.kind === "pageFailed" ? (
        <p
          ref={(element) => {
            messageRef.current = element;
          }}
          id={messageId}
          role="alert"
          tabIndex={-1}
          className="tw-mb-3 tw-mt-0"
        >
          {message}
        </p>
      ) : (
        <output
          ref={(element) => {
            messageRef.current = element;
          }}
          id={messageId}
          aria-live="polite"
          aria-atomic="true"
          tabIndex={-1}
          className="tw-mb-3 tw-block"
        >
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
            {t(
              locale,
              inAppUpdates ? "desktopUpdate.download" : "desktopUpdate.openPage"
            )}
          </button>
        )}
        {(state.kind === "pageOpened" || state.kind === "pageFailed") && (
          <button
            type="button"
            className={PRIMARY_CLASS}
            onClick={openDownloadPage}
          >
            {t(locale, "desktopUpdate.openPage")}
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

/**
 * The update notice. Builds that install their own updates report a state
 * (U1-U14) and get the notice driven by it; every other build (0.1.0-rc.2,
 * the older app) keeps the event-driven notice above. Silent on the web.
 */
export default function DesktopUpdateNotice() {
  const auto = useSyncExternalStore(
    subscribeDesktopAutoUpdate,
    getDesktopAutoUpdate,
    getServerDesktopAutoUpdate
  );
  if (auto.support === "supported") {
    return <DesktopAutoUpdateNotice state={auto.state} />;
  }
  return <EventUpdateNotice />;
}
