import React from "react";
import Image from "next/image";
import HomeIcon from "../common/icons/HomeIcon";
import ChatBubbleIcon from "../common/icons/ChatBubbleIcon";
import UserGroupIcon from "../common/icons/UsersIcon";
import Squares2X2Icon from "../common/icons/Squares2X2Icon";
import BellIcon from "../common/icons/BellIcon";
import { useRouter } from "next/router";
import { useViewContext } from "./ViewContext";

// Placeholder for Waves icon - temporary
const WavesIconPlaceholder = ({
  className,
}: {
  readonly className?: string;
}) => (
  <div
    className={`${className} tw-flex tw-items-center tw-justify-center tw-font-bold`}
  >
    W
  </div>
);

type IconType = React.FC<{ className?: string }>;

// Define viewKey enum-like type
type ViewKey = "waves" | "messages";

// Define discriminated union for nav items
type RouteNavItem = {
  kind: "route";
  name: string;
  href: string;
  Icon?: IconType;
  image?: string;
};

type ViewNavItem = {
  kind: "view";
  name: string;
  viewKey: ViewKey;
  Icon?: IconType;
};

type NavItem = RouteNavItem | ViewNavItem;

const items: NavItem[] = [
  { kind: "route", name: "Home", href: "/", Icon: HomeIcon },
  { kind: "view", name: "Waves", viewKey: "waves", Icon: WavesIconPlaceholder },
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
    href: "/notifications",
    Icon: BellIcon,
  },
];

const BottomNavigation: React.FC = () => {
  const router = useRouter();
  const { activeSubView, setActiveSubView } = useViewContext();

  return (
    <nav className="tw-fixed tw-left-0 tw-w-full tw-overflow-x-hidden tw-bottom-0 tw-bg-black tw-border-t tw-border-iron-700 tw-shadow-inner tw-h-14 tw-z-50 md:tw-hidden">
      <div className="tw-h-full tw-pb-[env(safe-area-inset-bottom)]">
        <ul className="tw-flex tw-justify-between tw-items-end tw-h-full tw-overflow-x-hidden tw-px-2 min-[500px]:tw-px-8 sm:tw-px-16">
          {items.map((item) => {
            const { name } = item;
            const Icon = "Icon" in item ? item.Icon : undefined;
            const image = "image" in item ? item.image : undefined;

            let isActive = false;
            const handleClick = () => {
              if (item.kind === "route") {
                router.push(item.href);
              } else {
                // view
                router.push({ pathname: "/my-stream", query: { tab: item.viewKey } }, undefined, { shallow: true });
                setActiveSubView(item.viewKey);
              }
            };

            if (item.kind === "route") {
              isActive = router.pathname === item.href;
            } else {
              isActive = activeSubView === item.viewKey && router.pathname === "/my-stream";
            }

            return (
              <li
                key={name}
                className="tw-flex tw-justify-center tw-items-end tw-h-full"
              >
                <button
                  type="button"
                  aria-label={name}
                  aria-current={isActive ? "page" : undefined}
                  onClick={handleClick}
                  className="tw-bg-transparent tw-border-0 tw-flex tw-flex-col tw-items-center tw-justify-center focus:tw-outline-none tw-transition-colors tw-size-12"
                >
                  {image ? (
                    <div
                      className={`tw-flex tw-items-center tw-justify-center -tw-translate-y-2`}
                    >
                      <Image
                        src={image}
                        alt={name}
                        width={24}
                        height={24}
                        className={`tw-object-contain tw-size-8 tw-shadow-lg ${
                          isActive ? "tw-opacity-100" : "tw-opacity-50"
                        }`}
                      />
                    </div>
                  ) : Icon ? (
                    <Icon
                      className={`tw-size-6 ${
                        isActive ? "tw-text-white" : "tw-text-iron-400"
                      }`}
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default BottomNavigation;
