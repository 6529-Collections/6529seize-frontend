"use client";

import { usePathname, useSearchParams } from "next/navigation";
import React, { useCallback, useMemo, useRef } from "react";
import {
  getActiveWaveIdFromUrl,
  getNotificationsRoute,
} from "@/helpers/navigation.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useWave } from "@/hooks/useWave";
import { useWaveData } from "@/hooks/useWaveData";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import BellIcon from "../common/icons/BellIcon";
import ChatBubbleIcon from "../common/icons/ChatBubbleIcon";
import CollectionsMenuIcon from "../common/icons/CollectionsMenuIcon";
import DiscoverIcon from "../common/icons/DiscoverIcon";
import LogoIcon from "../common/icons/LogoIcon";
import UsersIcon from "../common/icons/UsersIcon";
import WavesIcon from "../common/icons/WavesIcon";
import NavItem from "./NavItem";
import type { NavItem as NavItemData } from "./navTypes";

const items: NavItemData[] = [
  {
    kind: "route",
    name: "Discover",
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

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  hidden = false,
}) => {
  const { registerRef } = useLayout();
  const { isApp } = useDeviceInfo();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const mobileNavRef = useRef<HTMLDivElement | null>(null);
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

  const hiddenStyle = hidden
    ? "tw-opacity-0 tw-translate-y-full tw-pointer-events-none"
    : "tw-opacity-100 tw-translate-y-0";

  return (
    <nav
      ref={setMobileNavRef}
      className={`${hiddenStyle} tw-fixed tw-bottom-0 tw-left-0 tw-z-50 tw-h-[65px] tw-w-full tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-900 tw-bg-black tw-shadow-inner tw-transition-[opacity,transform] tw-duration-75`}
    >
      <div className="tw-h-full">
        <ul className="tw-mx-auto tw-flex tw-h-full tw-pl-[env(safe-area-inset-left,0px)] tw-pr-[env(safe-area-inset-right,0px)] md:tw-max-w-2xl">
          {navItems.map((item) => (
            <li
              key={item.name}
              className={`tw-flex tw-flex-1 tw-items-center tw-justify-center ${
                item.name === "Home" ? "-tw-translate-y-1" : ""
              } tw-h-full tw-min-w-0`}
            >
              <NavItem item={item} isCurrentWaveDm={isCurrentWaveDm} />
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default BottomNavigation;
