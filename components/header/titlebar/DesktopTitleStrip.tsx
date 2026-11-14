"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import {
  type KeyboardEvent,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { getDesktopShellApi, getDesktopUpdater } from "@/helpers/desktop-shell";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import styles from "./DesktopTitleStrip.module.css";

interface AppInfo {
  readonly version: string | null;
  readonly environment: string | null;
}

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
  const refresh = () => {
    api
      .getNavigationState()
      .then((state) => {
        const next = {
          canGoBack: state.canGoBack === true,
          canGoForward: state.canGoForward === true,
        };
        if (
          active &&
          (next.canGoBack !== navigationState.canGoBack ||
            next.canGoForward !== navigationState.canGoForward)
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
  const [info, setInfo] = useState<AppInfo>({
    version: null,
    environment: null,
  });
  const navigation = useSyncExternalStore(
    subscribeNavigation,
    getNavigation,
    getServerNavigation
  );
  const [updateAvailable, setUpdateAvailable] = useState(false);
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

  const environmentLabel =
    info.environment && info.environment !== "production"
      ? info.environment
      : null;
  const infoLabel = updateAvailable
    ? t(locale, "desktop.titleStrip.appInfoUpdate")
    : t(locale, "desktop.titleStrip.appInfo");
  const updater = getDesktopUpdater();
  const backLabel = t(locale, "desktop.titleStrip.back");
  const forwardLabel = t(locale, "desktop.titleStrip.forward");

  // Toolbar items in order: back, forward, app info (always available).
  const enabled = [navigation.canGoBack, navigation.canGoForward, true];
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
          aria-label={infoLabel}
          title={infoLabel}
          {...itemProps(2)}
          onClick={() => setShowInfo(true)}
        >
          <InformationCircleIcon aria-hidden="true" width={16} height={16} />
          {updateAvailable && (
            <span className={styles["updateDot"]} aria-hidden="true" />
          )}
        </button>
        {info.version && (
          <span className={styles["version"]}>
            <span className="tw-sr-only">
              {t(locale, "desktop.appInfo.version")}{" "}
            </span>
            {environmentLabel
              ? `${info.version} ${environmentLabel}`
              : info.version}
          </span>
        )}
      </div>
      <MobileWrapperDialog
        isOpen={showInfo}
        title={t(locale, "desktop.appInfo.title")}
        onClose={() => setShowInfo(false)}
      >
        <dl className="tw-m-0 tw-grid tw-grid-cols-[auto_1fr] tw-gap-x-4 tw-gap-y-2 tw-pb-4 tw-text-sm">
          <dt className="tw-text-iron-400">
            {t(locale, "desktop.appInfo.version")}
          </dt>
          <dd className="tw-m-0 tw-text-iron-50">{info.version ?? "-"}</dd>
          <dt className="tw-text-iron-400">
            {t(locale, "desktop.appInfo.environment")}
          </dt>
          <dd className="tw-m-0 tw-text-iron-50">{info.environment ?? "-"}</dd>
        </dl>
        {updater && (
          <button
            type="button"
            className="tw-min-h-11 tw-rounded-lg tw-border-0 tw-bg-white tw-px-4 tw-py-2 tw-font-semibold tw-text-black focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
            onClick={() => updater.checkUpdates()}
          >
            {t(locale, "desktop.appInfo.checkUpdates")}
          </button>
        )}
      </MobileWrapperDialog>
    </>
  );
}
