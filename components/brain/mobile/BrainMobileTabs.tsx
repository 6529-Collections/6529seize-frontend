import React, { useCallback, useRef } from "react";
import { useRouter } from "next/router";
import { BrainView } from "../BrainMobile";
import { ApiWave } from "../../../generated/models/ApiWave";
import MyStreamWaveTabsLeaderboard from "../my-stream/MyStreamWaveTabsLeaderboard";
import { useLayout } from "../my-stream/layout/LayoutContext";
import { useWave } from "../../../hooks/useWave";

interface BrainMobileTabsProps {
  readonly activeView: BrainView;
  readonly onViewChange: (view: BrainView) => void;
  readonly wave?: ApiWave;
}

const BrainMobileTabs: React.FC<BrainMobileTabsProps> = ({
  activeView,
  onViewChange,
  wave,
}) => {
  const router = useRouter();
  const { registerRef } = useLayout();

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

  const isWave = () => !!(router.query.wave as string);

  const { isMemesWave, isRankWave } = useWave(wave);

  const tabRefs = useRef<Record<BrainView, HTMLButtonElement | null>>({
    [BrainView.DEFAULT]: null,
    [BrainView.ABOUT]: null,
    [BrainView.LEADERBOARD]: null,
    [BrainView.WINNERS]: null,
    [BrainView.OUTCOME]: null,
    [BrainView.MY_VOTES]: null,
    [BrainView.FAQ]: null,
  });

  React.useEffect(() => {
    const handleRouteChange = () => {
      onViewChange(BrainView.DEFAULT);
    };

    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events, onViewChange]);

  React.useEffect(() => {
    const activeTabEl = tabRefs.current[activeView];
    if (activeTabEl) {
      activeTabEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activeView]);

  const aboutButtonClasses = `tw-border-none tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-2 tw-h-8 tw-gap-1 tw-flex-1  tw-rounded-md ${
    activeView === BrainView.ABOUT ? "tw-bg-iron-800" : "tw-bg-iron-950"
  }`;

  const aboutButtonTextClasses = `tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap ${
    activeView === BrainView.ABOUT ? "tw-text-iron-300" : "tw-text-iron-400"
  }`;

  const outcomeButtonClasses = `tw-border-none tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-2 tw-h-8 tw-gap-1 tw-flex-1  tw-rounded-md ${
    activeView === BrainView.OUTCOME ? "tw-bg-iron-800" : "tw-bg-iron-950"
  }`;
  const otucomeButtonTextClasses = `tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap ${
    activeView === BrainView.OUTCOME ? "tw-text-iron-300" : "tw-text-iron-400"
  }`;

  const myVotesButtonClasses = `tw-border-none tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-2 tw-h-8 tw-gap-1 tw-flex-1  tw-rounded-md ${
    activeView === BrainView.MY_VOTES ? "tw-bg-iron-800" : "tw-bg-iron-950"
  }`;

  const myVotesButtonTextClasses = `tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap ${
    activeView === BrainView.MY_VOTES ? "tw-text-iron-300" : "tw-text-iron-400"
  }`;

  const chatButtonClasses = `tw-border-none tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-2 tw-h-8 tw-gap-1 tw-flex-1  tw-rounded-md ${
    activeView === BrainView.DEFAULT ? "tw-bg-iron-800" : "tw-bg-iron-950"
  }`;

  const chatButtonTextClasses = `tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap ${
    activeView === BrainView.DEFAULT ? "tw-text-iron-300" : "tw-text-iron-400"
  }`;

  const onChatClick = () => {
    onViewChange(BrainView.DEFAULT);
  };

  return (
    <div
      ref={setMobileTabsRef}
      className="tw-py-2 tw-px-2 sm:tw-px-4 md:tw-px-6 tw-overflow-x-auto"
    >
      <div className="tw-flex tw-justify-start tw-items-center tw-p-1 tw-gap-1 tw-w-full tw-overflow-x-auto tw-overflow-y-hidden tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-h-10 tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-800 tw-rounded-lg">
        <button
          ref={(el) => {
            tabRefs.current[BrainView.DEFAULT] = el;
          }}
          onClick={onChatClick}
          className={chatButtonClasses}
        >
          <span className={chatButtonTextClasses}>Chat</span>
        </button>
        {isWave() && (
          <button
            ref={(el) => {
              tabRefs.current[BrainView.ABOUT] = el;
            }}
            onClick={() => onViewChange(BrainView.ABOUT)}
            className={aboutButtonClasses}
          >
            <span className={aboutButtonTextClasses}>About</span>
          </button>
        )}
        {isWave() && wave && isRankWave && (
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
                  className={myVotesButtonClasses}
                >
                  <span className={myVotesButtonTextClasses}>My Votes</span>
                </button>
              </>
            )}
            <button
              ref={(el) => {
                tabRefs.current[BrainView.OUTCOME] = el;
              }}
              onClick={() => onViewChange(BrainView.OUTCOME)}
              className={outcomeButtonClasses}
            >
              <span className={otucomeButtonTextClasses}>Outcome</span>
            </button>
            {isMemesWave && (
              <button
                ref={(el) => {
                  tabRefs.current[BrainView.FAQ] = el;
                }}
                onClick={() => onViewChange(BrainView.FAQ)}
                className={`tw-border-none tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-2 tw-h-8 tw-gap-1 tw-flex-1 tw-rounded-md ${
                  activeView === BrainView.FAQ
                    ? "tw-bg-iron-800"
                    : "tw-bg-iron-950"
                }`}
              >
                <span
                  className={`tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap ${
                    activeView === BrainView.FAQ
                      ? "tw-text-iron-300"
                      : "tw-text-iron-400"
                  }`}
                >
                  FAQ
                </span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default BrainMobileTabs;
