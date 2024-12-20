import Link from "next/link";
import { useRouter } from "next/router";
import React, { useContext } from "react";
import { AuthContext } from "../../auth/Auth";
import { useUnreadNotifications } from "../../../hooks/useUnreadNotifications";
import { BrainView } from "../BrainMobile";
import { ApiWaveType } from "../../../generated/models/ApiWaveType";
import { ApiWave } from "../../../generated/models/ApiWave";

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
  const { connectedProfile } = useContext(AuthContext);
  const { haveUnreadNotifications } = useUnreadNotifications(
    connectedProfile?.profile?.handle
  );

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

  const isLinkActive = router.pathname === "/my-stream" && activeView === BrainView.DEFAULT;
  const isNotificationsActive = router.pathname === "/my-stream/notifications" && activeView === BrainView.DEFAULT;

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

  const leaderboardButtonClasses = `tw-border-none tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-9 tw-rounded-lg ${
    activeView === BrainView.LEADERBOARD ? "tw-bg-iron-800" : "tw-bg-iron-950"
  }`;

  const leaderboardButtonTextClasses = `tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap ${
    activeView === BrainView.LEADERBOARD ? "tw-text-iron-300" : "tw-text-iron-400"
  }`;

  const myStreamLinkClasses = `tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-9 tw-rounded-md ${
    isLinkActive ? "tw-bg-iron-800" : "tw-bg-iron-950"
  }`;

  const myStreamTextClasses = `tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap ${
    isLinkActive ? "tw-text-iron-300" : "tw-text-iron-400"
  }`;

  const notificationsLinkClasses = `tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-9 tw-rounded-md ${
    isNotificationsActive ? "tw-bg-iron-800" : "tw-bg-iron-950"
  }`;

  const notificationsTextClasses = `tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap ${
    isNotificationsActive ? "tw-text-iron-300" : "tw-text-iron-400"
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

  const onNotificationsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onLinkClick("/my-stream/notifications");
  };

  return (
    <div className="tw-py-4 tw-px-2 sm:tw-px-4 md:tw-px-6">
      <div className="tw-flex tw-justify-center tw-items-center tw-p-1 tw-gap-1 tw-w-full tw-overflow-x-auto tw-overflow-y-hidden tw-scrollbar-thin tw-scrollbar-thumb-iron-300 tw-h-11 tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-800 tw-rounded-lg">
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
          <button
            onClick={() => onViewChange(BrainView.LEADERBOARD)}
            className={leaderboardButtonClasses}
          >
            <span className={leaderboardButtonTextClasses}>Leaderboard</span>
          </button>
        )}
        <Link
          href="/my-stream/notifications"
          onClick={onNotificationsClick}
          className={notificationsLinkClasses}
        >
          <span className={notificationsTextClasses}>
            Notifications
          </span>
          {haveUnreadNotifications && (
            <span className="tw-size-2 -tw-mt-2 -tw-ml-0.5 tw-bg-red tw-rounded-full"></span>
          )}
        </Link>
      </div>
    </div>
  );
};
export default BrainMobileTabs;
