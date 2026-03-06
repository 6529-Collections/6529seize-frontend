"use client";

import { useEffect } from "react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useViewContext } from "./ViewContext";
import type { NavItem as NavItemData } from "./navTypes";
import { motion } from "framer-motion";
import { useAuth } from "../auth/Auth";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import { useTitle } from "@/contexts/TitleContext";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useUnreadIndicator } from "@/hooks/useUnreadIndicator";
import { useNotificationsContext } from "../notifications/NotificationsContext";
import { isNavItemActive } from "./isNavItemActive";
import { useWaveData } from "@/hooks/useWaveData";
import { useWave } from "@/hooks/useWave";
import { getActiveWaveIdFromUrl } from "@/helpers/navigation.helpers";

interface Props {
  readonly item: NavItemData;
}

const NavItem = ({ item }: Props) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { activeView, handleNavClick } = useViewContext();

  const { name } = item;
  const { icon } = item;
  const { address, seizeConnect } = useSeizeConnectContext();

  const isLogoItem = name === "Home";

  // Determine if the current wave (if any) is a DM
  const waveIdFromQuery = getActiveWaveIdFromUrl({ pathname, searchParams });
  const { data: waveData } = useWaveData({
    waveId: waveIdFromQuery,
    // Minimal onWaveNotFound, actual handling of not found is likely elsewhere
    onWaveNotFound: () => {},
  });
  const { isDm: isCurrentWaveDmValue } = useWave(waveData);

  // Add unread notifications logic
  const { connectedProfile } = useAuth();
  const normalizedConnectedHandle = (
    connectedProfile?.normalised_handle ?? connectedProfile?.handle
  )?.toLowerCase();
  const normalizedConnectedAddress = address?.toLowerCase();
  const profileSlug = normalizedConnectedHandle ?? normalizedConnectedAddress;
  const profileHref = profileSlug ? `/${profileSlug}` : null;
  const { setTitle } = useTitle();
  const { notifications, haveUnreadNotifications } = useUnreadNotifications(
    item.name === "Notifications" ? (connectedProfile?.handle ?? null) : null
  );

  // Add unread messages logic
  const { hasUnread: hasUnreadMessages } = useUnreadIndicator({
    type: "messages",
    handle:
      item.name === "Messages" ? (connectedProfile?.handle ?? null) : null,
  });

  const { removeAllDeliveredNotifications } = useNotificationsContext();

  useEffect(() => {
    if (item.name !== "Notifications") return;
    setTitle(
      haveUnreadNotifications
        ? `(${notifications?.unread_count}) Notifications | 6529.io`
        : "6529.io"
    );
    if (!haveUnreadNotifications) {
      removeAllDeliveredNotifications();
    }
  }, [haveUnreadNotifications, notifications?.unread_count]);

  if (item.disabled) {
    return (
      <button
        type="button"
        aria-label={name}
        aria-disabled="true"
        disabled
        className="tw-pointer-events-none tw-relative tw-flex tw-h-full tw-w-full tw-min-w-0 tw-flex-col tw-items-center tw-justify-start tw-border-0 tw-bg-transparent tw-opacity-40 tw-transition-colors focus:tw-outline-none"
      >
        <div className="tw-mt-5 tw-flex tw-items-center tw-justify-center">
          {item.iconComponent ? (
            <item.iconComponent
              className={`${
                item.iconSizeClass ?? "tw-size-7"
              } tw-text-iron-500`}
            />
          ) : (
            <Image
              src={icon}
              alt={name}
              width={24}
              height={24}
              unoptimized
              className={item.iconSizeClass ?? "tw-size-7"}
            />
          )}
        </div>
      </button>
    );
  }

  const iconSizeClass = item.iconSizeClass ?? "tw-size-7";

  const isProfileItem = item.kind === "route" && item.name === "Profile";
  const normalizedPathname = pathname.toLowerCase();
  const isProfileActive =
    isProfileItem &&
    activeView === null &&
    profileHref !== null &&
    (normalizedPathname === profileHref ||
      normalizedPathname.startsWith(`${profileHref}/`));

  const isActive = isProfileItem
    ? isProfileActive
    : isNavItemActive(
        item,
        pathname,
        searchParams,
        activeView,
        isCurrentWaveDmValue
      );

  const handleClick = () => {
    if (item.kind === "route" && item.name === "Profile") {
      if (!address) {
        seizeConnect();
        return;
      }

      handleNavClick({
        ...item,
        href: profileHref ?? item.href,
      });
      return;
    }

    handleNavClick(item);
  };

  return (
    <button
      type="button"
      aria-label={name}
      aria-current={isActive ? "page" : undefined}
      onClick={handleClick}
      className="tw-relative tw-flex tw-h-full tw-w-full tw-min-w-0 tw-flex-col tw-items-center tw-justify-start tw-border-0 tw-bg-transparent tw-transition-colors focus:tw-outline-none"
    >
      {isActive && (
        <motion.div
          layoutId="nav-indicator"
          className={`tw-absolute tw-left-0 tw-top-0 tw-h-0.5 tw-w-full tw-rounded-full tw-bg-white ${
            isLogoItem ? "tw-top-1" : ""
          }`}
        />
      )}
      <div className="tw-relative tw-mt-5 tw-flex tw-items-center tw-justify-center">
        {item.iconComponent ? (
          <item.iconComponent
            className={`${iconSizeClass} ${
              isActive ? "tw-text-white" : "tw-text-iron-500"
            }`}
          />
        ) : (
          <Image
            src={icon}
            alt={name}
            width={24}
            height={24}
            unoptimized
            className={iconSizeClass}
          />
        )}
        {item.name === "Notifications" && haveUnreadNotifications && (
          <div className="tw-absolute -tw-right-1 -tw-top-1 tw-h-2.5 tw-w-2.5 tw-rounded-full tw-bg-red"></div>
        )}
        {item.name === "Messages" && hasUnreadMessages && (
          <div className="tw-absolute -tw-right-1 -tw-top-1 tw-h-2.5 tw-w-2.5 tw-rounded-full tw-bg-red"></div>
        )}
      </div>
    </button>
  );
};

export default NavItem;
