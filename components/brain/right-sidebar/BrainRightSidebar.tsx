"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { commonApiFetch } from "@/services/api/common-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Dialog, DialogPanel } from "@headlessui/react";
import {
  AnimatePresence,
  domAnimation,
  LazyMotion,
  m,
  type Transition,
  useReducedMotion,
} from "framer-motion";

import { WaveContent } from "./WaveContent";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useSidebarState } from "../../../hooks/useSidebarState";
import { ChevronDoubleRightIcon } from "@heroicons/react/24/outline";
import {
  BRAIN_RIGHT_SIDEBAR_ENTER_TRANSITION,
  BRAIN_RIGHT_SIDEBAR_EXIT_TRANSITION,
  BRAIN_RIGHT_SIDEBAR_ID,
  BRAIN_RIGHT_SIDEBAR_REDUCED_TRANSITION,
  Mode,
  type SidebarTab,
} from "./BrainRightSidebarTypes";
import { waveRightPanelText } from "@/helpers/waves/wave-right-panel.helpers";

export { SidebarTab } from "./BrainRightSidebarTypes";

interface BrainRightSidebarProps {
  readonly isOpen: boolean;
  readonly waveId: string | null | undefined;
  readonly activeTab: SidebarTab;
  readonly setActiveTab: (tab: SidebarTab) => void;
  readonly variant?: "overlay" | "inline" | undefined;
}

interface SidebarState {
  readonly wave: ApiWave | undefined;
  readonly hasError: boolean;
  readonly mode: Mode;
  readonly setMode: React.Dispatch<React.SetStateAction<Mode>>;
  readonly close: () => void;
  readonly retry: () => void;
}

const useBrainRightSidebarState = (
  waveId: string | null | undefined,
  isOpen: boolean
): SidebarState => {
  const { closeRightSidebar } = useSidebarState();

  const {
    data: wave,
    isError,
    refetch,
  } = useQuery<ApiWave>({
    queryKey: [QueryKey.WAVE, { wave_id: waveId }],
    queryFn: async () => {
      if (!waveId) {
        throw new Error("Wave id is required");
      }
      return commonApiFetch<ApiWave>({
        endpoint: `waves/${waveId}`,
      });
    },
    enabled: Boolean(waveId && isOpen),
    staleTime: 60000,
    placeholderData: keepPreviousData,
  });

  const [mode, setMode] = useState<Mode>(Mode.CONTENT);
  const retry = useCallback(() => {
    void refetch();
  }, [refetch]);
  const currentWave = wave?.id === waveId ? wave : undefined;

  return {
    wave: currentWave,
    hasError: isError && currentWave === undefined,
    mode,
    setMode,
    close: closeRightSidebar,
    retry,
  };
};

const SidebarLoading = () => (
  <div role="status" aria-busy="true" className="tw-flex tw-h-full tw-flex-col">
    <span className="tw-sr-only">
      {waveRightPanelText("waves.sidebar.rightPanel.loading")}
    </span>
    <div
      aria-hidden="true"
      className="tw-flex tw-h-full tw-animate-pulse tw-flex-col motion-reduce:tw-animate-none"
    >
      <div className="tw-flex tw-gap-2 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/5 tw-px-3 tw-py-3">
        <div className="tw-h-4 tw-w-14 tw-rounded-full tw-bg-white/[0.08]" />
        <div className="tw-h-4 tw-w-10 tw-rounded-full tw-bg-white/[0.06]" />
        <div className="tw-h-4 tw-w-24 tw-rounded-full tw-bg-white/[0.06]" />
      </div>
      <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-4 tw-p-4">
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-size-12 tw-rounded-full tw-bg-white/[0.08]" />
          <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-2">
            <div className="tw-h-4 tw-w-2/3 tw-rounded-full tw-bg-white/[0.08]" />
            <div className="tw-h-3 tw-w-1/2 tw-rounded-full tw-bg-white/[0.05]" />
          </div>
        </div>
        <div className="tw-h-24 tw-rounded-lg tw-bg-white/[0.05]" />
        <div className="tw-h-16 tw-rounded-lg tw-bg-white/[0.05]" />
      </div>
    </div>
  </div>
);

const SidebarError = ({ retry }: { readonly retry: () => void }) => (
  <div
    role="alert"
    className="tw-flex tw-h-full tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-p-6 tw-text-center"
  >
    <p className="tw-m-0 tw-text-sm tw-text-iron-300">
      {waveRightPanelText("waves.sidebar.rightPanel.error")}
    </p>
    <button
      type="button"
      onClick={retry}
      className="tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.06] tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition-colors tw-duration-150 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-white/[0.1] motion-reduce:tw-transition-none"
    >
      {waveRightPanelText("waves.sidebar.rightPanel.retry")}
    </button>
  </div>
);

const SidebarContent = ({
  wave,
  mode,
  setMode,
  hasError,
  retry,
  activeTab,
  setActiveTab,
}: {
  wave: ApiWave | undefined;
  mode: Mode;
  setMode: React.Dispatch<React.SetStateAction<Mode>>;
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
  hasError: boolean;
  retry: () => void;
}) => {
  if (!wave) {
    return hasError ? <SidebarError retry={retry} /> : <SidebarLoading />;
  }

  return (
    <WaveContent
      wave={wave}
      mode={mode}
      setMode={setMode}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
  );
};

interface SidebarPresentationProps {
  readonly isOpen: boolean;
  readonly panelLabel: string;
  readonly prefersReducedMotion: boolean;
  readonly panelTransition: Transition;
  readonly panelExitTransition: Transition;
  readonly children: React.ReactNode;
}

const InlineSidebar = ({
  isOpen,
  panelLabel,
  prefersReducedMotion,
  panelTransition,
  panelExitTransition,
  children,
}: SidebarPresentationProps) => (
  <div
    data-testid="brain-right-sidebar-slot"
    data-state={isOpen ? "open" : "closed"}
    className={`tw-relative tw-h-full tw-flex-shrink-0 ${
      isOpen ? "tw-w-[22rem]" : "tw-w-0"
    }`}
  >
    <LazyMotion features={domAnimation}>
      <AnimatePresence initial={false}>
        {isOpen && (
          <m.div
            key="inline-sidebar"
            className="tw-absolute tw-inset-y-0 tw-right-0 tw-w-[22rem] tw-pl-6 tw-pt-2 tw-will-change-transform"
            initial={prefersReducedMotion ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={{
              x: prefersReducedMotion ? 0 : "100%",
              transition: panelExitTransition,
            }}
            transition={panelTransition}
          >
            <aside
              id={BRAIN_RIGHT_SIDEBAR_ID}
              aria-label={panelLabel}
              className="tw-flex tw-h-full tw-w-[20.5rem] tw-min-w-0 tw-max-w-full tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-bg-iron-950"
            >
              {children}
            </aside>
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  </div>
);

interface OverlaySidebarProps extends SidebarPresentationProps {
  readonly close: () => void;
}

const OverlaySidebar = ({
  isOpen,
  close,
  panelLabel,
  prefersReducedMotion,
  panelTransition,
  panelExitTransition,
  children,
}: OverlaySidebarProps) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const focusCloseButton = () => {
      const closeButton = closeButtonRef.current;
      const panel = document.getElementById(BRAIN_RIGHT_SIDEBAR_ID);
      if (closeButton && !panel?.contains(document.activeElement)) {
        closeButton.focus();
      }
    };
    const focusFrame = globalThis.requestAnimationFrame(focusCloseButton);

    // CompactWaveActions restores its trigger after its leave transition.
    // Redirect only that trigger; Headless UI owns every other focus path,
    // including focus in nested portalled dialogs.
    const redirectCompactTriggerFocus = (event: FocusEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.dataset["compactWaveActionsTrigger"] === "true"
      ) {
        closeButtonRef.current?.focus();
      }
    };
    document.addEventListener("focusin", redirectCompactTriggerFocus);
    return () => {
      globalThis.cancelAnimationFrame(focusFrame);
      document.removeEventListener("focusin", redirectCompactTriggerFocus);
    };
  }, [isOpen]);

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence initial={false}>
        {isOpen && (
          <Dialog
            as={m.div}
            key="overlay-sidebar"
            open={true}
            onClose={close}
            aria-label={panelLabel}
            className="tailwind-scope tw-relative tw-z-[100]"
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1, transition: panelExitTransition }}
          >
            <m.div
              data-testid="brain-right-sidebar-backdrop"
              aria-hidden="true"
              onClick={close}
              className="tw-fixed tw-inset-0 tw-z-[90] tw-bg-gray-700/75 tw-backdrop-blur-[1px] tw-will-change-[opacity]"
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{
                opacity: prefersReducedMotion ? 1 : 0,
                transition: prefersReducedMotion
                  ? BRAIN_RIGHT_SIDEBAR_REDUCED_TRANSITION
                  : { duration: 0.1 },
              }}
              transition={
                prefersReducedMotion
                  ? BRAIN_RIGHT_SIDEBAR_REDUCED_TRANSITION
                  : { duration: 0.18 }
              }
            />
            <m.div
              className="tw-fixed tw-inset-y-0 tw-right-0 tw-z-[100] tw-w-[20.5rem] tw-max-w-full tw-will-change-transform"
              initial={prefersReducedMotion ? false : { x: "100%" }}
              animate={{ x: 0 }}
              exit={{
                x: prefersReducedMotion ? 0 : "100%",
                transition: panelExitTransition,
              }}
              transition={panelTransition}
            >
              <DialogPanel
                id={BRAIN_RIGHT_SIDEBAR_ID}
                aria-label={panelLabel}
                className="tw-relative tw-flex tw-h-full tw-w-full tw-min-w-0 tw-flex-col tw-overflow-visible tw-border-y-0 tw-border-l tw-border-r-0 tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-shadow-2xl"
              >
                <div className="tw-absolute -tw-left-5 tw-top-2 tw-z-[110]">
                  <button
                    type="button"
                    onClick={close}
                    ref={closeButtonRef}
                    data-autofocus
                    className="tw-group tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-r-0 tw-border-solid tw-border-iron-650 tw-bg-iron-700 tw-shadow-[0_8px_20px_rgba(0,0,0,0.35)] tw-transition-all tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-border-iron-500 desktop-hover:hover:tw-bg-iron-600 desktop-hover:hover:tw-shadow-[0_12px_26px_rgba(0,0,0,0.45)] motion-reduce:tw-transition-none"
                    aria-label={waveRightPanelText(
                      "waves.sidebar.rightPanel.close"
                    )}
                  >
                    <ChevronDoubleRightIcon
                      aria-hidden="true"
                      strokeWidth={2}
                      className="tw-size-4 tw-text-iron-200 tw-transition-all tw-duration-200 motion-reduce:tw-transition-none"
                    />
                  </button>
                </div>
                {children}
              </DialogPanel>
            </m.div>
          </Dialog>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
};

const BrainRightSidebar: React.FC<BrainRightSidebarProps> = ({
  isOpen,
  waveId,
  activeTab,
  setActiveTab,
  variant = "overlay",
}) => {
  const { wave, hasError, mode, setMode, close, retry } =
    useBrainRightSidebarState(waveId, isOpen);
  const prefersReducedMotion = useReducedMotion() ?? false;
  const panelLabel = waveRightPanelText("waves.sidebar.rightPanel.ariaLabel");
  const panelTransition = prefersReducedMotion
    ? BRAIN_RIGHT_SIDEBAR_REDUCED_TRANSITION
    : BRAIN_RIGHT_SIDEBAR_ENTER_TRANSITION;
  const panelExitTransition = prefersReducedMotion
    ? BRAIN_RIGHT_SIDEBAR_REDUCED_TRANSITION
    : BRAIN_RIGHT_SIDEBAR_EXIT_TRANSITION;
  const panelContent = (
    <div className="tw-h-full tw-min-h-0 tw-min-w-0 tw-overflow-hidden tw-text-sm tw-text-iron-500">
      <SidebarContent
        wave={wave}
        mode={mode}
        setMode={setMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasError={hasError}
        retry={retry}
      />
    </div>
  );
  const presentationProps: SidebarPresentationProps = {
    isOpen,
    panelLabel,
    prefersReducedMotion,
    panelTransition,
    panelExitTransition,
    children: panelContent,
  };

  if (variant === "inline") {
    return <InlineSidebar {...presentationProps} />;
  }

  return <OverlaySidebar {...presentationProps} close={close} />;
};

export default BrainRightSidebar;
