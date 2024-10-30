import Link from "next/link";
import { useRouter } from "next/router";
import React, { useContext } from "react";
import { AuthContext } from "../../auth/Auth";
import { useUnreadNotifications } from "../../../hooks/useUnreadNotifications";

interface BrainMobileTabsProps {
  readonly onWavesButtonClick: (activate: boolean) => void;
  readonly isWavesButtonActive: boolean;
}

const BrainMobileTabs: React.FC<BrainMobileTabsProps> = ({
  onWavesButtonClick,
  isWavesButtonActive,
}) => {
  const router = useRouter();
  const { connectedProfile } = useContext(AuthContext);
  const { haveUnreadNotifications } = useUnreadNotifications(
    connectedProfile?.profile?.handle
  );

  React.useEffect(() => {
    const handleRouteChange = () => {
      onWavesButtonClick(false);
    };

    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events, onWavesButtonClick]);

  const isLinkActive = (path: string) =>
    router.pathname === path && !isWavesButtonActive;

  const getLinkClasses = (path: string) =>
    `tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-9 tw-rounded-md ${
      isLinkActive(path) ? "tw-bg-iron-800" : "tw-bg-iron-950"
    }`;

  const getTextClasses = (path: string) =>
    `tw-font-semibold tw-text-sm tw-whitespace-nowrap ${
      isLinkActive(path) ? "tw-text-iron-300" : "tw-text-iron-400"
    }`;

  const getWavesButtonClasses = () =>
    `tw-border-none tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-9 tw-rounded-lg ${
      isWavesButtonActive ? "tw-bg-iron-800" : "tw-bg-iron-950"
    }`;

  const getWavesButtonTextClasses = () =>
    `tw-font-semibold tw-text-sm tw-whitespace-nowrap ${
      isWavesButtonActive ? "tw-text-iron-300" : "tw-text-iron-400"
    }`;

  const getMyStreamHref = () => {
    if (router.pathname === "/my-stream") return router.asPath;
    return "/my-stream";
  };

  const onLinkClick = (path: string, toPath?: string) => {
    if (router.pathname === path) {
      onWavesButtonClick(false);
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
          onClick={() => onWavesButtonClick(true)}
          className={getWavesButtonClasses()}
        >
          <span className={getWavesButtonTextClasses()}>Waves</span>
        </button>
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
