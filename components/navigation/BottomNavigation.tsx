"use client";

import { usePathname, useSearchParams } from "next/navigation";
import React, {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getActiveWaveIdFromUrl,
  getNotificationsRoute,
  usesReverseMobileBottomNavigationScroll,
} from "@/helpers/navigation.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useWave } from "@/hooks/useWave";
import { useWaveData } from "@/hooks/useWaveData";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { useAuth } from "../auth/Auth";
import { useSeizeConnectContext } from "../auth/SeizeConnectContext";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import BellIcon from "../common/icons/BellIcon";
import ChatBubbleIcon from "../common/icons/ChatBubbleIcon";
import DiscoverIcon from "../common/icons/DiscoverIcon";
import LogoIcon from "../common/icons/LogoIcon";
import CollectionsMenuIcon from "../common/icons/CollectionsMenuIcon";
import UsersIcon from "../common/icons/UsersIcon";
import WavesIcon from "../common/icons/WavesIcon";
import NavItem from "./NavItem";
import { getProfileHref, getResolvedNavItemState } from "./navItemState";
import type { NavItem as NavItemData } from "./navTypes";
import { getActiveViewFromUrl } from "./ViewContext";

const items: NavItemData[] = [
  {
    kind: "route",
    name: "Discovery",
    href: "/discover",
    icon: "discover",
    iconComponent: DiscoverIcon,
  },
  {
    kind: "view",
    name: "Waves",
    viewKey: "waves",
    icon: "waves",
    iconComponent: WavesIcon,
    iconSizeClass: "tw-size-6",
  },
  {
    kind: "view",
    name: "Messages",
    viewKey: "messages",
    icon: "messages",
    iconComponent: ChatBubbleIcon,
  },
  {
    kind: "route",
    name: "Home",
    href: "/",
    icon: "home",
    iconComponent: LogoIcon,
    iconSizeClass: "tw-size-9",
  },
  {
    kind: "route",
    name: "Network",
    href: "/network",
    icon: "network",
    iconComponent: UsersIcon,
  },
  {
    kind: "route",
    name: "Collections",
    href: "/the-memes",
    icon: "collections",
    iconComponent: CollectionsMenuIcon,
  },
  {
    kind: "route",
    name: "Notifications",
    href: "/notifications",
    icon: "notifications",
    iconComponent: BellIcon,
  },
];

interface BottomNavigationProps {
  readonly hidden?: boolean | undefined;
}

const COMPACT_SCROLL_DELTA_PX = 10;
const EXPANDED_TOP_THRESHOLD_PX = 12;
const BOTTOM_NAVIGATION_LOCALE = DEFAULT_LOCALE;

const getHiddenStyle = (hidden: boolean) =>
  hidden
    ? "tw-opacity-0 tw-translate-y-[calc(100%+1.5rem)]"
    : "tw-opacity-100 tw-translate-y-0";

const getWindowScrollPosition = () => {
  const browserWindow = globalThis.window;
  const documentElement = globalThis.document?.documentElement;
  const body = globalThis.document?.body;

  return Math.max(
    browserWindow?.scrollY ?? 0,
    documentElement?.scrollTop ?? 0,
    body?.scrollTop ?? 0
  );
};

const getScrollPosition = (target: EventTarget | null | undefined) => {
  if (
    typeof Element !== "undefined" &&
    target instanceof Element &&
    target.scrollHeight > target.clientHeight
  ) {
    return target.scrollTop;
  }

  return getWindowScrollPosition();
};

const useCompactDock = ({
  hidden,
  resetKey,
  reverseScrollDirection,
}: {
  readonly hidden: boolean;
  readonly resetKey: string;
  readonly reverseScrollDirection: boolean;
}) => {
  const [compact, setCompact] = useState(false);
  const previousScrollPositionsRef = useRef<WeakMap<EventTarget, number>>(
    new WeakMap()
  );
  const frameRef = useRef<number | null>(null);
  const pendingScrollTargetRef = useRef<EventTarget | null>(null);

  useEffect(() => {
    setCompact(false);
    previousScrollPositionsRef.current = new WeakMap();
    pendingScrollTargetRef.current = null;
    if (frameRef.current !== null) {
      globalThis.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, [resetKey]);

  useEffect(() => {
    if (hidden) {
      setCompact(false);
      return;
    }

    const browserWindow = globalThis.window;
    const browserDocument = globalThis.document;
    if (browserWindow === undefined) {
      return;
    }

    previousScrollPositionsRef.current = new WeakMap();

    const syncCompactState = (target: EventTarget) => {
      const currentScrollPosition = getScrollPosition(target);
      const previousScrollPosition =
        previousScrollPositionsRef.current.get(target) ?? currentScrollPosition;
      const delta = currentScrollPosition - previousScrollPosition;
      const directionAdjustedDelta = reverseScrollDirection ? -delta : delta;
      const isAtRestPosition =
        Math.abs(currentScrollPosition) <= EXPANDED_TOP_THRESHOLD_PX;
      let nextCompact: boolean | null = null;

      if (isAtRestPosition) {
        nextCompact = false;
      } else if (directionAdjustedDelta > COMPACT_SCROLL_DELTA_PX) {
        nextCompact = true;
      } else if (directionAdjustedDelta < -COMPACT_SCROLL_DELTA_PX) {
        nextCompact = false;
      }

      if (nextCompact !== null) {
        setCompact(nextCompact);
      }

      previousScrollPositionsRef.current.set(target, currentScrollPosition);
      frameRef.current = null;
    };

    const handleScroll = (event?: Event) => {
      pendingScrollTargetRef.current = event?.target ?? browserWindow;

      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = globalThis.requestAnimationFrame(() => {
        syncCompactState(pendingScrollTargetRef.current ?? browserWindow);
      });
    };

    browserWindow.addEventListener("scroll", handleScroll, { passive: true });
    browserDocument?.addEventListener("scroll", handleScroll, {
      capture: true,
      passive: true,
    });
    syncCompactState(browserWindow);

    return () => {
      browserWindow.removeEventListener("scroll", handleScroll);
      browserDocument?.removeEventListener("scroll", handleScroll, {
        capture: true,
      });
      if (frameRef.current !== null) {
        globalThis.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [hidden, reverseScrollDirection]);

  return hidden ? false : compact;
};

const getNavClassName = ({ hidden }: { readonly hidden: boolean }) =>
  `${getHiddenStyle(hidden)} tw-pointer-events-none tw-fixed tw-inset-x-0 tw-bottom-0 tw-z-50 tw-flex tw-justify-center tw-px-4 tw-pb-[max(calc(env(safe-area-inset-bottom,0px)-0.875rem),0px)] tw-transition-[opacity,transform] tw-duration-200 tw-ease-out motion-reduce:tw-transition-none`;

const getDockClassName = (compact: boolean) =>
  `tw-pointer-events-auto tw-relative tw-overflow-hidden tw-border tw-border-white/[0.13] tw-bg-black/[0.76] tw-shadow-[0_18px_45px_rgba(0,0,0,0.48),0_0_0_1px_rgba(255,255,255,0.045),0_0_34px_rgba(255,255,255,0.075),inset_0_1px_0_rgba(255,255,255,0.105),inset_0_-1px_0_rgba(255,255,255,0.06)] tw-backdrop-blur-2xl tw-transition-[width,height,border-radius,background-color,box-shadow] tw-duration-300 tw-ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:tw-transition-none ${
    compact
      ? "tw-h-[54px] tw-w-[min(calc(100vw-5.5rem),25rem)] tw-rounded-[1.65rem] sm:tw-h-[58px] sm:tw-w-[min(calc(100vw-6.75rem),31rem)] md:tw-w-[min(calc(100vw-10rem),35rem)]"
      : "tw-h-[64px] tw-w-[min(calc(100vw-2.25rem),38rem)] tw-rounded-[2rem] sm:tw-h-[66px] sm:tw-w-[min(calc(100vw-4rem),40rem)]"
  }`;

const floatingNavInnerClassName = "tw-relative tw-h-full";

const getFloatingNavListClassName = (compact: boolean) =>
  `tw-flex tw-h-full tw-items-center ${
    compact ? "tw-gap-0 tw-px-2.5" : "tw-gap-0.5 tw-px-4"
  }`;

const getFloatingActivePillClassName = ({
  compact,
  visible,
}: {
  readonly compact: boolean;
  readonly visible: boolean;
}) => {
  const sizeClassName = compact
    ? "tw-h-11 tw-w-[3.5rem] sm:tw-h-12 sm:tw-w-16"
    : "tw-h-12 tw-w-[3.65rem] sm:tw-h-[3.15rem] sm:tw-w-[4.05rem]";
  const visibilityClassName = visible ? "tw-opacity-100" : "tw-opacity-0";

  return `tw-pointer-events-none tw-absolute tw-left-1/2 tw-top-1/2 tw-z-0 -tw-translate-x-1/2 -tw-translate-y-1/2 tw-rounded-full tw-bg-white/[0.9] tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_8px_24px_rgba(255,255,255,0.1)] tw-transition-[left,width,height,opacity] tw-duration-300 tw-ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:tw-transition-none ${sizeClassName} ${visibilityClassName}`;
};

const getFloatingActivePillStyle = ({
  activeItemIndex,
  compact,
  itemCount,
  measuredLeft,
}: {
  readonly activeItemIndex: number;
  readonly compact: boolean;
  readonly itemCount: number;
  readonly measuredLeft: number | null;
}): React.CSSProperties => ({
  left:
    measuredLeft === null
      ? getFloatingActivePillFallbackLeft({
          activeItemIndex,
          compact,
          itemCount,
        })
      : `${measuredLeft}px`,
});

const getFloatingActivePillFallbackLeft = ({
  activeItemIndex,
  compact,
  itemCount,
}: {
  readonly activeItemIndex: number;
  readonly compact: boolean;
  readonly itemCount: number;
}) => {
  const paddingX = compact ? "0.625rem" : "1rem";
  const gap = compact ? "0rem" : "0.125rem";
  const gapCount = Math.max(0, itemCount - 1);

  return `calc(${paddingX} + ((100% - (${paddingX} * 2) - (${gap} * ${gapCount})) / ${itemCount} * ${
    activeItemIndex + 0.5
  }) + (${gap} * ${activeItemIndex}))`;
};

const BottomNavigationFallback: React.FC<BottomNavigationProps> = ({
  hidden = false,
}) => (
  <nav aria-hidden="true" className={getNavClassName({ hidden })}>
    <div className={getDockClassName(false)}>
      <div className={floatingNavInnerClassName}>
        <ul className={getFloatingNavListClassName(false)} />
      </div>
    </div>
  </nav>
);

interface BottomNavigationResolvedContentProps extends BottomNavigationProps {
  readonly pathname: string;
  readonly routeStateKey: string;
}

const BottomNavigationResolvedContent: React.FC<
  BottomNavigationResolvedContentProps
> = ({ hidden = false, pathname, routeStateKey }) => {
  const { registerRef } = useLayout();
  const { isApp } = useDeviceInfo();
  const { connectedProfile } = useAuth();
  const { address } = useSeizeConnectContext();
  // react-doctor-disable-next-line react-doctor/nextjs-no-use-search-params-without-suspense
  const searchParams = useSearchParams();

  const mobileNavRef = useRef<HTMLDivElement | null>(null);
  const floatingNavInnerRef = useRef<HTMLDivElement | null>(null);
  const navItemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [activePillLeft, setActivePillLeft] = useState<number | null>(null);
  const waveIdFromQuery = getActiveWaveIdFromUrl({ pathname, searchParams });
  const activeView = getActiveViewFromUrl({
    activeWaveId: waveIdFromQuery,
    searchParams,
  });
  const reverseScrollDirection = usesReverseMobileBottomNavigationScroll({
    pathname,
  });
  const compact = useCompactDock({
    hidden,
    resetKey: routeStateKey,
    reverseScrollDirection,
  });
  const { data: waveData } = useWaveData({
    waveId: waveIdFromQuery,
    onWaveNotFound: () => {},
  });
  const { isDm: isCurrentWaveDm } = useWave(waveData);

  const setMobileNavRef = useCallback((node: HTMLDivElement | null) => {
    mobileNavRef.current = node;
  }, []);
  const setNavItemRef = useCallback(
    (index: number, node: HTMLLIElement | null) => {
      navItemRefs.current[index] = node;
    },
    []
  );

  useEffect(() => {
    registerRef("mobileNav", hidden ? null : mobileNavRef.current);

    return () => {
      registerRef("mobileNav", null);
    };
  }, [hidden, registerRef]);

  const navItems = useMemo(
    () =>
      items.map((item) =>
        item.name === "Notifications"
          ? {
              ...item,
              href: getNotificationsRoute(isApp),
            }
          : item
      ),
    [isApp]
  );
  const profileHref = getProfileHref({
    address,
    handle: connectedProfile?.handle,
    normalisedHandle: connectedProfile?.normalised_handle,
  });
  const activeItemIndex = navItems.findIndex(
    (item) =>
      getResolvedNavItemState({
        activeView,
        isCurrentWaveDm,
        item,
        pathname,
        profileHref,
        searchParams,
      }).isActive
  );
  const hasActiveItem = activeItemIndex >= 0;
  const updateActivePillLayout = useCallback(() => {
    if (!hasActiveItem) {
      setActivePillLeft(null);
      return;
    }

    const innerElement = floatingNavInnerRef.current;
    const activeItemElement = navItemRefs.current[activeItemIndex] ?? null;
    if (innerElement === null || activeItemElement === null) {
      setActivePillLeft(null);
      return;
    }

    const innerRect = innerElement.getBoundingClientRect();
    const activeItemRect = activeItemElement.getBoundingClientRect();
    if (innerRect.width <= 0 || activeItemRect.width <= 0) {
      setActivePillLeft(null);
      return;
    }

    const nextLeft =
      activeItemRect.left - innerRect.left + activeItemRect.width / 2;
    setActivePillLeft((currentLeft) =>
      currentLeft !== null && Math.abs(currentLeft - nextLeft) < 0.5
        ? currentLeft
        : nextLeft
    );
  }, [activeItemIndex, hasActiveItem]);

  useLayoutEffect(() => {
    navItemRefs.current.length = navItems.length;
    updateActivePillLayout();
  }, [compact, navItems.length, updateActivePillLayout]);

  useEffect(() => {
    if (!hasActiveItem) {
      return;
    }

    const handleResize = () => updateActivePillLayout();
    globalThis.addEventListener("resize", handleResize);

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(handleResize);
    const innerElement = floatingNavInnerRef.current;
    if (innerElement !== null) {
      resizeObserver?.observe(innerElement);
    }
    navItemRefs.current.forEach((itemElement) => {
      if (itemElement !== null) {
        resizeObserver?.observe(itemElement);
      }
    });

    return () => {
      globalThis.removeEventListener("resize", handleResize);
      resizeObserver?.disconnect();
    };
  }, [compact, hasActiveItem, navItems.length, updateActivePillLayout]);

  return (
    <nav
      ref={setMobileNavRef}
      aria-label={t(BOTTOM_NAVIGATION_LOCALE, "navigation.primary.ariaLabel")}
      aria-hidden={hidden ? "true" : undefined}
      className={getNavClassName({ hidden })}
      inert={hidden}
    >
      <div className={getDockClassName(compact)}>
        <div
          ref={floatingNavInnerRef}
          data-testid="mobile-dock-inner"
          className={floatingNavInnerClassName}
        >
          <div
            aria-hidden="true"
            data-testid="mobile-dock-active-pill"
            className={getFloatingActivePillClassName({
              compact,
              visible: hasActiveItem,
            })}
            style={getFloatingActivePillStyle({
              activeItemIndex: hasActiveItem ? activeItemIndex : 0,
              compact,
              itemCount: navItems.length,
              measuredLeft: activePillLeft,
            })}
          />
          <ul className={getFloatingNavListClassName(compact)}>
            {navItems.map((item, index) => (
              <li
                key={item.name}
                ref={(node) => setNavItemRef(index, node)}
                data-mobile-dock-item-index={index}
                className="tw-flex tw-h-full tw-min-w-0 tw-flex-1 tw-items-center tw-justify-center"
              >
                <NavItem
                  variant="floating"
                  compact={compact}
                  item={item}
                  isCurrentWaveDm={isCurrentWaveDm}
                  fullPrefetch={isApp && item.kind === "view"}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};

const BottomNavigationContent: React.FC<BottomNavigationProps> = ({
  hidden = false,
}) => {
  const pathname = usePathname();
  // react-doctor-disable-next-line react-doctor/nextjs-no-use-search-params-without-suspense
  const searchParams = useSearchParams();
  const activeView = searchParams.get("view");
  const routeStateKey = `${pathname}:${activeView ?? ""}`;

  return (
    <BottomNavigationResolvedContent
      hidden={hidden}
      pathname={pathname}
      routeStateKey={routeStateKey}
    />
  );
};

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  hidden = false,
}) => (
  <Suspense fallback={<BottomNavigationFallback hidden={hidden} />}>
    <BottomNavigationContent hidden={hidden} />
  </Suspense>
);

export default BottomNavigation;
