"use client";

import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  CheckIcon,
  InformationCircleIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import DesktopUpdatePanel from "@/components/desktop/DesktopUpdatePanel";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { publicEnv } from "@/config/env";
import { useGlobalRefresh } from "@/contexts/RefreshContext";
import { getDesktopShellApi, getDesktopUpdater } from "@/helpers/desktop-shell";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { desktopUpdateTone } from "@/lib/desktop/updateState";
import {
  getDesktopAutoUpdate,
  getServerDesktopAutoUpdate,
  subscribeDesktopAutoUpdate,
} from "@/services/desktop/desktopUpdateState";
import {
  checkDesktopUpdates,
  type DesktopUpdateCheckResult,
} from "@/lib/desktop/checkDesktopUpdates";
import styles from "./DesktopTitleStrip.module.css";

interface AppInfo {
  readonly version: string | null;
  readonly environment: string | null;
  /** The host drew the version before first paint (`--desktop-app-version`). */
  readonly drawnByHost: boolean;
}

type CopyStatus = "idle" | "copied" | "failed";

const UPDATE_CHECK_MESSAGES = {
  checking: "desktop.appInfo.checkingUpdates",
  current: "desktop.appInfo.noUpdates",
  available: "desktopUpdate.available",
  failed: "desktop.appInfo.checkFailed",
} as const;

type UpdateCheckStatus = "idle" | keyof typeof UPDATE_CHECK_MESSAGES;

const UPDATE_CHECK_MIN_VISIBLE_MS = 350;

/** The page's public address (the app itself runs on a local server). */
const getPublicLink = (): string => {
  const url = new URL(window.location.href);
  url.searchParams.delete("reload");
  return new URL(
    `${url.pathname}${url.search}${url.hash}`,
    publicEnv.BASE_ENDPOINT
  ).href;
};

interface NavigationState {
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
}

const NO_NAVIGATION: NavigationState = {
  canGoBack: false,
  canGoForward: false,
};

/**
 * The app window's history, from the shell: one shared subscription to its
 * change events, fanned out to every mounted strip, re-read on each change.
 * Reset when the last strip unmounts, so a remount never shows stale state.
 */
let navigationState = NO_NAVIGATION;
const navigationListeners = new Set<() => void>();
let stopNavigation: (() => void) | null = null;

function startNavigation(): (() => void) | null {
  const api = getDesktopShellApi();
  if (!api) return null;
  let active = true;
  // Reads can overlap and finish out of order; only a newer one commits.
  let lastRead = 0;
  let committedRead = 0;
  const refresh = () => {
    lastRead += 1;
    const read = lastRead;
    api
      .getNavigationState()
      .then((state) => {
        if (!active || read <= committedRead) return undefined;
        committedRead = read;
        const next = {
          canGoBack: state.canGoBack === true,
          canGoForward: state.canGoForward === true,
        };
        if (
          next.canGoBack !== navigationState.canGoBack ||
          next.canGoForward !== navigationState.canGoForward
        ) {
          navigationState = next;
          navigationListeners.forEach((listener) => listener());
        }
        return undefined;
      })
      .catch(() => undefined);
  };
  refresh();
  api.onNavigationStateChange(refresh);
  return () => {
    active = false;
    api.offNavigationStateChange(refresh);
  };
}

function subscribeNavigation(onChange: () => void): () => void {
  navigationListeners.add(onChange);
  stopNavigation ??= startNavigation();
  return () => {
    navigationListeners.delete(onChange);
    if (navigationListeners.size === 0) {
      stopNavigation?.();
      stopNavigation = null;
      navigationState = NO_NAVIGATION;
    }
  };
}

const getNavigation = () =>
  getDesktopShellApi() ? navigationState : NO_NAVIGATION;
const getServerNavigation = () => NO_NAVIGATION;

/**
 * The toolbar item a key press moves to (WAI-ARIA APG toolbar): Left/Right
 * step through the enabled items and wrap, Home/End go to the first/last.
 * Works from an unavailable item too (it can hold focus after a click).
 */
function nextToolbarItem(
  key: string,
  current: number,
  enabled: readonly boolean[]
): number | undefined {
  const order = enabled.flatMap((on, index) => (on ? [index] : []));
  switch (key) {
    case "ArrowRight":
      return order.find((index) => index > current) ?? order[0];
    case "ArrowLeft":
      return order.findLast((index) => index < current) ?? order.at(-1);
    case "Home":
      return order[0];
    case "End":
      return order.at(-1);
    default:
      return undefined;
  }
}

const PLAIN = /^[\w.+-]{1,64}$/;
const readText = (value: unknown): string | null =>
  typeof value === "string" && PLAIN.test(value) ? value : null;

function DesktopUpdateCheck() {
  const locale = useBrowserLocale();
  const updater = getDesktopUpdater();
  const [updateCheckStatus, setUpdateCheckStatus] =
    useState<UpdateCheckStatus>("idle");
  const pendingCheck = useRef<Promise<[DesktopUpdateCheckResult, void]> | null>(
    null
  );
  const checkingForUpdates = updateCheckStatus === "checking";

  useEffect(
    () => () => {
      pendingCheck.current = null;
    },
    []
  );

  const checkForUpdates = () => {
    if (!updater || pendingCheck.current) return;
    setUpdateCheckStatus("checking");

    // Cached replies can arrive before the checking state has painted.
    const visible = new Promise<void>((resolve) => {
      setTimeout(resolve, UPDATE_CHECK_MIN_VISIBLE_MS);
    });
    const check = Promise.all([checkDesktopUpdates(updater), visible]);
    pendingCheck.current = check;
    void check.then(([result]) => {
      if (pendingCheck.current !== check) return;
      pendingCheck.current = null;
      setUpdateCheckStatus(result);
    });
  };

  if (!updater) return null;

  return (
    <>
      <button
        type="button"
        className="tw-min-h-11 tw-rounded-lg tw-border-0 tw-bg-white tw-px-4 tw-py-2 tw-font-semibold tw-text-black aria-disabled:tw-cursor-wait aria-disabled:tw-opacity-70 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
        aria-disabled={checkingForUpdates || undefined}
        onClick={checkForUpdates}
      >
        {t(locale, "desktop.appInfo.checkUpdates")}
      </button>
      <output
        aria-live="polite"
        aria-atomic="true"
        className="tw-block tw-px-4 tw-text-center tw-text-sm tw-text-iron-200"
      >
        {updateCheckStatus !== "idle" && (
          <span className="tw-block tw-pt-3">
            {t(locale, UPDATE_CHECK_MESSAGES[updateCheckStatus])}
          </span>
        )}
      </output>
    </>
  );
}

/**
 * The info button's name and mark. Builds that install their own updates:
 * the state's short label (release standard R55), a mark when there is
 * something to do, red for urgent or unsafe; others keep the dot for an
 * available update.
 */
function getUpdateMark(
  locale: ReturnType<typeof useBrowserLocale>,
  autoUpdate: ReturnType<typeof getDesktopAutoUpdate>,
  updateAvailable: boolean
) {
  if (autoUpdate.support !== "supported") {
    return {
      infoLabel: updateAvailable
        ? t(locale, "desktop.titleStrip.appInfoUpdate")
        : t(locale, "desktop.titleStrip.appInfo"),
      showUpdateMark: updateAvailable,
      alertMark: false,
    };
  }
  const state = autoUpdate.state;
  return {
    infoLabel: state?.label
      ? t(locale, "desktop.titleStrip.appInfoState", { label: state.label })
      : t(locale, "desktop.titleStrip.appInfo"),
    showUpdateMark: state !== null && state.label !== null && state.id !== "U1",
    alertMark: state !== null && desktopUpdateTone(state) === "alert",
  };
}

/**
 * The 6529 Desktop title strip: the window's draggable top bar. The page
 * asks for it with `<meta name="6529-desktop-titlebar">` (app/layout.tsx);
 * the host then draws the window controls (macOS traffic lights, Windows
 * caption buttons) inside the insets it reports and sets
 * `data-desktop-titlebar="overlay"` on `<html>` before first paint.
 *
 * The strip is server-rendered on every page and hidden by CSS unless that
 * attribute is set, so browsers never show it and the app shows it from the
 * first paint. It holds back and forward, an app-info button and the app
 * version. It draws no window buttons.
 */
export default function DesktopTitleStrip() {
  const locale = useBrowserLocale();
  const { globalRefresh } = useGlobalRefresh();
  const [info, setInfo] = useState<AppInfo>({
    version: null,
    environment: null,
    drawnByHost: false,
  });
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const navigation = useSyncExternalStore(
    subscribeNavigation,
    getNavigation,
    getServerNavigation
  );
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const autoUpdate = useSyncExternalStore(
    subscribeDesktopAutoUpdate,
    getDesktopAutoUpdate,
    getServerDesktopAutoUpdate
  );
  const updateState =
    autoUpdate.support === "supported" ? autoUpdate.state : null;
  const [showInfo, setShowInfo] = useState(false);
  const [activeItem, setActiveItem] = useState(0);

  useEffect(() => {
    const api = getDesktopShellApi();
    if (!api) return undefined;
    let active = true;
    api
      .getInfo()
      .then((appInfo) => {
        if (!active) return;
        setInfo({
          version: readText(appInfo["app_version"]),
          environment: readText(appInfo.environment),
          drawnByHost:
            getComputedStyle(document.documentElement)
              .getPropertyValue("--desktop-app-version")
              .trim() !== "",
        });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const updater = getDesktopUpdater();
    if (!updater) return undefined;
    const onAvailable = () => setUpdateAvailable(true);
    const onNotAvailable = () => setUpdateAvailable(false);
    updater.onUpdateAvailable(onAvailable);
    updater.onUpdateNotAvailable(onNotAvailable);
    return () => {
      updater.offUpdateAvailable(onAvailable);
      updater.offUpdateNotAvailable(onNotAvailable);
    };
  }, []);

  // The copy result shows briefly, then the button reads "Copy link" again.
  useEffect(() => {
    if (copyStatus === "idle") return undefined;
    const timer = setTimeout(() => setCopyStatus("idle"), 2_000);
    return () => clearTimeout(timer);
  }, [copyStatus]);

  const copyLink = () => {
    // Missing outside a secure context, whatever the DOM types say.
    const clipboard = navigator.clipboard as Clipboard | undefined;
    if (!clipboard) {
      setCopyStatus("failed");
      return;
    }
    clipboard
      .writeText(getPublicLink())
      .then(() => setCopyStatus("copied"))
      .catch(() => setCopyStatus("failed"));
  };

  const environmentLabel =
    info.environment && info.environment !== "production"
      ? info.environment
      : null;
  const { infoLabel, showUpdateMark, alertMark } = getUpdateMark(
    locale,
    autoUpdate,
    updateAvailable
  );
  const backLabel = t(locale, "desktop.titleStrip.back");
  const forwardLabel = t(locale, "desktop.titleStrip.forward");
  const refreshLabel = t(locale, "desktop.titleStrip.refresh");
  const copyLabels: Record<CopyStatus, string> = {
    idle: t(locale, "desktop.titleStrip.copyLink"),
    copied: t(locale, "desktop.titleStrip.linkCopied"),
    failed: t(locale, "desktop.titleStrip.copyFailed"),
  };
  const versionText =
    info.version && environmentLabel
      ? `${info.version} ${environmentLabel}`
      : info.version;

  // Toolbar items in order: back, forward, refresh, copy link, app info.
  const enabled = [
    navigation.canGoBack,
    navigation.canGoForward,
    true,
    true,
    true,
  ];
  // One tab stop: the last focused item, or the first available one if that
  // item has become unavailable.
  const tabStop = enabled[activeItem] ? activeItem : enabled.indexOf(true);
  const itemProps = (index: number) => ({
    tabIndex: index === tabStop ? 0 : -1,
    "aria-disabled": enabled[index] ? undefined : true,
    onFocus: () => setActiveItem(index),
  });

  const onToolbarKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Only from the toolbar's own items; the app-info dialog sits outside.
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(":scope > button")
    );
    // -1 when focus is not on one of them.
    const current = items.indexOf(event.target as HTMLButtonElement);
    if (current === -1) return;
    const next = nextToolbarItem(event.key, current, enabled);
    if (next === undefined) return;
    event.preventDefault();
    setActiveItem(next);
    items[next]?.focus();
  };

  return (
    <>
      <div
        className={styles["strip"]}
        data-desktop-drag-region=""
        role="toolbar"
        aria-orientation="horizontal"
        aria-label={t(locale, "desktop.titleStrip.label")}
        onKeyDown={onToolbarKeyDown}
      >
        <button
          type="button"
          className={styles["button"]}
          aria-label={backLabel}
          title={backLabel}
          {...itemProps(0)}
          onClick={() => {
            if (navigation.canGoBack) getDesktopShellApi()?.goBack();
          }}
        >
          <ArrowLeftIcon aria-hidden="true" width={16} height={16} />
        </button>
        <button
          type="button"
          className={styles["button"]}
          aria-label={forwardLabel}
          title={forwardLabel}
          {...itemProps(1)}
          onClick={() => {
            if (navigation.canGoForward) getDesktopShellApi()?.goForward();
          }}
        >
          <ArrowRightIcon aria-hidden="true" width={16} height={16} />
        </button>
        <button
          type="button"
          className={styles["button"]}
          aria-label={refreshLabel}
          title={refreshLabel}
          {...itemProps(2)}
          onClick={globalRefresh}
        >
          <ArrowPathIcon aria-hidden="true" width={16} height={16} />
        </button>
        <button
          type="button"
          className={styles["button"]}
          aria-label={copyLabels[copyStatus]}
          title={copyLabels[copyStatus]}
          {...itemProps(3)}
          onClick={copyLink}
        >
          {copyStatus === "copied" ? (
            <CheckIcon aria-hidden="true" width={16} height={16} />
          ) : (
            <LinkIcon aria-hidden="true" width={16} height={16} />
          )}
        </button>
        <button
          type="button"
          className={styles["button"]}
          aria-label={infoLabel}
          title={infoLabel}
          {...itemProps(4)}
          onClick={() => setShowInfo(true)}
        >
          <InformationCircleIcon aria-hidden="true" width={16} height={16} />
          {showUpdateMark && (
            <span
              className={clsx(
                styles["updateDot"],
                alertMark && styles["updateDotAlert"]
              )}
              aria-hidden="true"
            />
          )}
        </button>
        {/* Always in the strip: the host can draw the version into it before
            first paint; otherwise the reported version fades in. */}
        <span className={styles["version"]}>
          <span className="tw-sr-only">
            {t(locale, "desktop.appInfo.version")}{" "}
          </span>
          {versionText && !info.drawnByHost ? (
            <span className={styles["versionText"]}>{versionText}</span>
          ) : (
            <span className={styles["hostVersion"]} />
          )}
        </span>
      </div>
      <output aria-live="polite" className="tw-sr-only">
        {copyStatus === "idle" ? "" : copyLabels[copyStatus]}
      </output>
      <MobileWrapperDialog
        isOpen={showInfo}
        title={t(locale, "desktop.appInfo.title")}
        onClose={() => setShowInfo(false)}
      >
        {/* The same side padding as the dialog's header (design system). */}
        <div
          className="tw-flex tw-flex-col tw-px-4 tw-pt-3 sm:tw-px-6"
          data-testid="desktop-app-info-body"
        >
          <dl className="tw-m-0 tw-grid tw-grid-cols-[auto_1fr] tw-gap-x-4 tw-gap-y-2 tw-pb-4 tw-text-sm">
            <dt className="tw-text-iron-400">
              {t(locale, "desktop.appInfo.version")}
            </dt>
            <dd className="tw-m-0 tw-text-iron-50">
              {updateState?.running ?? info.version ?? "-"}
            </dd>
            <dt className="tw-text-iron-400">
              {t(locale, "desktop.appInfo.environment")}
            </dt>
            <dd className="tw-m-0 tw-text-iron-50">
              {info.environment ?? "-"}
            </dd>
          </dl>
          {updateState ? (
            <DesktopUpdatePanel state={updateState} locale={locale} />
          ) : (
            <DesktopUpdateCheck />
          )}
        </div>
      </MobileWrapperDialog>
    </>
  );
}
