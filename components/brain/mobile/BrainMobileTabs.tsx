"use client";

import React, { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { BrainView } from "../BrainMobile";
import { ApiWave } from "../../../generated/models/ApiWave";
import MyStreamWaveTabsLeaderboard from "../my-stream/MyStreamWaveTabsLeaderboard";
import { useLayout } from "../my-stream/layout/LayoutContext";
import { useWave } from "../../../hooks/useWave";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useUnreadIndicator } from "../../../hooks/useUnreadIndicator";
import { useUnreadNotifications } from "../../../hooks/useUnreadNotifications";
import { useAuth } from "../../auth/Auth";

interface BrainMobileTabsProps {
  readonly activeView: BrainView;
  readonly onViewChange: (view: BrainView) => void;
  readonly wave?: ApiWave;
  readonly waveActive: boolean;
  readonly showWavesTab: boolean;
  readonly showStreamBack: boolean;
  readonly isApp?: boolean;
}

const BrainMobileTabs: React.FC<BrainMobileTabsProps> = ({
  activeView,
  onViewChange,
  wave,
  waveActive,
  showWavesTab,
  showStreamBack,
  isApp,
}) => {
  const router = useRouter();
  const { registerRef } = useLayout();
  const { connectedProfile } = useAuth();

  // Local ref for component-specific needs
  const mobileTabsRef = useRef<HTMLDivElement | null>(null);

  // Callback ref for registration with LayoutContext
  const setMobileTabsRef = useCallback(
    (element: HTMLDivElement | null) => {
      // Update local ref
      mobileTabsRef.current = element;

      // Register with LayoutContext
      registerRef("mobileTabs", element);
    },
    [registerRef]
  );

  const { isMemesWave, isRankWave } = useWave(wave);

  // Get unread indicator for messages
  const { hasUnread: hasUnreadMessages } = useUnreadIndicator({
    type: "messages",
    handle: connectedProfile?.handle ?? null,
  });

  // Get unread notifications using the dedicated hook
  const { haveUnreadNotifications } = useUnreadNotifications(
    connectedProfile?.handle ?? null
  );

  const tabRefs = useRef<Record<BrainView, HTMLButtonElement | null>>({
    [BrainView.DEFAULT]: null,
    [BrainView.ABOUT]: null,
    [BrainView.LEADERBOARD]: null,
    [BrainView.WINNERS]: null,
    [BrainView.OUTCOME]: null,
    [BrainView.MY_VOTES]: null,
    [BrainView.FAQ]: null,
    [BrainView.WAVES]: null,
    [BrainView.MESSAGES]: null,
    [BrainView.NOTIFICATIONS]: null,
  });

  React.useEffect(() => {
    const activeTabEl = tabRefs.current[activeView];
    if (activeTabEl) {
      activeTabEl.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeView]);

  const aboutButtonClasses = `tw-border-none tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-2 tw-py-1.5 tw-gap-1 tw-flex-1  tw-rounded-md ${
    activeView === BrainView.ABOUT ? "tw-bg-iron-800" : "tw-bg-iron-950"
  }`;

  const aboutButtonTextClasses = `tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap ${
    activeView === BrainView.ABOUT ? "tw-text-iron-300" : "tw-text-iron-400"
  }`;

  const outcomeButtonClasses = `tw-border-none tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-2 tw-py-1.5 tw-gap-1 tw-flex-1  tw-rounded-md ${
    activeView === BrainView.OUTCOME ? "tw-bg-iron-800" : "tw-bg-iron-950"
  }`;
  const otucomeButtonTextClasses = `tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap ${
    activeView === BrainView.OUTCOME ? "tw-text-iron-300" : "tw-text-iron-400"
  }`;

  const myVotesButtonClasses = `tw-border-none tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-2 tw-py-1.5 tw-gap-1 tw-flex-1  tw-rounded-md ${
    activeView === BrainView.MY_VOTES ? "tw-bg-iron-800" : "tw-bg-iron-950"
  }`;

  const myVotesButtonTextClasses = `tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap ${
    activeView === BrainView.MY_VOTES ? "tw-text-iron-300" : "tw-text-iron-400"
  }`;

  const chatButtonClasses = `tw-border-none tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-2 tw-py-1.5 tw-gap-1 tw-flex-1  tw-rounded-md ${
    activeView === BrainView.DEFAULT ? "tw-bg-iron-800" : "tw-bg-iron-950"
  }`;

  const chatButtonTextClasses = `tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap ${
    activeView === BrainView.DEFAULT ? "tw-text-iron-300" : "tw-text-iron-400"
  }`;

  const wavesButtonClasses = `tw-border-none tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-2 tw-py-1.5 tw-gap-1 tw-flex-1  tw-rounded-md ${
    activeView === BrainView.WAVES ? "tw-bg-iron-800" : "tw-bg-iron-950"
  }`;

  const wavesButtonTextClasses = `tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap ${
    activeView === BrainView.WAVES ? "tw-text-iron-300" : "tw-text-iron-400"
  }`;

  const messagesButtonClasses = `tw-border-none tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-2 tw-py-1.5 tw-gap-1 tw-flex-1 tw-rounded-md ${
    activeView === BrainView.MESSAGES ? "tw-bg-iron-800" : "tw-bg-iron-950"
  }`;

  const messagesButtonTextClasses = `tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap tw-relative ${
    activeView === BrainView.MESSAGES ? "tw-text-iron-300" : "tw-text-iron-400"
  }`;

  const notificationsButtonClasses = `tw-border-none tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-2 tw-py-1.5 tw-gap-1 tw-flex-1 tw-rounded-md ${
    activeView === BrainView.NOTIFICATIONS ? "tw-bg-iron-800" : "tw-bg-iron-950"
  }`;

  const notificationsButtonTextClasses = `tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap tw-relative ${
    activeView === BrainView.NOTIFICATIONS
      ? "tw-text-iron-300"
      : "tw-text-iron-400"
  }`;

  const backButtonClasses = `tw-border-none tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-2 tw-py-1.5  tw-gap-1 tw-flex-1 tw-rounded-md tw-bg-iron-950`;

  const onChatClick = () => {
    onViewChange(BrainView.DEFAULT);
  };

  const onNotificationsClick = () => {
    onViewChange(BrainView.NOTIFICATIONS);
  };

  return (
    <div
      ref={setMobileTabsRef}
      className="tw-py-2 tw-px-2 sm:tw-px-4 md:tw-px-6 tw-overflow-x-auto">
      <div className="tw-flex tw-justify-start tw-items-center tw-p-1 tw-gap-1 tw-w-full tw-overflow-x-auto tw-overflow-y-hidden tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-py-1 tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-800 tw-rounded-lg">
        {waveActive && showStreamBack && !isApp && (
          <>
            <button
              onClick={() => {
                router.push("/my-stream");
                onViewChange(BrainView.DEFAULT);
              }}
              className={backButtonClasses}>
              <ArrowLeftIcon className="tw-size-4 tw-text-iron-400" />
              <span className="tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap tw-text-iron-400">
                My Stream
              </span>
            </button>
            {/* Divider */}
            <div className="tw-h-4 tw-w-px tw-bg-iron-700 tw-mx-1 tw-flex-shrink-0" />
          </>
        )}
        {!waveActive && showWavesTab && (
          <button
            ref={(el) => {
              tabRefs.current[BrainView.WAVES] = el;
            }}
            onClick={() => onViewChange(BrainView.WAVES)}
            className={wavesButtonClasses}>
            <span className={wavesButtonTextClasses}>Waves</span>
          </button>
        )}
        {!isApp && !waveActive && (
          <button
            ref={(el) => {
              tabRefs.current[BrainView.MESSAGES] = el;
            }}
            onClick={() => onViewChange(BrainView.MESSAGES)}
            className={messagesButtonClasses}>
            <span className={messagesButtonTextClasses}>
              <span>Messages</span>
              {hasUnreadMessages && (
                <div className="tw-absolute tw-rounded-full -tw-right-3 tw-top-0 tw-bg-red tw-h-2 tw-w-2"></div>
              )}
            </span>
          </button>
        )}
        <button
          ref={(el) => {
            tabRefs.current[BrainView.DEFAULT] = el;
          }}
          onClick={onChatClick}
          className={chatButtonClasses}>
          <span className={chatButtonTextClasses}>
            {waveActive ? "Chat" : "My Stream"}
          </span>
        </button>
        {waveActive && (
          <button
            ref={(el) => {
              tabRefs.current[BrainView.ABOUT] = el;
            }}
            onClick={() => onViewChange(BrainView.ABOUT)}
            className={aboutButtonClasses}>
            <span className={aboutButtonTextClasses}>About</span>
          </button>
        )}
        {waveActive && wave && isRankWave && (
          <>
            <MyStreamWaveTabsLeaderboard
              wave={wave}
              activeView={activeView}
              onViewChange={onViewChange}
              registerTabRef={(view, el) => {
                tabRefs.current[view] = el;
              }}
            />
            {isMemesWave && (
              <>
                <button
                  ref={(el) => {
                    tabRefs.current[BrainView.MY_VOTES] = el;
                  }}
                  onClick={() => onViewChange(BrainView.MY_VOTES)}
                  className={myVotesButtonClasses}>
                  <span className={myVotesButtonTextClasses}>My Votes</span>
                </button>
              </>
            )}
            <button
              ref={(el) => {
                tabRefs.current[BrainView.OUTCOME] = el;
              }}
              onClick={() => onViewChange(BrainView.OUTCOME)}
              className={outcomeButtonClasses}>
              <span className={otucomeButtonTextClasses}>Outcome</span>
            </button>
            {isMemesWave && (
              <button
                ref={(el) => {
                  tabRefs.current[BrainView.FAQ] = el;
                }}
                onClick={() => onViewChange(BrainView.FAQ)}
                className={`tw-border-none tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-2 tw-py-1.5 tw-gap-1 tw-flex-1 tw-rounded-md ${
                  activeView === BrainView.FAQ
                    ? "tw-bg-iron-800"
                    : "tw-bg-iron-950"
                }`}>
                <span
                  className={`tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap ${
                    activeView === BrainView.FAQ
                      ? "tw-text-iron-300"
                      : "tw-text-iron-400"
                  }`}>
                  FAQ
                </span>
              </button>
            )}
          </>
        )}
        {!isApp && !waveActive && (
          <button
            ref={(el) => {
              tabRefs.current[BrainView.NOTIFICATIONS] = el;
            }}
            onClick={onNotificationsClick}
            className={notificationsButtonClasses}>
            <span className={notificationsButtonTextClasses}>
              Notifications
              {haveUnreadNotifications && (
                <div className="tw-absolute tw-rounded-full -tw-right-1 -tw-top-1 tw-bg-red tw-h-2 tw-w-2"></div>
              )}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
export default BrainMobileTabs;
