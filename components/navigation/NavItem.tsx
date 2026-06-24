"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { MouseEvent } from "react";
import { useEffect } from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { useTitle } from "@/contexts/TitleContext";
import { useUnreadIndicator } from "@/hooks/useUnreadIndicator";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useAuth } from "../auth/Auth";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import { useNotificationsContext } from "../notifications/NotificationsContext";
import { getActiveWaveIdFromUrl } from "@/helpers/navigation.helpers";
import { isNavItemActive } from "./isNavItemActive";
import { getActiveViewFromUrl, useViewContext } from "./ViewContext";
import type { NavIconColor, NavItem as NavItemData, ViewKey } from "./navTypes";

interface Props {
  readonly item: NavItemData;
  readonly variant?: "floating" | "fixed";
  readonly compact?: boolean | undefined;
  readonly isCurrentWaveDm?: boolean;
  readonly fullPrefetch?: boolean;
}

const getIconSlotClass = ({
  compact,
  variant,
}: {
  readonly compact: boolean;
  readonly variant: "floating" | "fixed";
}) => {
  if (variant === "fixed") {
    return "tw-mt-4 tw-flex tw-h-9 tw-items-center tw-justify-center";
  }

  const compactClassName = compact
    ? "tw-h-8 tw-scale-[0.82] sm:tw-h-9 sm:tw-scale-[0.88]"
    : "tw-h-8 tw-scale-[0.9]";

  return `tw-relative tw-z-10 tw-flex tw-items-center tw-justify-center tw-transition-transform tw-duration-300 tw-ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:tw-transition-none ${compactClassName}`;
};

const ActiveNavIndicator = ({
  compact,
  variant,
}: {
  readonly compact: boolean;
  readonly variant: "floating" | "fixed";
}) => (
  <LazyMotion features={domAnimation}>
    <m.div
      layoutId={`bottom-navigation-${variant}-active-indicator`}
      transition={{
        type: "spring",
        stiffness: 420,
        damping: 38,
        mass: 0.7,
      }}
      className={
        variant === "fixed"
          ? "tw-absolute tw-left-0 tw-top-0 tw-h-0.5 tw-w-full tw-rounded-full tw-bg-white"
          : `tw-absolute tw-left-1/2 tw-top-1/2 tw-z-0 -tw-translate-x-1/2 -tw-translate-y-1/2 tw-rounded-full tw-bg-white/[0.9] tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_8px_24px_rgba(255,255,255,0.1)] tw-transition-[width,height] tw-duration-300 tw-ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:tw-transition-none ${
              compact
                ? "tw-h-10 tw-w-[3.75rem] sm:tw-h-11 sm:tw-w-[4.25rem]"
                : "tw-h-11 tw-w-[3.9rem] sm:tw-w-[4.35rem]"
            }`
      }
    />
  </LazyMotion>
);

const getHomeIconSizeClass = ({
  compact,
  variant,
}: {
  readonly compact: boolean;
  readonly variant: "floating" | "fixed";
}) => {
  if (variant === "fixed") {
    return "tw-size-9";
  }

  return compact ? "tw-size-8 sm:tw-size-[2.1rem]" : "tw-size-8";
};

const getInactiveIconTextColorClass = (isHighlighted: boolean) =>
  isHighlighted ? "tw-text-white" : "tw-text-iron-300";

const getIconTextColorClass = ({
  isActive,
  isHighlighted,
  item,
  variant,
}: {
  readonly isActive: boolean;
  readonly isHighlighted: boolean;
  readonly item: NavItemData;
  readonly variant: "floating" | "fixed";
}) => {
  if (item.name === "Home") {
    return "";
  }

  if (variant === "fixed") {
    return isHighlighted ? "tw-text-white" : "tw-text-iron-500";
  }

  return isActive
    ? "tw-text-black"
    : getInactiveIconTextColorClass(isHighlighted);
};

const getDisabledButtonClassName = (variant: "floating" | "fixed") => {
  const layoutClassName =
    variant === "fixed"
      ? "tw-justify-start"
      : "tw-justify-center tw-rounded-full";

  return `tw-pointer-events-none tw-relative tw-flex tw-h-full tw-w-full tw-min-w-0 tw-flex-col tw-items-center tw-border-0 tw-bg-transparent tw-opacity-40 tw-transition-colors focus:tw-outline-none ${layoutClassName}`;
};

const getResolvedProfileState = ({
  activeView,
  isCurrentWaveDm,
  item,
  pathname,
  profileHref,
  searchParams,
}: {
  readonly activeView: ViewKey | null;
  readonly isCurrentWaveDm: boolean;
  readonly item: NavItemData;
  readonly pathname: string;
  readonly profileHref: string | null;
  readonly searchParams: ReturnType<typeof useSearchParams>;
}) => {
  const isProfileItem = item.kind === "route" && item.name === "Profile";
  const normalizedPathname = pathname.toLowerCase();

  if (isProfileItem && profileHref !== null) {
    const isProfileActive =
      activeView === null &&
      (normalizedPathname === profileHref ||
        normalizedPathname.startsWith(`${profileHref}/`));

    return {
      isActive: isProfileActive,
      resolvedItem: {
        ...item,
        href: profileHref,
      },
    };
  }

  return {
    isActive: isNavItemActive(
      item,
      pathname,
      searchParams,
      activeView,
      isCurrentWaveDm
    ),
    resolvedItem: item,
  };
};

const NavItemLinkContent = ({
  hasUnreadMessages,
  haveUnreadNotifications,
  icon,
  iconSizeClass,
  isActive,
  item,
  compact,
  variant,
}: {
  readonly hasUnreadMessages: boolean;
  readonly haveUnreadNotifications: boolean;
  readonly icon: string;
  readonly iconSizeClass: string;
  readonly isActive: boolean;
  readonly item: NavItemData;
  readonly compact: boolean;
  readonly variant: "floating" | "fixed";
}) => {
  const isHighlighted = isActive;
  const IconComponent = item.iconComponent;
  const activeIconColor: NavIconColor =
    isActive && variant === "floating" ? "black" : "white";
  const iconTextColorClass = getIconTextColorClass({
    isActive,
    isHighlighted,
    item,
    variant,
  });
  const resolvedIconSizeClass =
    item.name === "Home"
      ? getHomeIconSizeClass({ compact, variant })
      : iconSizeClass;

  return (
    <div className={getIconSlotClass({ compact, variant })}>
      {isActive && <ActiveNavIndicator compact={compact} variant={variant} />}
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
  variant = "floating",
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
        className={getDisabledButtonClassName(variant)}
      >
        <div className={getIconSlotClass({ compact, variant })}>
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
  const { isActive, resolvedItem } = getResolvedProfileState({
    activeView,
    isCurrentWaveDm,
    item,
    pathname,
    profileHref,
    searchParams,
  });
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
      variant={variant}
    />
  );

  const linkClassName =
    variant === "fixed"
      ? "tw-relative tw-flex tw-h-full tw-w-full tw-min-w-0 tw-flex-col tw-items-center tw-justify-start tw-border-0 tw-bg-transparent tw-transition-colors focus:tw-outline-none focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-3px] focus-visible:tw-outline-primary-400"
      : "tw-relative tw-flex tw-h-full tw-w-full tw-min-w-0 tw-flex-col tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-transition-colors focus:tw-outline-none focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-3px] focus-visible:tw-outline-primary-400";

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
