"use client";

import { LazyMotion, domMax, m } from "framer-motion";
import Image from "next/image";
import Link, { useLinkStatus } from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { MouseEvent } from "react";
import { useEffect } from "react";
import { useTitle } from "@/contexts/TitleContext";
import { useUnreadIndicator } from "@/hooks/useUnreadIndicator";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useAuth } from "../auth/Auth";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import { useNotificationsContext } from "../notifications/NotificationsContext";
import { getActiveWaveIdFromUrl } from "@/helpers/navigation.helpers";
import { isNavItemActive } from "./isNavItemActive";
import { getActiveViewFromUrl, useViewContext } from "./ViewContext";
import type { NavItem as NavItemData } from "./navTypes";

interface Props {
  readonly item: NavItemData;
  readonly isCurrentWaveDm?: boolean;
  readonly fullPrefetch?: boolean;
}

const iconSlotClass =
  "tw-mt-4 tw-flex tw-h-9 tw-items-center tw-justify-center";

const ActiveNavIndicator = () => (
  <LazyMotion features={domMax}>
    <m.div
      layoutId="nav-indicator"
      className="tw-absolute tw-left-0 tw-top-0 tw-h-0.5 tw-w-full tw-rounded-full tw-bg-white"
    />
  </LazyMotion>
);

const NavItemLinkContent = ({
  hasUnreadMessages,
  haveUnreadNotifications,
  icon,
  iconSizeClass,
  isActive,
  item,
}: {
  readonly hasUnreadMessages: boolean;
  readonly haveUnreadNotifications: boolean;
  readonly icon: string;
  readonly iconSizeClass: string;
  readonly isActive: boolean;
  readonly item: NavItemData;
}) => {
  const { pending } = useLinkStatus();
  const isHighlighted = isActive || pending;

  return (
    <>
      {isActive && <ActiveNavIndicator />}
      {pending && !isActive && (
        <div
          aria-hidden="true"
          data-testid="nav-item-pending-indicator"
          className="tw-absolute tw-left-0 tw-top-0 tw-h-0.5 tw-w-full tw-rounded-full tw-bg-white/60"
        />
      )}
      <div className={`tw-relative ${iconSlotClass}`}>
        {item.iconComponent ? (
          <item.iconComponent
            className={`${iconSizeClass} ${
              isHighlighted ? "tw-text-white" : "tw-text-iron-500"
            }`}
          />
        ) : (
          <Image
            src={icon}
            alt={item.name}
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
    </>
  );
};

const NavItemContent = ({
  item,
  isCurrentWaveDm = false,
  fullPrefetch = false,
}: Props) => {
  const pathname = usePathname();
  // react-doctor-disable-next-line react-doctor/nextjs-no-use-search-params-without-suspense
  const searchParams = useSearchParams();
  const activeWaveId = getActiveWaveIdFromUrl({ pathname, searchParams });
  const activeView = getActiveViewFromUrl({
    activeWaveId,
    searchParams,
  });
  const { getNavHref, recordNavClick } = useViewContext();

  const { name } = item;
  const { icon } = item;
  const { address, seizeConnect } = useSeizeConnectContext();

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
    if (haveUnreadNotifications) {
      const unreadNotificationsCount = notifications?.unread_count ?? 0;
      setTitle(`(${unreadNotificationsCount}) Notifications | 6529.io`);
    }
    if (!haveUnreadNotifications) {
      void removeAllDeliveredNotifications();
      setTitle("Notifications | 6529.io");
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
        className="tw-pointer-events-none tw-relative tw-flex tw-h-full tw-w-full tw-min-w-0 tw-flex-col tw-items-center tw-justify-start tw-border-0 tw-bg-transparent tw-opacity-40 tw-transition-colors focus:tw-outline-none"
      >
        <div className={iconSlotClass}>
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
        isCurrentWaveDm
      );

  const resolvedItem =
    isProfileItem && profileHref !== null
      ? {
          ...item,
          href: profileHref,
        }
      : item;
  const href = getNavHref(resolvedItem);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (item.kind === "route" && item.name === "Profile" && !address) {
      event.preventDefault();
      seizeConnect();
      return;
    }

    recordNavClick(resolvedItem);
  };

  const linkContent = (
    <NavItemLinkContent
      hasUnreadMessages={hasUnreadMessages}
      haveUnreadNotifications={haveUnreadNotifications}
      icon={icon}
      iconSizeClass={iconSizeClass}
      isActive={isActive}
      item={item}
    />
  );

  const linkClassName =
    "tw-relative tw-flex tw-h-full tw-w-full tw-min-w-0 tw-flex-col tw-items-center tw-justify-start tw-border-0 tw-bg-transparent tw-transition-colors focus:tw-outline-none";

  if (fullPrefetch) {
    return (
      <Link
        href={href}
        aria-label={name}
        aria-current={isActive ? "page" : undefined}
        onClick={handleClick}
        prefetch={true}
        className={linkClassName}
      >
        {linkContent}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-label={name}
      aria-current={isActive ? "page" : undefined}
      onClick={handleClick}
      className={linkClassName}
    >
      {linkContent}
    </Link>
  );
};

const NavItem = (props: Props) => <NavItemContent {...props} />;

export default NavItem;
