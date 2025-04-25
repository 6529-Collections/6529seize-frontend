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

  const isStream = name === "Stream";

  if (item.disabled) {
    return (
      <button
        type="button"
        aria-label={name}
        aria-disabled="true"
        disabled
        className="tw-relative tw-bg-transparent tw-border-0 tw-flex tw-flex-col tw-items-center tw-justify-center focus:tw-outline-none tw-transition-colors tw-w-14 tw-h-16 tw-opacity-40 tw-pointer-events-none"
      >
        <div className="tw-flex tw-items-center tw-justify-center">
          {item.iconComponent ? (
            <item.iconComponent className={`${item.iconSizeClass ?? "tw-size-6"} tw-text-iron-400`} />
          ) : (
            <Image src={icon} alt={name} width={24} height={24} unoptimized className={item.iconSizeClass ?? "tw-size-6"} />
          )}
        </div>
      </button>
    );
  }

  const iconSizeClass = item.iconSizeClass ?? "tw-size-6";

  let isActive = false;
  const handleClick = () => {
    if (item.kind === "route") {
      router.push(item.href).then(() => {
        setActiveView(null);
      });
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
      className="tw-relative tw-bg-transparent tw-border-0 tw-flex tw-flex-col tw-items-center tw-justify-center focus:tw-outline-none tw-transition-colors 
      tw-w-14 tw-h-16"
    >
      {isActive && (
        <motion.div
          layoutId="nav-indicator"
          className={`tw-absolute tw-top-0 tw-left-0 tw-w-full tw-h-0.5 tw-bg-white tw-rounded-full ${
            isStream ? "tw-top-1" : ""
          }`}
        />
      )}
      <div className="tw-flex tw-items-center tw-justify-center">
        {item.iconComponent ? (
          <item.iconComponent
            className={`${iconSizeClass} ${ 
              "tw-text-iron-100"
            }`}
          />
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
