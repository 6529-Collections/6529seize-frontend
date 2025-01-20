import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { BrainView } from "../BrainMobile";
import { ApiWaveType } from "../../../generated/models/ApiWaveType";
import { ApiWave } from "../../../generated/models/ApiWave";
import MyStreamWaveTabsLeaderboard from "../my-stream/MyStreamWaveTabsLeaderboard";

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

  const isRankWave = wave?.wave.type === ApiWaveType.Rank;
  const isWave = () => !!(router.query.wave as string);

  React.useEffect(() => {
    const handleRouteChange = () => {
      onViewChange(BrainView.DEFAULT);
    };

    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events, onViewChange]);

  const isLinkActive =
    router.pathname === "/my-stream" && activeView === BrainView.DEFAULT;

  const wavesButtonClasses = `tw-border-none tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-9 tw-rounded-lg ${
    activeView === BrainView.WAVES ? "tw-bg-iron-800" : "tw-bg-iron-950"
  }`;

  const wavesButtonTextClasses = `tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap ${
    activeView === BrainView.WAVES ? "tw-text-iron-300" : "tw-text-iron-400"
  }`;

  const aboutButtonClasses = `tw-border-none tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-9 tw-rounded-lg ${
    activeView === BrainView.ABOUT ? "tw-bg-iron-800" : "tw-bg-iron-950"
  }`;

  const aboutButtonTextClasses = `tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap ${
    activeView === BrainView.ABOUT ? "tw-text-iron-300" : "tw-text-iron-400"
  }`;

  const myStreamLinkClasses = `tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-9 tw-rounded-md ${
    isLinkActive ? "tw-bg-iron-800" : "tw-bg-iron-950"
  }`;

  const myStreamTextClasses = `tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap ${
    isLinkActive ? "tw-text-iron-300" : "tw-text-iron-400"
  }`;

  const outcomeButtonClasses = `tw-border-none tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-9 tw-rounded-lg ${
    activeView === BrainView.OUTCOME ? "tw-bg-iron-800" : "tw-bg-iron-950"
  }`;
  const otucomeButtonTextClasses = `tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap ${
    activeView === BrainView.OUTCOME ? "tw-text-iron-300" : "tw-text-iron-400"
  }`;

  const notificationsButtonClasses = `tw-border-none tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-9 tw-rounded-lg ${
    activeView === BrainView.NOTIFICATIONS ? "tw-bg-iron-800" : "tw-bg-iron-950"
  }`;

  const notificationsButtonTextClasses = `tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap ${
    activeView === BrainView.NOTIFICATIONS
      ? "tw-text-iron-300"
      : "tw-text-iron-400"
  }`;

  const getMyStreamHref = () => {
    if (router.pathname === "/my-stream") return router.asPath;
    return "/my-stream";
  };

  const onLinkClick = (path: string, toPath?: string) => {
    if (router.pathname === path) {
      onViewChange(BrainView.DEFAULT);
    } else {
      router.push(toPath ?? path);
    }
  };

  const onMyStreamClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onLinkClick("/my-stream", getMyStreamHref());
  };

  return (
    <div className="tw-py-2 tw-px-2 sm:tw-px-4 md:tw-px-6">
      <div className="tw-flex tw-justify-center tw-items-center tw-p-1 tw-gap-1 tw-w-full tw-overflow-x-auto tw-overflow-y-hidden tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-h-11 tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-800 tw-rounded-lg">
        <button
          onClick={() => onViewChange(BrainView.WAVES)}
          className={wavesButtonClasses}
        >
          <span className={wavesButtonTextClasses}>Waves</span>
        </button>
        {isWave() && (
          <button
            onClick={() => onViewChange(BrainView.ABOUT)}
            className={aboutButtonClasses}
          >
            <span className={aboutButtonTextClasses}>About</span>
          </button>
        )}
        <Link
          href={getMyStreamHref()}
          onClick={onMyStreamClick}
          className={myStreamLinkClasses}
        >
          <span className={myStreamTextClasses}>My Stream</span>
        </Link>
        {isWave() && isRankWave && (
          <>
            <MyStreamWaveTabsLeaderboard
              wave={wave}
              activeView={activeView}
              onViewChange={onViewChange}
            />
            <button
              onClick={() => onViewChange(BrainView.OUTCOME)}
              className={outcomeButtonClasses}
            >
              <span className={otucomeButtonTextClasses}>Outcome</span>
            </button>
          </>
        )}
        <button
          onClick={() => onViewChange(BrainView.NOTIFICATIONS)}
          className={notificationsButtonClasses}
        >
          <span className={notificationsButtonTextClasses}>Notifications</span>
        </button>
      </div>
    </div>
  );
};
export default BrainMobileTabs;
