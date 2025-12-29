"use client";

import { CompactModeProvider } from "@/contexts/CompactModeContext";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiWave } from "@/generated/models/ApiWave";
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import React, { useCallback, useState } from "react";
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

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  return (
    <div className="tw-w-full tw-h-full tw-bg-iron-950 tw-flex tw-flex-col lg:tw-flex-row tw-overflow-hidden">
      <div className="@container tw-flex-1 tw-relative tw-h-full lg:tw-h-screen tw-overflow-hidden">
        <header className="tw-absolute tw-top-0 tw-left-0 tw-right-0 tw-z-20 tw-pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] tw-pb-4 tw-px-4 md:tw-px-8 @[640px]:tw-px-8 tw-bg-gradient-to-b tw-from-iron-950 tw-via-iron-950/90 tw-to-transparent">
          <div className="tw-w-full tw-flex tw-items-center tw-justify-between">
            <div className="tw-flex tw-items-center tw-gap-6">
              <button
                type="button"
                aria-label="Close panel"
                onClick={onClose}
                className="tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-2 tw-rounded-lg tw-text-white/70 hover:tw-text-white tw-transition-all tw-bg-transparent tw-border-0"
              >
                <ArrowLeftIcon className="tw-w-4 tw-h-4 tw-flex-shrink-0" />
                <span className="tw-text-sm tw-font-semibold">Close</span>
              </button>
            </div>

            <button
              onClick={toggleChat}
              className={`tw-hidden lg:tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-2 tw-backdrop-blur-md tw-rounded-lg tw-transition-all tw-text-sm tw-font-medium tw-border tw-border-solid ${
                isChatOpen
                  ? "tw-bg-white/10 tw-border-white/5 tw-text-white desktop-hover:hover:tw-bg-white/15"
                  : "tw-bg-black/10 tw-border-white/15 tw-text-white/50 desktop-hover:hover:tw-bg-black/40 desktop-hover:hover:tw-border-white/20 desktop-hover:hover:tw-text-white"
              }`}
            >
              <ChatBubbleLeftRightIcon className="tw-w-4 tw-h-4 tw-flex-shrink-0" />
              <span>{isChatOpen ? "Hide" : "Show"} Chat</span>
            </button>

            <button
              onClick={toggleChat}
              className={`lg:tw-hidden tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-2 tw-backdrop-blur-md tw-rounded-lg tw-transition-all tw-text-sm tw-border tw-border-solid ${
                isChatOpen
                  ? "tw-bg-white/10 tw-border-white/20 tw-text-white"
                  : "tw-bg-black/10 tw-border-white/10 tw-text-white/50 hover:tw-bg-black/40 hover:tw-border-white/20 hover:tw-text-white"
              }`}
            >
              <ChatBubbleLeftRightIcon className="tw-w-4 tw-h-4" />
              <span>Chat</span>
            </button>
          </div>
        </header>

        <div className="tw-h-full tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300">
          {children}
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

      {isChatOpen && (
        <CompactModeProvider compact={true}>
          <div
            className="lg:tw-hidden tw-fixed tw-inset-0 tw-z-[90] tw-bg-black/60 tw-animate-in tw-fade-in tw-duration-300"
            onClick={toggleChat}
          />
          <div className="@container lg:tw-hidden tw-flex tw-flex-col tw-h-full tw-bg-iron-950 tw-fixed tw-inset-0 tw-z-[100] tw-animate-in tw-slide-in-from-right tw-duration-300">
            <div className="tw-flex tw-items-center tw-px-4 md:tw-px-8 tw-pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] tw-pb-4 tw-border-b tw-border-solid tw-border-white/10 tw-border-x-0 tw-border-t-0">
              <button
                onClick={toggleChat}
                className="tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-2 tw-text-white/70 hover:tw-text-white tw-transition-colors tw-bg-transparent tw-border-0"
              >
                <ArrowLeftIcon className="tw-w-4 tw-h-4 tw-flex-shrink-0" />
                <span className="tw-text-sm tw-font-semibold">Back</span>
              </button>
            </div>

            <div className="@container tw-flex tw-flex-col tw-flex-1 tw-overflow-hidden">
              <SingleWaveDropChat key={drop.id} wave={wave} drop={drop} />
            </div>
          </div>
        </CompactModeProvider>
      )}
    </div>
  );
};
