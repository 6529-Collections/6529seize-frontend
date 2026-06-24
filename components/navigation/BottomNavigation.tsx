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
  usesReverseMobileBottomNavigationScroll,
} from "@/helpers/navigation.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useWave } from "@/hooks/useWave";
import { useWaveData } from "@/hooks/useWaveData";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
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
  reverseScrollDirection,
}: {
  readonly hidden: boolean;
  readonly reverseScrollDirection: boolean;
}) => {
  const [compact, setCompact] = useState(false);
  const previousScrollPositionsRef = useRef<WeakMap<EventTarget, number>>(
    new WeakMap()
  );
  const frameRef = useRef<number | null>(null);
  const pendingScrollTargetRef = useRef<EventTarget | null>(null);

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
      }
    };
  }, [hidden, reverseScrollDirection]);

  return hidden ? false : compact;
};

const getNavClassName = ({ hidden }: { readonly hidden: boolean }) =>
  `${getHiddenStyle(hidden)} tw-pointer-events-none tw-fixed tw-inset-x-0 tw-bottom-0 tw-z-50 tw-flex tw-justify-center tw-px-4 tw-pb-[env(safe-area-inset-bottom,0px)] tw-transition-[opacity,transform] tw-duration-200 tw-ease-out motion-reduce:tw-transition-none`;

const getDockClassName = (compact: boolean) =>
  `tw-pointer-events-auto tw-relative tw-overflow-hidden tw-border tw-border-white/[0.13] tw-bg-black/[0.76] tw-shadow-[0_18px_45px_rgba(0,0,0,0.48),0_0_0_1px_rgba(255,255,255,0.045),0_0_34px_rgba(255,255,255,0.075),inset_0_1px_0_rgba(255,255,255,0.105),inset_0_-1px_0_rgba(255,255,255,0.06)] tw-backdrop-blur-2xl tw-transition-[width,height,border-radius,background-color,box-shadow] tw-duration-300 tw-ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:tw-transition-none ${
    compact
      ? "tw-h-[50px] tw-w-[min(calc(100vw-5.5rem),25rem)] tw-rounded-[1.5rem] sm:tw-h-[54px] sm:tw-w-[min(calc(100vw-6.75rem),31rem)] md:tw-w-[min(calc(100vw-10rem),35rem)]"
      : "tw-h-[58px] tw-w-[min(calc(100vw-2.25rem),38rem)] tw-rounded-[1.75rem] sm:tw-h-[60px] sm:tw-w-[min(calc(100vw-4rem),40rem)]"
  }`;

const floatingNavInnerClassName = "tw-relative tw-h-full";

const getFloatingNavListClassName = (compact: boolean) =>
  `tw-flex tw-h-full tw-items-center ${
    compact ? "tw-gap-0 tw-px-1.5" : "tw-gap-0.5 tw-px-2"
  }`;

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
}

const BottomNavigationResolvedContent: React.FC<
  BottomNavigationResolvedContentProps
> = ({ hidden = false, pathname }) => {
  const { registerRef } = useLayout();
  const { isApp } = useDeviceInfo();
  // react-doctor-disable-next-line react-doctor/nextjs-no-use-search-params-without-suspense
  const searchParams = useSearchParams();

  const mobileNavRef = useRef<HTMLDivElement | null>(null);
  const waveIdFromQuery = getActiveWaveIdFromUrl({ pathname, searchParams });
  const reverseScrollDirection = usesReverseMobileBottomNavigationScroll({
    pathname,
  });
  const compact = useCompactDock({ hidden, reverseScrollDirection });
  const { data: waveData } = useWaveData({
    waveId: waveIdFromQuery,
    onWaveNotFound: () => {},
  });
  const { isDm: isCurrentWaveDm } = useWave(waveData);

  const setMobileNavRef = useCallback((node: HTMLDivElement | null) => {
    mobileNavRef.current = node;
  }, []);

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

  return (
    <nav
      ref={setMobileNavRef}
      aria-label={t(BOTTOM_NAVIGATION_LOCALE, "navigation.primary.ariaLabel")}
      aria-hidden={hidden ? "true" : undefined}
      className={getNavClassName({ hidden })}
      inert={hidden}
    >
      <div className={getDockClassName(compact)}>
        <div className={floatingNavInnerClassName}>
          <ul className={getFloatingNavListClassName(compact)}>
            <LayoutGroup id="bottom-navigation">
              {navItems.map((item) => (
                <li
                  key={item.name}
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
            </LayoutGroup>
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
      key={routeStateKey}
      hidden={hidden}
      pathname={pathname}
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
