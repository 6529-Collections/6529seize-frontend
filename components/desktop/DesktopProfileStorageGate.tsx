"use client";

import {
  Fragment,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { DesktopProfileRecoveryContext } from "@/contexts/DesktopProfileRecoveryContext";
import { isDesktopShell } from "@/helpers/desktop-shell";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  getPageDesktopProfileState,
  isSameDesktopProfileState,
  restoreDesktopProfileState,
} from "@/services/auth/desktop-profile-restore";
import {
  getDesktopProfileSaveStatus,
  getDesktopProfileServerSaveStatus,
  initializeDesktopProfiles,
  notifyDesktopProfilesReady,
  restartDesktopProfileRestore,
  retryDesktopProfileSave,
  subscribeDesktopProfileSaveStatus,
} from "@/services/auth/desktop-profile-storage";

type Startup = "restoring" | "ready" | "signed-out";

const NOTICE_CLASS =
  "tw-fixed tw-bottom-6 tw-right-6 tw-z-[1000] tw-max-w-md tw-rounded-xl tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-950 tw-p-4 tw-text-white tw-shadow-xl";
const BUTTON_CLASS =
  "tw-min-h-11 tw-rounded-lg tw-border-0 tw-bg-white tw-px-4 tw-py-2 tw-font-semibold tw-text-black focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50";

const subscribeToNothing = () => () => undefined;
const getServerIsDesktopShell = () => false;

/**
 * Inside 6529 Desktop, restores the signed-in profiles the shell saved and
 * keeps saving them after every change. On the web, and on routes that do not
 * sign in (`enabled` false), this renders its children unchanged.
 *
 * Server rendering and hydration always take the web path, so the markup
 * matches. In the shell the restore runs right after hydration; the app below
 * remounts only when the restored profiles differ from what the page held.
 */
export default function DesktopProfileStorageGate({
  children,
  enabled = true,
}: {
  readonly children: ReactNode;
  readonly enabled?: boolean | undefined;
}) {
  const isDesktopShellPage = useSyncExternalStore(
    subscribeToNothing,
    isDesktopShell,
    getServerIsDesktopShell
  );
  const isDesktop = isDesktopShellPage && enabled;
  const locale = useBrowserLocale();
  const [startup, setStartup] = useState<Startup>("restoring");
  const [generation, setGeneration] = useState(0);
  const [restartStatus, setRestartStatus] = useState<
    "idle" | "pending" | "failed"
  >("idle");
  const saveStatus = useSyncExternalStore(
    subscribeDesktopProfileSaveStatus,
    getDesktopProfileSaveStatus,
    getDesktopProfileServerSaveStatus
  );

  useEffect(() => {
    if (!isDesktop) return undefined;
    let active = true;
    const current = getPageDesktopProfileState();
    initializeDesktopProfiles(current, (restored) => {
      restoreDesktopProfileState(restored);
      if (active && !isSameDesktopProfileState(current, restored)) {
        setGeneration((value) => value + 1);
      }
    })
      .then(() => {
        if (active) setStartup("ready");
        return undefined;
      })
      .catch(() => {
        if (!active) return;
        restoreDesktopProfileState({
          version: 1,
          accounts: [],
          activeAddress: null,
        });
        setGeneration((value) => value + 1);
        setStartup("signed-out");
      })
      .finally(notifyDesktopProfilesReady);
    return () => {
      active = false;
    };
  }, [isDesktop]);

  useEffect(() => {
    // Routes that never sign in still tell the shell the page is ready.
    if (isDesktopShellPage && !enabled) notifyDesktopProfilesReady();
  }, [enabled, isDesktopShellPage]);

  return (
    <DesktopProfileRecoveryContext.Provider
      value={isDesktop && startup === "signed-out"}
    >
      <Fragment key={generation}>{children}</Fragment>
      {isDesktop && startup === "signed-out" && (
        <div role="status" className={NOTICE_CLASS}>
          <p className="tw-mt-0">
            {t(locale, "desktop.profiles.restoreError")}
          </p>
          {restartStatus === "failed" && (
            <p role="alert">{t(locale, "desktop.profiles.restartError")}</p>
          )}
          <button
            type="button"
            disabled={restartStatus === "pending"}
            aria-busy={restartStatus === "pending"}
            className={BUTTON_CLASS}
            onClick={() => {
              setRestartStatus("pending");
              restartDesktopProfileRestore().catch(() =>
                setRestartStatus("failed")
              );
            }}
          >
            {t(locale, "desktop.profiles.restart")}
          </button>
        </div>
      )}
      {isDesktop && startup === "ready" && saveStatus !== "idle" && (
        <div
          role={saveStatus === "failed" ? "alert" : "status"}
          className={NOTICE_CLASS}
        >
          <p className="tw-mt-0">
            {t(
              locale,
              saveStatus === "retrying"
                ? "desktop.profiles.saveRetrying"
                : "desktop.profiles.saveError"
            )}
          </p>
          <button
            type="button"
            disabled={saveStatus === "retrying"}
            className={BUTTON_CLASS}
            onClick={() => {
              retryDesktopProfileSave().catch(() => undefined);
            }}
          >
            {t(locale, "desktop.profiles.retry")}
          </button>
        </div>
      )}
    </DesktopProfileRecoveryContext.Provider>
  );
}
