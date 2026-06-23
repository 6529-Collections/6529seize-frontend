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
  usesFixedMobileBottomNavigation,
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

type BottomNavVariant = "floating" | "fixed";

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

const useCompactDock = (hidden: boolean) => {
  const [compact, setCompact] = useState(false);
  const previousScrollYRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (hidden) {
      return;
    }

    const browserWindow = globalThis.window;
    if (browserWindow === undefined) {
      return;
    }

    previousScrollYRef.current = getWindowScrollY();

    const syncCompactState = () => {
      const currentScrollY = getWindowScrollY();
      const delta = currentScrollY - previousScrollYRef.current;
      const isAtRestPosition = currentScrollY <= EXPANDED_TOP_THRESHOLD_PX;
      let nextCompact: boolean | null = null;

      if (isAtRestPosition) {
        nextCompact = false;
      } else if (delta > COMPACT_SCROLL_DELTA_PX) {
        nextCompact = true;
      } else if (delta < -COMPACT_SCROLL_DELTA_PX) {
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

    browserWindow.addEventListener("scroll", handleScroll, { passive: true });
    syncCompactState();

    return () => {
      browserWindow.removeEventListener("scroll", handleScroll);
      if (frameRef.current !== null) {
        globalThis.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [hidden]);

  return hidden ? false : compact;
};

const getNavClassName = ({
  hidden,
  variant,
}: {
  readonly hidden: boolean;
  readonly variant: BottomNavVariant;
}) =>
  variant === "fixed"
    ? `${getHiddenStyle(hidden)} tw-fixed tw-bottom-0 tw-left-0 tw-z-50 tw-h-[85px] tw-w-full tw-bg-black tw-shadow-inner tw-transition-[opacity,transform] tw-duration-75 motion-reduce:tw-transition-none`
    : `${getHiddenStyle(hidden)} tw-pointer-events-none tw-fixed tw-inset-x-0 tw-bottom-0 tw-z-50 tw-flex tw-justify-center tw-px-4 tw-pb-[env(safe-area-inset-bottom,0px)] tw-transition-[opacity,transform] tw-duration-200 tw-ease-out motion-reduce:tw-transition-none`;

const getDockClassName = (compact: boolean) =>
  `tw-pointer-events-auto tw-relative tw-overflow-hidden tw-border tw-border-white/[0.13] tw-bg-black/[0.76] tw-shadow-[0_18px_45px_rgba(0,0,0,0.48),0_0_0_1px_rgba(255,255,255,0.045),0_0_34px_rgba(255,255,255,0.075),inset_0_1px_0_rgba(255,255,255,0.105),inset_0_-1px_0_rgba(255,255,255,0.06)] tw-backdrop-blur-2xl tw-transition-[width,height,border-radius,background-color,box-shadow] tw-duration-300 tw-ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:tw-transition-none ${
    compact
      ? "tw-h-[50px] tw-w-[min(calc(100vw-5.5rem),25rem)] tw-rounded-[1.5rem] sm:tw-h-[54px] sm:tw-w-[min(calc(100vw-6.75rem),31rem)] md:tw-w-[min(calc(100vw-10rem),35rem)]"
      : "tw-h-[58px] tw-w-[min(calc(100vw-4rem),35rem)] tw-rounded-[1.75rem] sm:tw-h-[60px] sm:tw-w-[min(calc(100vw-5.5rem),38rem)]"
  }`;

const fixedNavInnerClassName =
  "tw-relative tw-h-full before:tw-absolute before:tw-inset-x-0 before:tw-top-0 before:tw-h-px before:tw-bg-iron-900 before:tw-content-['']";
const floatingNavInnerClassName = "tw-relative tw-h-full";

const fixedNavListClassName =
  "tw-mx-auto tw-flex tw-h-full tw-pl-[env(safe-area-inset-left,0px)] tw-pr-[env(safe-area-inset-right,0px)] md:tw-max-w-2xl";

const getFloatingNavListClassName = (compact: boolean) =>
  `tw-flex tw-h-full tw-items-center ${
    compact ? "tw-gap-0 tw-px-1.5" : "tw-gap-0.5 tw-px-2"
  }`;

const BottomNavigationFallback: React.FC<BottomNavigationProps> = ({
  hidden = false,
}) => (
  <nav
    aria-hidden="true"
    className={getNavClassName({ hidden, variant: "floating" })}
  >
    <div className={getDockClassName(false)}>
      <div className={floatingNavInnerClassName}>
        <ul className={getFloatingNavListClassName(false)} />
      </div>
    </div>
  </nav>
);

interface BottomNavigationResolvedContentProps extends BottomNavigationProps {
  readonly activeView: string | null;
  readonly pathname: string;
}

const BottomNavigationResolvedContent: React.FC<
  BottomNavigationResolvedContentProps
> = ({ activeView, hidden = false, pathname }) => {
  const { registerRef } = useLayout();
  const { isApp } = useDeviceInfo();
  // react-doctor-disable-next-line react-doctor/nextjs-no-use-search-params-without-suspense
  const searchParams = useSearchParams();

  const mobileNavRef = useRef<HTMLDivElement | null>(null);
  const waveIdFromQuery = getActiveWaveIdFromUrl({ pathname, searchParams });
  const variant: BottomNavVariant = usesFixedMobileBottomNavigation({
    activeView,
    pathname,
  })
    ? "fixed"
    : "floating";
  const compact = useCompactDock(hidden || variant === "fixed");
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
      className={getNavClassName({ hidden, variant })}
      inert={hidden}
    >
      {variant === "fixed" ? (
        <div className={fixedNavInnerClassName}>
          <ul className={fixedNavListClassName}>
            <LayoutGroup id="bottom-navigation">
              {navItems.map((item) => (
                <li
                  key={item.name}
                  className="tw-flex tw-h-full tw-min-w-0 tw-flex-1 tw-items-center tw-justify-center"
                >
                  <NavItem
                    variant="fixed"
                    item={item}
                    isCurrentWaveDm={isCurrentWaveDm}
                    fullPrefetch={isApp && item.kind === "view"}
                  />
                </li>
              ))}
            </LayoutGroup>
          </ul>
        </div>
      ) : (
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
      )}
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
      activeView={activeView}
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
