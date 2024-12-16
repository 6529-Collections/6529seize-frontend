import Link from "next/link";
import { useRouter } from "next/router";
import React, { useContext } from "react";
import { AuthContext } from "../../auth/Auth";
import { useUnreadNotifications } from "../../../hooks/useUnreadNotifications";
import { BrainView } from "../BrainMobile";

interface BrainMobileTabsProps {
  readonly activeView: BrainView;
  readonly onViewChange: (view: BrainView) => void;
}

const BrainMobileTabs: React.FC<BrainMobileTabsProps> = ({
  activeView,
  onViewChange,
}) => {
  const router = useRouter();
  const { connectedProfile } = useContext(AuthContext);
  const { haveUnreadNotifications } = useUnreadNotifications(
    connectedProfile?.profile?.handle
  );

  React.useEffect(() => {
    const handleRouteChange = () => {
      onViewChange(BrainView.DEFAULT);
    };

    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events, onViewChange]);

  const isWave = () => !!(router.query.wave as string);

  const isLinkActive = (path: string) =>
    router.pathname === path && activeView === BrainView.DEFAULT;

  const getLinkClasses = (path: string) =>
    `tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-9 tw-rounded-md ${
      isLinkActive(path) ? "tw-bg-iron-800" : "tw-bg-iron-950"
    }`;

  const getTextClasses = (path: string) =>
    `tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap ${
      isLinkActive(path) ? "tw-text-iron-300" : "tw-text-iron-400"
    }`;

  const getWavesButtonClasses = () =>
    `tw-border-none tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-9 tw-rounded-lg ${
      activeView === BrainView.WAVES ? "tw-bg-iron-800" : "tw-bg-iron-950"
    }`;

  const getWavesButtonTextClasses = () =>
    `tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap ${
      activeView === BrainView.WAVES ? "tw-text-iron-300" : "tw-text-iron-400"
    }`;

  const getAboutButtonTextClasses = () =>
    `tw-font-semibold tw-text-xs sm:tw-text-sm tw-whitespace-nowrap ${
      activeView === BrainView.ABOUT ? "tw-text-iron-300" : "tw-text-iron-400"
    }`;

  const getAboutButtonClasses = () =>
    `tw-border-none tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-9 tw-rounded-lg ${
      activeView === BrainView.ABOUT ? "tw-bg-iron-800" : "tw-bg-iron-950"
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
    <div className="tw-py-4">
      <div className="tw-flex tw-justify-center tw-items-center tw-p-1 tw-gap-1 tw-w-full tw-h-11 tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-800 tw-rounded-lg">
        <button
          onClick={() => onViewChange(BrainView.WAVES)}
          className={getWavesButtonClasses()}
        >
          <span className={getWavesButtonTextClasses()}>Waves</span>
        </button>
        {isWave() && (
          <button
            onClick={() => onViewChange(BrainView.ABOUT)}
            className={getAboutButtonClasses()}
          >
            <span className={getAboutButtonTextClasses()}>About</span>
          </button>
        )}
        <Link
          href={getMyStreamHref()}
          onClick={onMyStreamClick}
          className={getLinkClasses("/my-stream")}
        >
          <span className={getTextClasses("/my-stream")}>My Stream</span>
        </Link>
        <Link
          href="/my-stream/notifications"
          onClick={onNotificationsClick}
          className={getLinkClasses("/my-stream/notifications")}
        >
          <span className={getTextClasses("/my-stream/notifications")}>
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
