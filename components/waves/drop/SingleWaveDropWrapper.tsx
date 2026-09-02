"use client";

import { CompactModeProvider } from "@/contexts/CompactModeContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { markDropOpenReady } from "@/utils/monitoring/dropOpenTiming";
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import React, {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { SingleWaveDropChat } from "./SingleWaveDropChat";

interface SingleWaveDropWrapperProps {
  readonly drop: ApiDrop;
  readonly wave: ApiWave;
  readonly children: React.ReactNode;
  readonly onClose: () => void;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
}

const mobileChatPanelStyle: React.CSSProperties = {
  bottom: "var(--native-keyboard-inset-bottom, 0px)",
  transition:
    "bottom var(--native-keyboard-layout-transition-duration, 0ms) ease-out",
};

export const SingleWaveDropWrapper: React.FC<SingleWaveDropWrapperProps> = ({
  drop,
  wave,
  children,
  onClose,
  winningThreshold = null,
  winningThresholdMinDurationMs = null,
  isVotingClosed = false,
  isVotingControlsLocked = false,
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isCompactLayout = useIsMobileLayoutViewport();
  const readyKeyRef = useRef<string | null>(null);

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
  }, []);

  useEffect(() => {
    globalThis.window.addEventListener("single-drop:close-chat", closeChat);
    return () =>
      globalThis.window.removeEventListener(
        "single-drop:close-chat",
        closeChat
      );
  }, [closeChat]);

  useEffect(() => {
    if (!isChatOpen || !isCompactLayout) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isChatOpen, isCompactLayout]);

  useEffect(() => {
    const readyKey = `${drop.id}:${wave.id}`;
    if (readyKeyRef.current === readyKey) return;
    readyKeyRef.current = readyKey;
    markDropOpenReady({ dropId: drop.id, waveId: wave.id });
  }, [drop.id, wave.id]);

  return (
    <div className="tw-flex tw-h-full tw-w-full tw-flex-col tw-overflow-hidden tw-overscroll-none tw-bg-iron-950 lg:tw-flex-row">
      <div className="@container tw-relative tw-h-full tw-flex-1 tw-overflow-hidden">
        <header className="tw-absolute tw-inset-x-0 tw-top-0 tw-z-30 tw-bg-iron-950/55 tw-bg-gradient-to-b tw-from-iron-950/75 tw-via-iron-950/55 tw-to-iron-950/10 tw-px-4 tw-pb-2 tw-pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] tw-backdrop-blur-sm sm:tw-px-6 lg:tw-px-8">
          <div className="tw-flex tw-w-full tw-items-center tw-justify-between">
            <div className="tw-flex tw-items-center tw-gap-6">
              <button
                type="button"
                aria-label="Close panel"
                onClick={onClose}
                className="tw-flex tw-h-11 tw-w-11 tw-items-center tw-justify-center tw-gap-2 tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-text-iron-300 tw-transition-colors desktop-hover:hover:tw-text-white motion-reduce:tw-transition-none sm:tw-h-auto sm:tw-w-auto sm:tw-rounded-lg sm:tw-border-0 sm:tw-bg-transparent sm:tw-px-3 sm:tw-py-2"
              >
                <ArrowLeftIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0 sm:tw-h-4 sm:tw-w-4" />
                <span className="tw-hidden tw-text-sm tw-font-semibold sm:tw-inline">
                  Close
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={toggleChat}
              aria-label={isChatOpen ? "Hide chat" : "Show chat"}
              aria-expanded={isChatOpen}
              className={`tw-flex tw-h-11 tw-w-11 tw-flex-shrink-0 tw-items-center tw-justify-center tw-gap-2 tw-rounded-full tw-border tw-border-solid tw-px-3 tw-text-sm tw-font-medium tw-backdrop-blur-md tw-transition-colors motion-reduce:tw-transition-none sm:tw-h-auto sm:tw-w-auto sm:tw-rounded-lg sm:tw-py-2 ${
                isChatOpen
                  ? "tw-border-iron-700 tw-bg-iron-800 tw-text-iron-100 desktop-hover:hover:tw-bg-iron-700"
                  : "tw-border-iron-700 tw-bg-iron-950 tw-text-iron-300 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-200"
              }`}
            >
              <ChatBubbleLeftRightIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0 sm:tw-h-4 sm:tw-w-4" />
              <span className="tw-hidden sm:tw-inline">
                {isChatOpen ? "Hide" : "Show"} Chat
              </span>
            </button>
          </div>
        </header>

        <div className="tw-[scrollbar-gutter:stable] tw-h-full tw-overflow-y-auto tw-overscroll-contain tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
          <div
            className="tw-h-[calc(env(safe-area-inset-top,0px)+4rem)] tw-shrink-0"
            aria-hidden="true"
          />
          {children}
          <div
            className="tw-h-[env(safe-area-inset-bottom,0px)] tw-shrink-0"
            aria-hidden="true"
          />
        </div>
      </div>

      <CompactModeProvider compact={true}>
        <div
          className={`tw-hidden tw-h-full tw-flex-col tw-bg-black tw-transition-[width,border-color] tw-duration-300 tw-ease-in-out motion-reduce:tw-transition-none lg:tw-flex ${
            isChatOpen
              ? "tw-w-[400px] tw-border-y-0 tw-border-l tw-border-r-0 tw-border-solid tw-border-white/10"
              : "tw-w-0 tw-overflow-hidden tw-border-none"
          } `}
        >
          <div className="@container tw-relative tw-flex tw-flex-1 tw-flex-col tw-overflow-hidden">
            <div className="tw-pointer-events-none tw-absolute tw-left-0 tw-right-0 tw-top-0 tw-z-50 tw-h-12 tw-bg-gradient-to-b tw-from-black tw-to-transparent" />
            {isChatOpen && !isCompactLayout && (
              <SingleWaveDropChat
                key={drop.id}
                wave={wave}
                drop={drop}
                winningThreshold={winningThreshold}
                winningThresholdMinDurationMs={winningThresholdMinDurationMs}
                isVotingClosed={isVotingClosed}
                isVotingControlsLocked={isVotingControlsLocked}
              />
            )}
          </div>
        </div>
      </CompactModeProvider>

      <CompactModeProvider compact={true}>
        <Transition show={isChatOpen && isCompactLayout} as={Fragment}>
          <Dialog
            as="div"
            className="tw-relative tw-z-[90] lg:tw-hidden"
            onClose={closeChat}
            aria-label="Drop chat"
          >
            <div
              className="tw-fixed tw-left-[var(--left-rail,0px)] tw-right-0 tw-top-0 tw-max-h-[100dvh] tw-overflow-hidden tw-overscroll-none"
              style={mobileChatPanelStyle}
            >
              <TransitionChild
                as={Fragment}
                enter="tw-transition-opacity tw-duration-150 tw-ease-out motion-reduce:tw-transition-none"
                enterFrom="tw-opacity-0"
                enterTo="tw-opacity-100"
                leave="tw-duration-[120ms] tw-transition-opacity tw-ease-in motion-reduce:tw-transition-none"
                leaveFrom="tw-opacity-100"
                leaveTo="tw-opacity-0"
              >
                <div className="tw-absolute tw-inset-0 tw-bg-black/60" />
              </TransitionChild>
              <TransitionChild
                as={Fragment}
                enter="tw-duration-[220ms] tw-transform tw-transition-transform tw-ease-out motion-reduce:tw-transform-none motion-reduce:tw-transition-none"
                enterFrom="tw-translate-x-full motion-reduce:tw-translate-x-0"
                enterTo="tw-translate-x-0"
                leave="tw-duration-[180ms] tw-transform tw-transition-transform tw-ease-in motion-reduce:tw-transform-none motion-reduce:tw-transition-none"
                leaveFrom="tw-translate-x-0"
                leaveTo="tw-translate-x-full motion-reduce:tw-translate-x-0"
              >
                <DialogPanel className="@container tw-absolute tw-inset-0 tw-z-[100] tw-flex tw-h-full tw-min-h-0 tw-transform-gpu tw-flex-col tw-overflow-hidden tw-overscroll-none tw-bg-iron-950 tw-will-change-transform lg:tw-hidden">
                  <div className="tw-relative tw-z-10 tw-flex tw-flex-none tw-items-center tw-px-4 tw-pb-2 tw-pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] sm:tw-px-6 lg:tw-px-8">
                    <button
                      type="button"
                      onClick={closeChat}
                      aria-label="Close chat"
                      className="tw-flex tw-size-11 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-text-iron-300 tw-transition-colors desktop-hover:hover:tw-text-white motion-reduce:tw-transition-none"
                    >
                      <ArrowLeftIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
                    </button>
                  </div>

                  <div className="@container tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-hidden">
                    {isCompactLayout && (
                      <SingleWaveDropChat
                        key={drop.id}
                        wave={wave}
                        drop={drop}
                        winningThreshold={winningThreshold}
                        winningThresholdMinDurationMs={
                          winningThresholdMinDurationMs
                        }
                        isVotingClosed={isVotingClosed}
                        isVotingControlsLocked={isVotingControlsLocked}
                      />
                    )}
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </Dialog>
        </Transition>
      </CompactModeProvider>
    </div>
  );
};
