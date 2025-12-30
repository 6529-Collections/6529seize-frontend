"use client";

import { CompactModeProvider } from "@/contexts/CompactModeContext";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiWave } from "@/generated/models/ApiWave";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Transition } from "@headlessui/react";
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import React, { Fragment, useCallback, useEffect, useState } from "react";
import { SingleWaveDropChat } from "./SingleWaveDropChat";

interface SingleWaveDropWrapperProps {
  readonly drop: ApiDrop;
  readonly wave: ApiWave;
  readonly children: React.ReactNode;
  readonly onClose: () => void;
}

export const SingleWaveDropWrapper: React.FC<SingleWaveDropWrapperProps> = ({
  drop,
  wave,
  children,
  onClose,
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isSmallScreen = useMediaQuery("(max-width: 1023px)");

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const browserWindow = globalThis.window;
    if (browserWindow === undefined) return;
    const handleClose = () => setIsChatOpen(false);
    browserWindow.addEventListener("single-drop:close-chat", handleClose);
    return () =>
      browserWindow.removeEventListener("single-drop:close-chat", handleClose);
  }, []);

  useEffect(() => {
    if (!isChatOpen || !isSmallScreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isChatOpen, isSmallScreen]);


  return (
    <div className="tw-w-full tw-h-full tw-bg-iron-950 tw-flex tw-flex-col lg:tw-flex-row tw-overflow-hidden">
      <div className="@container tw-flex-1 tw-relative tw-h-full tw-overflow-hidden">
        <header className="tw-absolute tw-top-0 tw-left-0 tw-right-3 tw-z-20 tw-pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] tw-pb-2 tw-px-2 lg:tw-px-8 @[640px]:tw-px-8 tw-bg-iron-950/55 tw-bg-gradient-to-b tw-from-iron-950/75 tw-via-iron-950/55 tw-to-iron-950/10 tw-backdrop-blur-sm">
          <div className="tw-w-full tw-flex tw-items-center tw-justify-between">
            <div className="tw-flex tw-items-center tw-gap-6">
              <button
                type="button"
                aria-label="Close panel"
                onClick={onClose}
                className="tw-flex tw-items-center tw-justify-center tw-gap-2 tw-h-11 tw-w-11 sm:tw-h-auto sm:tw-w-auto sm:tw-px-3 sm:tw-py-2 tw-rounded-full sm:tw-rounded-lg tw-text-iron-300 desktop-hover:hover:tw-text-white tw-transition-all tw-bg-iron-950 sm:tw-bg-transparent tw-border tw-border-solid tw-border-iron-700 sm:tw-border-0"
              >
                <ArrowLeftIcon className="tw-w-5 tw-h-5 sm:tw-w-4 sm:tw-h-4 tw-flex-shrink-0" />
                <span className="tw-hidden sm:tw-inline tw-text-sm tw-font-semibold">Close</span>
              </button>
            </div>

            <button
              onClick={toggleChat}
              aria-label={isChatOpen ? "Hide chat" : "Show chat"}
              className={`tw-gap-2 tw-px-3 tw-h-11 sm:tw-h-auto sm:tw-py-2 tw-w-11 sm:tw-w-auto tw-flex-shrink-0 tw-flex tw-items-center tw-justify-center tw-backdrop-blur-md tw-rounded-full sm:tw-rounded-lg tw-transition-all tw-text-sm tw-font-medium tw-border tw-border-solid ${
                isChatOpen
                  ? "tw-bg-iron-800 tw-border-iron-700 tw-text-iron-100 desktop-hover:hover:tw-bg-iron-700"
                  : "tw-bg-iron-950 tw-border-iron-700 tw-text-iron-300 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-200"
              }`}
            >
              <ChatBubbleLeftRightIcon className="tw-w-5 tw-h-5 sm:tw-w-4 sm:tw-h-4 tw-flex-shrink-0" />
              <span className="tw-hidden sm:tw-inline">
                {isChatOpen ? "Hide" : "Show"} Chat
              </span>
            </button>
          </div>
        </header>

        <div className="tw-h-full tw-overflow-y-auto tw-[scrollbar-gutter:stable] tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
          <div
            className="tw-shrink-0 tw-h-[calc(env(safe-area-inset-top,0px)+4rem)]"
            aria-hidden="true"
          />
          {children}
          <div
            className="tw-shrink-0 tw-h-[env(safe-area-inset-bottom,0px)]"
            aria-hidden="true"
          />
        </div>
      </div>

      <CompactModeProvider compact={true}>
        <div
          className={`
            tw-hidden lg:tw-flex tw-flex-col tw-h-full tw-bg-black tw-transition-all tw-duration-300 tw-ease-in-out
            ${
              isChatOpen
                ? "tw-w-[400px] tw-border-l tw-border-solid tw-border-white/10 tw-border-y-0 tw-border-r-0"
                : "tw-w-0 tw-overflow-hidden tw-border-none"
            }
          `}
        >
          <div className="@container tw-flex tw-flex-col tw-flex-1 tw-overflow-hidden tw-relative">
            <div className="tw-absolute tw-top-0 tw-left-0 tw-right-0 tw-h-12 tw-bg-gradient-to-b tw-from-black tw-to-transparent tw-z-50 tw-pointer-events-none" />
            <SingleWaveDropChat key={drop.id} wave={wave} drop={drop} />
          </div>
        </div>
      </CompactModeProvider>

      <CompactModeProvider compact={true}>
        <Transition.Root show={isChatOpen} as={Fragment}>
          <div className="lg:tw-hidden tw-fixed tw-inset-y-0 tw-right-0 tw-left-[var(--left-rail,0px)] tw-z-[90] tw-overflow-hidden">
            <Transition.Child
              as={Fragment}
              enter="tw-ease-out tw-duration-150"
              enterFrom="tw-opacity-0"
              enterTo="tw-opacity-100"
              leave="tw-ease-in tw-duration-120"
              leaveFrom="tw-opacity-100"
              leaveTo="tw-opacity-0"
            >
              <div
                className="tw-absolute tw-inset-0 tw-bg-black/60"
                onClick={toggleChat}
              />
            </Transition.Child>
            <Transition.Child
              as={Fragment}
              enter="tw-transform tw-transition tw-ease-out tw-duration-220"
              enterFrom="tw-translate-x-full"
              enterTo="tw-translate-x-0"
              leave="tw-transform tw-transition tw-ease-in tw-duration-180"
              leaveFrom="tw-translate-x-0"
              leaveTo="tw-translate-x-full"
            >
              <div className="@container lg:tw-hidden tw-flex tw-flex-col tw-h-full tw-bg-iron-950 tw-absolute tw-inset-0 tw-z-[100] tw-transform-gpu tw-will-change-transform">
                <div className="tw-flex tw-items-center tw-px-2 lg:tw-px-8 tw-pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] tw-pb-2">
                  <button
                    onClick={toggleChat}
                    className="tw-flex tw-items-center tw-rounded-lg tw-gap-2 tw-px-3 tw-py-2 tw-text-white/70 desktop-hover:hover:tw-text-white tw-transition-colors tw-bg-transparent tw-border-0"
                  >
                    <ArrowLeftIcon className="tw-w-5 tw-h-5 tw-flex-shrink-0" />
                    <span className="tw-text-sm tw-font-semibold">Close</span>
                  </button>
                </div>

                <div className="@container tw-flex tw-flex-col tw-flex-1 tw-overflow-hidden">
                  <SingleWaveDropChat key={drop.id} wave={wave} drop={drop} />
                </div>
              </div>
            </Transition.Child>
          </div>
        </Transition.Root>
      </CompactModeProvider>
    </div>
  );
};
