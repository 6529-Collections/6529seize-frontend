"use client";

import { getNotificationsRoute } from "@/helpers/navigation.helpers";
import useCapacitor from "@/hooks/useCapacitor";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import React, { useCallback, useMemo, useRef } from "react";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import BellIcon from "../common/icons/BellIcon";
import ChatBubbleIcon from "../common/icons/ChatBubbleIcon";
import HomeIcon from "../common/icons/HomeIcon";
import LogoIcon from "../common/icons/LogoIcon";
import Squares2X2Icon from "../common/icons/Squares2X2Icon";
import UsersIcon from "../common/icons/UsersIcon";
import WavesIcon from "../common/icons/WavesIcon";
import NavItem from "./NavItem";
import type { NavItem as NavItemData } from "./navTypes";

const items: NavItemData[] = [
  {
    kind: "route",
    name: "Home",
    href: "/",
    icon: "home",
    iconComponent: HomeIcon,
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
    name: "Stream",
    href: "/",
    icon: "stream",
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
    iconComponent: Squares2X2Icon,
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
  readonly hidden?: boolean;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ hidden = false }) => {
  const { registerRef } = useLayout();
  const { isAndroid } = useCapacitor();
  const { isApp } = useDeviceInfo();

  const mobileNavRef = useRef<HTMLDivElement | null>(null);

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

  const paddingClass = isAndroid ? "tw-pb-[env(safe-area-inset-bottom,0px)]" : "";

  const hiddenStyle = hidden
    ? "tw-opacity-0 tw-translate-y-full tw-pointer-events-none"
    : "tw-opacity-100 tw-translate-y-0";

  return (
    <nav
      ref={setMobileNavRef}
      className={`${paddingClass} ${hiddenStyle} tw-fixed tw-left-0 tw-w-full tw-bottom-0 tw-bg-black tw-border-t tw-border-solid tw-border-x-0 tw-border-b-0 tw-border-iron-900 tw-shadow-inner tw-z-50 tw-transition-[opacity,transform] tw-duration-75`}>
      <div className="tw-h-full">
        <ul
          className="tw-flex tw-h-full tw-pl-[env(safe-area-inset-left,0px)]
    tw-pr-[env(safe-area-inset-right,0px)] md:tw-max-w-2xl tw-mx-auto">
          {navItems.map((item) => (
            <li
              key={item.name}
              className={`tw-flex tw-flex-1 tw-justify-center tw-items-end ${
                item.name === "Stream" ? "-tw-translate-y-1" : ""
              } tw-h-full tw-min-w-0`}>
              <NavItem item={item} />
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default BottomNavigation;
