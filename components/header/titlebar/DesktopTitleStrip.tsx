"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState, useSyncExternalStore } from "react";
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
let navigationState = NO_NAVIGATION;

// The app window's history, from the shell; re-read on each change it reports.
function subscribeNavigation(onChange: () => void): () => void {
  const api = getDesktopShellApi();
  if (!api) return () => undefined;
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
          onChange();
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

const getNavigation = () =>
  getDesktopShellApi() ? navigationState : NO_NAVIGATION;
const getServerNavigation = () => NO_NAVIGATION;

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
  const backLabel = t(locale, "desktop.titleStrip.back");
  const forwardLabel = t(locale, "desktop.titleStrip.forward");

  return (
    <>
      <div
        className={styles["strip"]}
        data-desktop-drag-region=""
        role="group"
        aria-label={t(locale, "desktop.titleStrip.label")}
      >
        <button
          type="button"
          className={styles["button"]}
          aria-label={backLabel}
          title={backLabel}
          disabled={!navigation.canGoBack}
          onClick={() => getDesktopShellApi()?.goBack()}
        >
          <ArrowLeftIcon aria-hidden="true" width={16} height={16} />
        </button>
        <button
          type="button"
          className={styles["button"]}
          aria-label={forwardLabel}
          title={forwardLabel}
          disabled={!navigation.canGoForward}
          onClick={() => getDesktopShellApi()?.goForward()}
        >
          <ArrowRightIcon aria-hidden="true" width={16} height={16} />
        </button>
        <button
          type="button"
          className={styles["button"]}
          aria-label={infoLabel}
          title={infoLabel}
          onClick={() => setShowInfo(true)}
        >
          <InformationCircleIcon aria-hidden="true" width={16} height={16} />
          {updateAvailable && (
            <span className={styles["updateDot"]} aria-hidden="true" />
          )}
        </button>
        {info.version && (
          <span className={styles["version"]}>
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
        {getDesktopUpdater() && (
          <button
            type="button"
            className="tw-min-h-11 tw-rounded-lg tw-border-0 tw-bg-white tw-px-4 tw-py-2 tw-font-semibold tw-text-black focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
            onClick={() => getDesktopUpdater()?.checkUpdates()}
          >
            {t(locale, "desktop.appInfo.checkUpdates")}
          </button>
        )}
      </MobileWrapperDialog>
    </>
  );
}
