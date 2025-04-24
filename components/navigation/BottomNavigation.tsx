import React from "react";
import NavItem from "./NavItem";
import type { NavItem as NavItemData } from "./navTypes";
import HomeIcon from "../common/icons/HomeIcon";
import ChatBubbleIcon from "../common/icons/ChatBubbleIcon";
import UserGroupIcon from "../common/icons/UsersIcon";
import Squares2X2Icon from "../common/icons/Squares2X2Icon";
import BellIcon from "../common/icons/BellIcon";

export const items: NavItemData[] = [
  { kind: "route", name: "Home", href: "/", Icon: HomeIcon },
  { kind: "view", name: "Waves", viewKey: "waves", image: "/waves-icon.png" },
  { kind: "view", name: "Messages", viewKey: "messages", Icon: ChatBubbleIcon },
  { kind: "route", name: "Stream", href: "/my-stream", image: "/6529.png" },
  { kind: "route", name: "Network", href: "/network", Icon: UserGroupIcon },
  {
    kind: "route",
    name: "Collections",
    href: "/collections",
    Icon: Squares2X2Icon,
  },
  {
    kind: "route",
    name: "Notifications",
    href: "/my-stream/notifications",
    Icon: BellIcon,
  },
];

const BottomNavigation: React.FC = () => {
  return (
    <nav className="tw-fixed tw-left-0 tw-w-full tw-overflow-x-hidden tw-bottom-0 tw-bg-black tw-border-t tw-border-iron-700 tw-shadow-inner tw-h-14 tw-z-50 md:tw-hidden">
      <div className="tw-h-full tw-pb-[env(safe-area-inset-bottom)]">
        <ul className="tw-flex tw-justify-between tw-items-end tw-h-full tw-overflow-x-hidden tw-px-2 min-[500px]:tw-px-8 sm:tw-px-16">
          {items.map((item) => (
            <li key={item.name} className="tw-flex tw-justify-center tw-items-end tw-h-full">
              <NavItem item={item} />
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default BottomNavigation;
