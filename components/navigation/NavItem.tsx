import React, { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useViewContext } from "./ViewContext";
import type { NavItem as NavItemData } from "./navTypes";
import { motion } from "framer-motion";
import { TitleType, useAuth } from "../auth/Auth";
import { useUnreadNotifications } from "../../hooks/useUnreadNotifications";
import { useNotificationsContext } from "../notifications/NotificationsContext";

interface Props {
  readonly item: NavItemData;
}

const NavItem = ({ item }: Props) => {
  const router = useRouter();
  const { activeView, handleNavClick } = useViewContext();

  const { name } = item;
  const { icon } = item;

  const isStream = name === "Stream";

  // Add unread notifications logic
  const { connectedProfile, setTitle } = useAuth();
  const { notifications, haveUnreadNotifications } = useUnreadNotifications(
    item.name === "Notifications" ? connectedProfile?.handle ?? null : null
  );
  const { removeAllDeliveredNotifications } = useNotificationsContext();

  useEffect(() => {
    if (item.name !== "Notifications") return;
    setTitle({
      title: haveUnreadNotifications
        ? `(${notifications?.unread_count}) Notifications | 6529.io`
        : null,
      type: TitleType.NOTIFICATION,
    });
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
        className="tw-relative tw-bg-transparent tw-border-0 tw-flex tw-flex-col tw-items-center tw-justify-center focus:tw-outline-none tw-transition-colors tw-w-14 tw-h-16 tw-opacity-40 tw-pointer-events-none"
      >
        <div className="tw-flex tw-items-center tw-justify-center">
          {item.iconComponent ? (
            <item.iconComponent className={`${item.iconSizeClass ?? "tw-size-7"} tw-text-iron-500`} />
          ) : (
            <Image src={icon} alt={name} width={24} height={24} unoptimized className={item.iconSizeClass ?? "tw-size-7"} />
          )}
        </div>
      </button>
    );
  }

  const iconSizeClass = item.iconSizeClass ?? "tw-size-7";

  let isActive = false;
  const isWaveSubRoute =
    router.pathname === "/my-stream" && typeof router.query.wave === "string";

  const handleClick = () => {
    if (
      item.name === "Notifications" &&
      item.kind === "route" &&
      router.pathname === "/my-stream/notifications"
    ) {
      router.push("/my-stream/notifications?reload=true", undefined, {
        shallow: true,
      });
      return;
    }
    handleNavClick(item);
  };

  if (item.kind === "route") {
    if (item.name === "Stream") {
      isActive =
        router.pathname === item.href &&
        activeView === null &&
        typeof router.query.wave !== "string";
    } else {
      isActive = router.pathname === item.href && activeView === null;
    }
  } else {
    if (item.viewKey === "waves") {
      isActive = activeView === item.viewKey || isWaveSubRoute;
    } else {
      isActive = activeView === item.viewKey;
    }
  }

  return (
    <button
      type="button"
      aria-label={name}
      aria-current={isActive ? "page" : undefined}
      onClick={handleClick}
      className="tw-relative tw-bg-transparent tw-border-0 tw-flex tw-flex-col tw-items-center tw-justify-center focus:tw-outline-none tw-transition-colors 
      tw-w-14 tw-h-16"
    >
      {isActive && (
        <motion.div
          layoutId="nav-indicator"
          className={`tw-absolute tw-top-0 tw-left-0 tw-w-full tw-h-0.5 tw-bg-white tw-rounded-full ${
            isStream ? "tw-top-1" : ""
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
          <div className="tw-absolute -tw-right-1 -tw-top-1 tw-rounded-full tw-bg-red tw-h-2.5 tw-w-2.5"></div>
        )}
      </div>
    </button>
  );
};

export default NavItem;
