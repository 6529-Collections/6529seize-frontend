"use client";

import { LayoutGroup } from "framer-motion";
import { usePathname, useSearchParams } from "next/navigation";
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getActiveWaveIdFromUrl,
  getNotificationsRoute,
} from "@/helpers/navigation.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useWave } from "@/hooks/useWave";
import { useWaveData } from "@/hooks/useWaveData";
import { BOTTOM_NAVIGATION_MESSAGES } from "@/i18n/messages";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import BellIcon from "../common/icons/BellIcon";
import ChatBubbleIcon from "../common/icons/ChatBubbleIcon";
import DiscoverIcon from "../common/icons/DiscoverIcon";
import LogoIcon from "../common/icons/LogoIcon";
import CollectionsMenuIcon from "../common/icons/CollectionsMenuIcon";
import UsersIcon from "../common/icons/UsersIcon";
import WavesIcon from "../common/icons/WavesIcon";
import NavItem from "./NavItem";
import type { NavItem as NavItemData } from "./navTypes";

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
const NOTIFICATIONS_DOCK_SCROLL_SOURCE_SELECTOR =
  "[data-mobile-dock-scroll-source='notifications']";
const DOCK_SCROLL_SOURCE_CHANGE_EVENT = "mobile-dock-scroll-source-change";

type DockScrollTarget = Window | HTMLElement;

const getHiddenStyle = (hidden: boolean) =>
  hidden
    ? "tw-opacity-0 tw-translate-y-[calc(100%+1.5rem)]"
    : "tw-opacity-100 tw-translate-y-0";

const getWindowScrollY = () => {
  const browserWindow = globalThis.window;
  const documentElement = globalThis.document?.documentElement;
  const body = globalThis.document?.body;

  return Math.max(
    browserWindow?.scrollY ?? 0,
    documentElement?.scrollTop ?? 0,
    body?.scrollTop ?? 0
  );
};

const getDockScrollTop = (scrollTarget: DockScrollTarget) => {
  if (scrollTarget instanceof Window) {
    return getWindowScrollY();
  }

  return scrollTarget.scrollTop;
};

const getDockScrollTarget = (
  useNotificationsScrollTarget: boolean
): DockScrollTarget | null => {
  const browserWindow = globalThis.window;

  if (browserWindow === undefined) {
    return null;
  }

  if (!useNotificationsScrollTarget) {
    return browserWindow;
  }

  return (
    globalThis.document?.querySelector<HTMLElement>(
      NOTIFICATIONS_DOCK_SCROLL_SOURCE_SELECTOR
    ) ?? null
  );
};

const useCompactDock = (
  hidden: boolean,
  reverseScrollDirection: boolean = false,
  useNotificationsScrollTarget: boolean = false
) => {
  const [compact, setCompact] = useState(false);
  const [scrollTargetVersion, setScrollTargetVersion] = useState(0);
  const previousScrollYRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!useNotificationsScrollTarget) {
      return;
    }

    const browserWindow = globalThis.window;
    if (browserWindow === undefined) {
      return;
    }

    const handleScrollSourceChange = () => {
      setScrollTargetVersion((version) => version + 1);
    };

    browserWindow.addEventListener(
      DOCK_SCROLL_SOURCE_CHANGE_EVENT,
      handleScrollSourceChange
    );

    return () =>
      browserWindow.removeEventListener(
        DOCK_SCROLL_SOURCE_CHANGE_EVENT,
        handleScrollSourceChange
      );
  }, [useNotificationsScrollTarget]);

  useEffect(() => {
    if (hidden) {
      return;
    }

    const browserWindow = globalThis.window;
    if (browserWindow === undefined) {
      return;
    }

    const scrollTarget = getDockScrollTarget(useNotificationsScrollTarget);
    if (scrollTarget === null) {
      return;
    }

    previousScrollYRef.current = getDockScrollTop(scrollTarget);

    const syncCompactState = () => {
      const currentScrollY = getDockScrollTop(scrollTarget);
      const delta = currentScrollY - previousScrollYRef.current;
      const effectiveDelta = reverseScrollDirection ? -delta : delta;
      const isAtRestPosition = reverseScrollDirection
        ? Math.abs(currentScrollY) <= EXPANDED_TOP_THRESHOLD_PX
        : currentScrollY <= EXPANDED_TOP_THRESHOLD_PX;
      let nextCompact: boolean | null = null;

      if (isAtRestPosition) {
        nextCompact = false;
      } else if (effectiveDelta > COMPACT_SCROLL_DELTA_PX) {
        nextCompact = true;
      } else if (effectiveDelta < -COMPACT_SCROLL_DELTA_PX) {
        nextCompact = false;
      }

      if (nextCompact !== null) {
        setCompact(nextCompact);
      }

      previousScrollYRef.current = currentScrollY;
      frameRef.current = null;
    };

    const handleScroll = () => {
      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = globalThis.requestAnimationFrame(syncCompactState);
    };

    scrollTarget.addEventListener("scroll", handleScroll, { passive: true });
    syncCompactState();

    return () => {
      scrollTarget.removeEventListener("scroll", handleScroll);
      if (frameRef.current !== null) {
        globalThis.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [
    hidden,
    reverseScrollDirection,
    scrollTargetVersion,
    useNotificationsScrollTarget,
  ]);

  return hidden ? false : compact;
};

const getNavClassName = (hidden: boolean) =>
  `${getHiddenStyle(hidden)} tw-pointer-events-none tw-fixed tw-inset-x-0 tw-bottom-0 tw-z-50 tw-flex tw-justify-center tw-px-3 tw-pb-[calc(env(safe-area-inset-bottom,0px)+0.25rem)] tw-transition-[opacity,transform] tw-duration-200 tw-ease-out motion-reduce:tw-transition-none`;

const getDockClassName = (compact: boolean) =>
  `tw-pointer-events-auto tw-relative tw-overflow-hidden tw-border tw-border-white/[0.13] tw-bg-black/76 tw-shadow-[0_18px_45px_rgba(0,0,0,0.48),0_0_0_1px_rgba(255,255,255,0.045),0_0_34px_rgba(255,255,255,0.075),inset_0_1px_0_rgba(255,255,255,0.105),inset_0_-1px_0_rgba(255,255,255,0.06)] tw-backdrop-blur-2xl tw-transition-[width,height,border-radius,background-color,box-shadow] tw-duration-300 tw-ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:tw-transition-none ${
    compact
      ? "tw-h-[48px] tw-w-[min(calc(100vw-6.5rem),23rem)] tw-rounded-[1.5rem] sm:tw-h-[52px] sm:tw-w-[min(calc(100vw-8rem),30rem)] md:tw-w-[min(calc(100vw-12rem),34rem)]"
      : "tw-h-[62px] tw-w-[min(calc(100vw-3rem),38rem)] tw-rounded-[1.75rem] sm:tw-w-[min(calc(100vw-6rem),42rem)]"
  }`;

const navInnerClassName = "tw-relative tw-h-full";

const getNavListClassName = (compact: boolean) =>
  `tw-flex tw-h-full tw-items-center ${
    compact ? "tw-gap-0 tw-px-1" : "tw-gap-0.5 tw-px-1.5"
  }`;

const BottomNavigationFallback: React.FC<BottomNavigationProps> = ({
  hidden = false,
}) => (
  <nav aria-hidden="true" className={getNavClassName(hidden)}>
    <div className={getDockClassName(false)}>
      <div className={navInnerClassName}>
        <ul className={getNavListClassName(false)} />
      </div>
    </div>
  </nav>
);

const BottomNavigationContent: React.FC<BottomNavigationProps> = ({
  hidden = false,
}) => {
  const { registerRef } = useLayout();
  const { isApp } = useDeviceInfo();
  const pathname = usePathname();
  // react-doctor-disable-next-line react-doctor/nextjs-no-use-search-params-without-suspense
  const searchParams = useSearchParams();

  const mobileNavRef = useRef<HTMLDivElement | null>(null);
  const shouldReverseDockScroll =
    pathname === "/notifications" || pathname.startsWith("/notifications/");
  const compact = useCompactDock(
    hidden,
    shouldReverseDockScroll,
    shouldReverseDockScroll
  );
  const waveIdFromQuery = getActiveWaveIdFromUrl({ pathname, searchParams });
  const { data: waveData } = useWaveData({
    waveId: waveIdFromQuery,
    onWaveNotFound: () => {},
  });
  const { isDm: isCurrentWaveDm } = useWave(waveData);

  const setMobileNavRef = useCallback(
    (node: HTMLDivElement | null) => {
      mobileNavRef.current = node;
      registerRef("mobileNav", node);
    },
    [registerRef]
  );

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

  return (
    <nav
      ref={setMobileNavRef}
      aria-hidden={hidden ? "true" : undefined}
      aria-label={BOTTOM_NAVIGATION_MESSAGES.primaryNavigationLabel}
      className={getNavClassName(hidden)}
      inert={hidden}
    >
      <div className={getDockClassName(compact)}>
        <div className={navInnerClassName}>
          <ul className={getNavListClassName(compact)}>
            <LayoutGroup id="bottom-navigation">
              {navItems.map((item) => (
                <li
                  key={item.name}
                  className="tw-flex tw-h-full tw-min-w-0 tw-flex-1 tw-items-center tw-justify-center"
                >
                  <NavItem
                    compact={compact}
                    item={item}
                    isCurrentWaveDm={isCurrentWaveDm}
                    fullPrefetch={isApp && item.kind === "view"}
                  />
                </li>
              ))}
            </LayoutGroup>
          </ul>
        </div>
      </div>
    </nav>
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
