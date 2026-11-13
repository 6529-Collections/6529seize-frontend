"use client";

import {
  Fragment,
  useEffect,
  useId,
  useRef,
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
  "tw-fixed tw-inset-x-4 tw-bottom-4 tw-z-[1000] sm:tw-inset-x-auto sm:tw-bottom-6 sm:tw-right-6 sm:tw-max-w-md tw-rounded-xl tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-950 tw-p-4 tw-text-white tw-shadow-xl";
const BUTTON_CLASS =
  "tw-min-h-11 tw-rounded-lg tw-border-0 tw-bg-white tw-px-4 tw-py-2 tw-font-semibold tw-text-black focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50";

const subscribeToNothing = () => () => undefined;
const getServerIsDesktopShell = () => false;

/** The focused element's id, so focus can return to it after a remount. */
const getFocusedElementId = (): string | null => {
  const focused = document.activeElement;
  return focused && focused !== document.body && focused.id ? focused.id : null;
};

/**
 * Inside 6529 Desktop, restores the signed-in profiles the shell saved and
 * keeps saving them after every change. On the web, and on routes that do not
 * sign in (`enabled` false), this renders its children unchanged.
 *
 * Server rendering and hydration always take the web path, so the markup
 * matches. In the shell the restore runs right after hydration; the app below
 * remounts only when the restored profiles differ from what the page held,
 * and focus returns to the element that had it.
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
  const restoreErrorId = useId();
  const saveErrorId = useId();
  const [startup, setStartup] = useState<Startup>("restoring");
  const [generation, setGeneration] = useState(0);
  const focusAfterRemount = useRef<string | null>(null);
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
    const remountApp = () => {
      focusAfterRemount.current = getFocusedElementId();
      setGeneration((value) => value + 1);
    };
    const current = getPageDesktopProfileState();
    initializeDesktopProfiles(current, (restored) => {
      // Throws on an invalid snapshot; the app then runs signed out.
      const written = restoreDesktopProfileState(restored);
      if (active && !isSameDesktopProfileState(current, written)) {
        remountApp();
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
        remountApp();
        setStartup("signed-out");
      })
      .finally(() => {
        if (active) notifyDesktopProfilesReady();
      });
    return () => {
      active = false;
    };
  }, [isDesktop]);

  useEffect(() => {
    const id = focusAfterRemount.current;
    focusAfterRemount.current = null;
    if (id) document.getElementById(id)?.focus();
  }, [generation]);

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
        <div className={NOTICE_CLASS}>
          <p id={restoreErrorId} role="alert" className="tw-mt-0">
            {t(locale, "desktop.profiles.restoreError")}
          </p>
          {restartStatus === "failed" && (
            <p role="alert">{t(locale, "desktop.profiles.restartError")}</p>
          )}
          <button
            type="button"
            disabled={restartStatus === "pending"}
            aria-busy={restartStatus === "pending"}
            aria-describedby={restoreErrorId}
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
        <div className={NOTICE_CLASS}>
          {saveStatus === "failed" ? (
            <p id={saveErrorId} role="alert" className="tw-mt-0">
              {t(locale, "desktop.profiles.saveError")}
            </p>
          ) : (
            <output className="tw-mb-4 tw-block">
              {t(locale, "desktop.profiles.saveRetrying")}
            </output>
          )}
          <button
            type="button"
            disabled={saveStatus === "retrying"}
            aria-busy={saveStatus === "retrying"}
            aria-describedby={saveStatus === "failed" ? saveErrorId : undefined}
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
