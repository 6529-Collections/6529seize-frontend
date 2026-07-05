"use client";

import { useAuth } from "@/components/auth/Auth";
import CreateDirectMessageModal from "@/components/waves/create-dm/CreateDirectMessageModal";
import { useWaveDropsScrollControlsVisible } from "@/components/waves/drops/WaveDropsScrollControlsVisibility";
import { useWaveComposerDockElements } from "@/components/waves/WaveComposerDockVisibility";
import { SIDEBAR_MOBILE_BREAKPOINT } from "@/constants/sidebar";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { t } from "@/i18n/messages";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { QuickDmChat } from "./QuickDmChat";
import { QuickDmListPanel } from "./QuickDmListPanel";
import { QuickDmLoadingRows } from "./QuickDmPanelPieces";
import {
  CLOSED_STATE,
  getUnreadCount,
  isQuickDmState,
  LIST_STATE,
  QUICK_DM_STORAGE_KEY,
  readStoredState,
  storeState,
} from "./QuickDirectMessagesUtils";
import type { QuickDmState } from "./QuickDirectMessagesUtils";

const QUICK_DM_BASE_POSITION_CLASS =
  "tailwind-scope tw-fixed tw-right-6 tw-z-[70]";
const QUICK_DM_PANEL_POSITION_CLASS = `${QUICK_DM_BASE_POSITION_CLASS} tw-bottom-24 xl:tw-bottom-6`;
const QUICK_DM_LAUNCHER_BASE_POSITION_CLASS = `${QUICK_DM_BASE_POSITION_CLASS} tw-transition-[bottom] tw-duration-200 tw-ease-out motion-reduce:tw-transition-none`;
const QUICK_DM_LAUNCHER_RESTING_POSITION_CLASS = "tw-bottom-24 xl:tw-bottom-6";
const QUICK_DM_LAUNCHER_LIFTED_POSITION_CLASS = "tw-bottom-32 xl:tw-bottom-32";
// Right inset (tw-right-6) + launcher diameter (tw-size-14) + breathing room.
// When a bottom-docked wave composer extends into that strip, any fixed
// bottom-right spot would cover its Post button or the newest drop's hover
// actions and swallow pointer clicks, so the launcher yields instead.
const QUICK_DM_LAUNCHER_CLEARANCE_PX = 88;

const getDesktopViewportSnapshot = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(`(min-width: ${SIDEBAR_MOBILE_BREAKPOINT}px)`)
    .matches;
};

const subscribeDesktopViewport = (onStoreChange: () => void): (() => void) => {
  if (typeof globalThis.window === "undefined") {
    return () => undefined;
  }

  const mediaQuery = globalThis.window.matchMedia(
    `(min-width: ${SIDEBAR_MOBILE_BREAKPOINT}px)`
  );

  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
};

const useIsQuickDmDesktop = (): boolean => {
  const { isApp, isMobileDevice } = useDeviceInfo();
  const isDesktopViewport = useSyncExternalStore(
    subscribeDesktopViewport,
    getDesktopViewportSnapshot,
    () => false
  );

  return !isApp && !isMobileDevice && isDesktopViewport;
};

export default function QuickDirectMessages() {
  const { connectedProfile, showWaves } = useAuth();
  const isDesktop = useIsQuickDmDesktop();
  const locale = useBrowserLocale();
  const { directMessages, registerWave, requestDirectMessagesList } =
    useMyStream();
  const shouldLiftLauncher = useWaveDropsScrollControlsVisible();
  const dockedComposers = useWaveComposerDockElements();
  const [isLauncherZoneCovered, setIsLauncherZoneCovered] = useState(false);
  const [state, setState] = useState<QuickDmState>(() => readStoredState());
  const [isCreateDirectMessageOpen, setIsCreateDirectMessageOpen] =
    useState(false);
  const launcherButtonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const restoreFocusElementRef = useRef<HTMLElement | null>(null);

  const waves = directMessages.list;
  const isVisible = Boolean(isDesktop && connectedProfile?.handle && showWaves);
  const selectedWave = useMemo(
    () => waves.find((wave) => wave.id === state.waveId) ?? null,
    [state.waveId, waves]
  );
  const shouldShowChat =
    state.view === "chat" &&
    state.waveId !== null &&
    (directMessages.isFetching || selectedWave !== null);
  const totalUnreadCount = useMemo(
    () => waves.reduce((count, wave) => count + getUnreadCount(wave), 0),
    [waves]
  );
  const hasUnread = totalUnreadCount > 0;
  const displayUnreadCount =
    totalUnreadCount > 99 ? "99+" : `${totalUnreadCount}`;
  const hasUnreadOutsideCurrentChat = useMemo(
    () =>
      state.view === "chat" &&
      state.waveId !== null &&
      waves.some(
        (wave) => wave.id !== state.waveId && getUnreadCount(wave) > 0
      ),
    [state.view, state.waveId, waves]
  );

  useEffect(() => requestDirectMessagesList(), [requestDirectMessagesList]);

  useEffect(() => {
    const measureLauncherZone = () => {
      setIsLauncherZoneCovered(
        dockedComposers.some((composer) => {
          const rect = composer.getBoundingClientRect();
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            globalThis.window.innerWidth - rect.right <
              QUICK_DM_LAUNCHER_CLEARANCE_PX
          );
        })
      );
    };

    measureLauncherZone();
    if (dockedComposers.length === 0) {
      return;
    }

    // Width changes (sidebar toggles, layout shifts) re-run the measurement;
    // viewport resizes are caught by the window listener.
    const observer = new ResizeObserver(measureLauncherZone);
    dockedComposers.forEach((composer) => observer.observe(composer));
    globalThis.window.addEventListener("resize", measureLauncherZone);

    return () => {
      observer.disconnect();
      globalThis.window.removeEventListener("resize", measureLauncherZone);
    };
  }, [dockedComposers]);

  const setAndStoreState = useCallback((nextState: QuickDmState) => {
    setState(nextState);
    storeState(nextState);
  }, []);

  const restoreLauncherFocus = useCallback(() => {
    if (typeof globalThis.window === "undefined") {
      return;
    }

    globalThis.window.requestAnimationFrame(() => {
      const focusTarget =
        restoreFocusElementRef.current?.isConnected === true
          ? restoreFocusElementRef.current
          : launcherButtonRef.current;
      focusTarget?.focus();
    });
  }, []);

  const openList = useCallback(() => {
    if (state.view === "closed") {
      restoreFocusElementRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : launcherButtonRef.current;
    }
    setAndStoreState(LIST_STATE);
  }, [setAndStoreState, state.view]);

  const close = useCallback(() => {
    setAndStoreState(CLOSED_STATE);
    restoreLauncherFocus();
  }, [restoreLauncherFocus, setAndStoreState]);

  const openChat = useCallback(
    (waveId: string) => {
      registerWave(waveId, true);
      setAndStoreState({ view: "chat", waveId });
    },
    [registerWave, setAndStoreState]
  );

  const openAll = useCallback(() => {
    setAndStoreState(CLOSED_STATE);
  }, [setAndStoreState]);

  const openCreateDirectMessage = useCallback(() => {
    restoreFocusElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : panelRef.current;
    setIsCreateDirectMessageOpen(true);
  }, []);

  const closeCreateDirectMessage = useCallback(() => {
    setIsCreateDirectMessageOpen(false);
    restoreLauncherFocus();
  }, [restoreLauncherFocus]);

  const handleCreateDirectMessageSuccess = useCallback(() => {
    setIsCreateDirectMessageOpen(false);
    setAndStoreState(CLOSED_STATE);
    restoreLauncherFocus();
  }, [restoreLauncherFocus, setAndStoreState]);

  useEffect(() => {
    if (!isVisible || typeof globalThis.window === "undefined") {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== QUICK_DM_STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        const parsed = JSON.parse(event.newValue) as unknown;
        if (isQuickDmState(parsed)) {
          setState(parsed);
        }
      } catch {
        setState(CLOSED_STATE);
      }
    };

    globalThis.window.addEventListener("storage", handleStorage);
    return () =>
      globalThis.window.removeEventListener("storage", handleStorage);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || state.view === "closed") {
      return;
    }

    const frame = globalThis.window.requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) {
        return;
      }

      if (panel.contains(document.activeElement)) {
        return;
      }

      const focusTarget =
        panel.querySelector<HTMLElement>(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
        ) ?? panel;
      focusTarget.focus();
    });

    return () => globalThis.window.cancelAnimationFrame(frame);
  }, [isVisible, state.view, state.waveId]);

  if (!isVisible) {
    return null;
  }

  const createDirectMessageModal = connectedProfile ? (
    <CreateDirectMessageModal
      isOpen={isCreateDirectMessageOpen}
      onClose={closeCreateDirectMessage}
      onSuccess={handleCreateDirectMessageSuccess}
      profile={connectedProfile}
    />
  ) : null;
  const createDirectMessageAction = connectedProfile
    ? openCreateDirectMessage
    : undefined;

  if (state.view === "closed") {
    if (isLauncherZoneCovered) {
      return createDirectMessageModal;
    }

    const launcherPositionClassName = `${QUICK_DM_LAUNCHER_BASE_POSITION_CLASS} ${
      shouldLiftLauncher
        ? QUICK_DM_LAUNCHER_LIFTED_POSITION_CLASS
        : QUICK_DM_LAUNCHER_RESTING_POSITION_CLASS
    }`;

    return (
      <>
        <div className={launcherPositionClassName}>
          <button
            ref={launcherButtonRef}
            type="button"
            onClick={openList}
            aria-label={
              hasUnread
                ? t(locale, "quickDm.openButtonUnreadAriaLabel", {
                    count: displayUnreadCount,
                  })
                : t(locale, "quickDm.openButtonAriaLabel")
            }
            title={t(locale, "quickDm.openButtonTitle")}
            className="tw-relative tw-flex tw-size-14 tw-appearance-none tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-900 tw-p-0 tw-text-iron-100 tw-shadow-2xl tw-ring-1 tw-ring-white/15 tw-transition hover:tw-bg-iron-800 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400"
          >
            <ChatBubbleLeftRightIcon className="tw-size-6" aria-hidden="true" />
            {hasUnread && (
              <span className="tw-absolute tw-right-[-2px] tw-top-[-2px] tw-flex tw-h-5 tw-min-w-5 tw-items-center tw-justify-center tw-rounded-full tw-bg-red tw-px-1.5 tw-text-[11px] tw-font-semibold tw-text-white tw-ring-2 tw-ring-black">
                {displayUnreadCount}
              </span>
            )}
          </button>
        </div>
        {createDirectMessageModal}
      </>
    );
  }

  return (
    <>
      <aside
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
        className={QUICK_DM_PANEL_POSITION_CLASS}
        aria-label={t(locale, "quickDm.regionAriaLabel")}
        onKeyDown={(event) => {
          if (event.key !== "Escape") {
            return;
          }

          event.stopPropagation();
          close();
        }}
      >
        {shouldShowChat && state.waveId ? (
          <Suspense fallback={<QuickDmLoadingRows locale={locale} />}>
            <QuickDmChat
              waveId={state.waveId}
              hasUnreadOutsideCurrentChat={hasUnreadOutsideCurrentChat}
              listWave={selectedWave}
              locale={locale}
              onBack={openList}
              onClose={close}
              onOpenAll={openAll}
            />
          </Suspense>
        ) : (
          <QuickDmListPanel
            waves={waves}
            isFetching={directMessages.isFetching}
            isFetchingNextPage={directMessages.isFetchingNextPage}
            hasNextPage={directMessages.hasNextPage}
            locale={locale}
            onClose={close}
            onCreateDirectMessage={createDirectMessageAction}
            onFetchNextPage={directMessages.fetchNextPage}
            onOpenChat={openChat}
            onRegisterWave={registerWave}
          />
        )}
      </aside>
      {createDirectMessageModal}
    </>
  );
}
