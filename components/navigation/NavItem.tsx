"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useTitle } from "@/contexts/TitleContext";
import { useUnreadIndicator } from "@/hooks/useUnreadIndicator";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useAuth } from "../auth/Auth";
import { useNotificationsContext } from "../notifications/NotificationsContext";
import { isNavItemActive } from "./isNavItemActive";
import { useViewContext } from "./ViewContext";
import type { NavItem as NavItemData } from "./navTypes";

interface Props {
  readonly item: NavItemData;
  readonly isCurrentWaveDm?: boolean;
}

const NavItem = ({ item, isCurrentWaveDm = false }: Props) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { activeView, handleNavClick } = useViewContext();

  const { name } = item;
  const { icon } = item;

  const isLogoItem = name === "Home";

  // Add unread notifications logic
  const { connectedProfile } = useAuth();
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
    if (haveUnreadNotifications) {
      setTitle(`(${notifications?.unread_count}) Notifications | 6529.io`);
    }
    if (!haveUnreadNotifications) {
      removeAllDeliveredNotifications();
    }
  }, [
    haveUnreadNotifications,
    item.name,
    notifications?.unread_count,
    removeAllDeliveredNotifications,
    setTitle,
  ]);

  if (item.disabled) {
    return (
      <button
        type="button"
        aria-label={name}
        aria-disabled="true"
        disabled
        className="tw-pointer-events-none tw-relative tw-flex tw-h-16 tw-w-full tw-min-w-0 tw-flex-col tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-opacity-40 tw-transition-colors focus:tw-outline-none"
      >
        <div className="tw-flex tw-items-center tw-justify-center">
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

  const isActive = isNavItemActive(
    item,
    pathname ?? "",
    searchParams ?? new URLSearchParams(),
    activeView,
    isCurrentWaveDm
  );

  return (
    <button
      type="button"
      aria-label={name}
      aria-current={isActive ? "page" : undefined}
      onClick={() => handleNavClick(item)}
      className="tw-relative tw-flex tw-h-16 tw-w-full tw-min-w-0 tw-flex-col tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-transition-colors focus:tw-outline-none"
    >
      {isActive && (
        <motion.div
          layoutId="nav-indicator"
          className={`tw-absolute tw-left-0 tw-top-0 tw-h-0.5 tw-w-full tw-rounded-full tw-bg-white ${
            isLogoItem ? "tw-top-1" : ""
          }`}
        />
      )}
      <div className="tw-relative tw-flex tw-items-center tw-justify-center">
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
