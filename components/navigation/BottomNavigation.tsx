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
    iconSizeClass: "tw-size-8",
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

  const mobileNavRef = useRef<HTMLDivElement | null>(null);

  const setMobileNavRef = useCallback(
    (node: HTMLDivElement | null) => {
      console.log("BottomNavigation", node);
      mobileNavRef.current = node;
      registerRef("mobileNav", node);
    },
    [registerRef]
  );
  return (
    <nav
      ref={setMobileNavRef}
      className="tw-fixed tw-left-0 tw-w-full tw-overflow-x-hidden tw-bottom-0 tw-bg-black tw-border-t tw-border-iron-700 tw-shadow-inner tw-h-14 tw-z-50 md:tw-hidden"
    >
      <div className="tw-h-full tw-pb-[env(safe-area-inset-bottom)]">
        <ul className="tw-flex tw-justify-between tw-items-end tw-h-full tw-overflow-x-hidden tw-px-2 min-[500px]:tw-px-8 sm:tw-px-16">
          {items.map((item) => (
            <li
              key={item.name}
              className="tw-flex tw-justify-center tw-items-end tw-h-full"
            >
              <NavItem item={item} />
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default BottomNavigation;
