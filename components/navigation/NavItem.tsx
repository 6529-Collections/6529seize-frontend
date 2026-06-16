"use client";

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
import type { NavIconColor, NavItem as NavItemData } from "./navTypes";

interface Props {
  readonly item: NavItemData;
  readonly compact?: boolean | undefined;
  readonly isCurrentWaveDm?: boolean;
  readonly fullPrefetch?: boolean;
}

const getIconSlotClass = (compact: boolean) =>
  `tw-relative tw-z-10 tw-flex tw-items-center tw-justify-center tw-transition-transform tw-duration-300 tw-ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:tw-transition-none ${
    compact
      ? "tw-h-8 tw-scale-[0.74] sm:tw-scale-[0.82]"
      : "tw-h-8 tw-scale-[0.92]"
  }`;

const ActiveNavIndicator = ({ compact }: { readonly compact: boolean }) => (
  <div
    className={`tw-absolute tw-left-1/2 tw-top-1/2 tw-z-0 -tw-translate-x-1/2 -tw-translate-y-1/2 tw-rounded-full tw-bg-white/[0.88] tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_8px_24px_rgba(255,255,255,0.1)] tw-transition-[width,height] tw-duration-300 tw-ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:tw-transition-none ${
      compact
        ? "tw-h-10 tw-w-14 sm:tw-h-11 sm:tw-w-16"
        : "tw-h-11 tw-w-14 sm:tw-w-16"
    }`}
  />
);

const getNavIndicatorSizeClass = (compact: boolean) =>
  compact
    ? "tw-h-10 tw-w-14 sm:tw-h-11 sm:tw-w-16"
    : "tw-h-11 tw-w-14 sm:tw-w-16";

const getInactiveIconTextColorClass = (isHighlighted: boolean) =>
  isHighlighted ? "tw-text-white" : "tw-text-iron-300";

const NavItemLinkContent = ({
  hasUnreadMessages,
  haveUnreadNotifications,
  icon,
  iconSizeClass,
  isActive,
  item,
  compact,
}: {
  readonly hasUnreadMessages: boolean;
  readonly haveUnreadNotifications: boolean;
  readonly icon: string;
  readonly iconSizeClass: string;
  readonly isActive: boolean;
  readonly item: NavItemData;
  readonly compact: boolean;
}) => {
  const { pending } = useLinkStatus();
  const isHighlighted = isActive || pending;
  const IconComponent = item.iconComponent;
  const activeIconColor: NavIconColor = isActive ? "black" : "white";
  const iconTextColorClass = isActive
    ? "tw-text-black"
    : getInactiveIconTextColorClass(isHighlighted);
  const resolvedIconSizeClass =
    item.name === "Home"
      ? compact
        ? "tw-size-7 sm:tw-size-8"
        : "tw-size-8"
      : iconSizeClass;

  return (
    <div className={getIconSlotClass(compact)}>
      {isActive && <ActiveNavIndicator compact={compact} />}
      {pending && !isActive && (
        <div
          aria-hidden="true"
          data-testid="nav-item-pending-indicator"
          className={`tw-absolute tw-left-1/2 tw-top-1/2 tw-z-0 -tw-translate-x-1/2 -tw-translate-y-1/2 tw-rounded-full tw-bg-white/[0.08] tw-ring-1 tw-ring-white/10 tw-transition-[width,height] tw-duration-300 tw-ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:tw-transition-none ${getNavIndicatorSizeClass(compact)}`}
        />
      )}
      {IconComponent ? (
        <IconComponent
          className={`tw-relative tw-z-10 ${resolvedIconSizeClass} ${iconTextColorClass}`}
          color={activeIconColor}
        />
      ) : (
        <Image
          src={icon}
          alt={item.name}
          width={24}
          height={24}
          unoptimized
          className={`tw-relative tw-z-10 ${resolvedIconSizeClass}`}
        />
      )}
      {item.name === "Notifications" && haveUnreadNotifications && (
        <div className="tw-absolute -tw-right-1 -tw-top-1 tw-h-2.5 tw-w-2.5 tw-rounded-full tw-bg-red"></div>
      )}
      {item.name === "Messages" && hasUnreadMessages && (
        <div className="tw-absolute -tw-right-1 -tw-top-1 tw-h-2.5 tw-w-2.5 tw-rounded-full tw-bg-red"></div>
      )}
    </div>
  );
};

const NavItemContent = ({
  item,
  compact = false,
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
        <div className={getIconSlotClass(compact)}>
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
      compact={compact}
      hasUnreadMessages={hasUnreadMessages}
      haveUnreadNotifications={haveUnreadNotifications}
      icon={icon}
      iconSizeClass={iconSizeClass}
      isActive={isActive}
      item={item}
    />
  );

  const linkClassName =
    "tw-relative tw-flex tw-h-full tw-w-full tw-min-w-0 tw-flex-col tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-transition-colors focus:tw-outline-none focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-3px] focus-visible:tw-outline-white/35";

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
