"use client";

import React, { useCallback, useRef } from "react";
import NavItem from "./NavItem";
import type { NavItem as NavItemData } from "./navTypes";
import HomeIcon from "../common/icons/HomeIcon";
import WavesIcon from "../common/icons/WavesIcon";
import ChatBubbleIcon from "../common/icons/ChatBubbleIcon";
import Squares2X2Icon from "../common/icons/Squares2X2Icon";
import BellIcon from "../common/icons/BellIcon";
import UsersIcon from "../common/icons/UsersIcon";
import LogoIcon from "../common/icons/LogoIcon";
import { useLayout } from "../brain/my-stream/layout/LayoutContext";
import useCapacitor from "../../hooks/useCapacitor";

export const items: NavItemData[] = [
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
    href: "/my-stream",
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
    href: "/my-stream/notifications",
    icon: "notifications",
    iconComponent: BellIcon,
  },
];

const BottomNavigation: React.FC = () => {
  const { registerRef } = useLayout();
  const { isAndroid } = useCapacitor();

  const mobileNavRef = useRef<HTMLDivElement | null>(null);

  const setMobileNavRef = useCallback(
    (node: HTMLDivElement | null) => {
      console.log("BottomNavigation", node);
      mobileNavRef.current = node;
      registerRef("mobileNav", node);
    },
    [registerRef]
  );
  
  // Only add safe area padding on Android
  const paddingClass = isAndroid ? "tw-pb-[env(safe-area-inset-bottom,0px)]" : "";
  
  return (
    <nav
      ref={setMobileNavRef}
      className={`${paddingClass} tw-fixed tw-left-0 tw-w-full tw-bottom-0 tw-bg-black tw-border-t tw-border-solid tw-border-x-0 tw-border-b-0 tw-border-iron-900 tw-shadow-inner tw-z-50`}>
      <div className="tw-h-full">
        <ul
          className="tw-flex tw-h-full tw-pl-[env(safe-area-inset-left,0px)]
    tw-pr-[env(safe-area-inset-right,0px)] md:tw-max-w-2xl tw-mx-auto">
          {items.map((item) => (
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
