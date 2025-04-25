import React from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useViewContext } from "./ViewContext";
import type { NavItem as NavItemData } from "./navTypes";
import { motion } from "framer-motion";

interface Props {
  readonly item: NavItemData;
}

const NavItem = ({ item }: Props) => {
  const router = useRouter();
  const { activeView, setActiveView } = useViewContext();

  const { name } = item;
  const { icon } = item;

  // Determine icon size, make Stream icon slightly bigger
  const iconSizeClass = item.iconSizeClass ?? "tw-size-6";

  let isActive = false;
  const handleClick = () => {
    if (item.kind === "route") {
      router.push(item.href);
      setActiveView(null);
    } else {
      setActiveView(item.viewKey);
    }
  };

  if (item.kind === "route") {
    isActive = router.pathname === item.href && activeView === null;
  } else {
    isActive = activeView === item.viewKey;
  }

  return (
    <button
      type="button"
      aria-label={name}
      aria-current={isActive ? "page" : undefined}
      onClick={handleClick}
      className="tw-relative tw-bg-transparent tw-border-0 tw-flex tw-flex-col tw-items-center tw-justify-center focus:tw-outline-none tw-transition-colors tw-w-12 tw-h-full"
    >
      {isActive && (
        <motion.div
          layoutId="nav-indicator"
          className="tw-absolute tw-top-0 tw-left-0 tw-w-full tw-h-0.5 tw-bg-white tw-rounded-full"
        />
      )}
      <div className="tw-flex tw-items-center tw-justify-center">
        {item.iconComponent ? (
          <item.iconComponent className={`${iconSizeClass} ${isActive ? 'tw-text-white' : 'tw-text-iron-400'}`} />
        ) : (
          <Image
            src={icon}
            alt={name}
            width={24}
            height={24}
            unoptimized
            className={iconSizeClass}
          />
        )}
      </div>
    </button>
  );
};

export default NavItem;
