"use client";

import React from "react";
import Link from "next/link";

type IconComp = React.ComponentType<{ className?: string }>;

interface SidebarPrimaryItemProps {
  readonly href?: string;
  readonly onClick?: () => void;
  readonly icon?: IconComp;
  readonly iconSizeClass?: string;
  readonly label: string;
  readonly active?: boolean;
  readonly collapsed?: boolean;
  readonly ariaExpanded?: boolean;
  readonly ariaControls?: string;
  readonly rightSlot?: React.ReactNode;
}

const baseClasses =
  "tw-w-full tw-flex tw-items-center tw-no-underline tw-rounded-xl tw-border-none tw-transition-colors tw-duration-200 tw-h-12 tw-cursor-pointer focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 tw-font-medium";

const expandedClasses = "tw-justify-start tw-px-3 tw-gap-4";
const collapsedClasses = "tw-justify-center tw-px-2";

const stateClasses = (active?: boolean) =>
  active
    ? "tw-text-white desktop-hover:hover:tw-text-white tw-bg-transparent active:tw-bg-transparent"
    : "tw-text-iron-400 tw-bg-transparent desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white active:tw-bg-transparent";

function DesktopSidebarNavItem({
  href,
  onClick,
  icon: Icon,
  iconSizeClass,
  label,
  active,
  collapsed,
  ariaExpanded,
  ariaControls,
  rightSlot,
}: SidebarPrimaryItemProps) {
  const layoutClasses = collapsed ? collapsedClasses : expandedClasses;
  const classes = `${baseClasses} ${layoutClasses} ${stateClasses(active)}`;

  const content = (
    <>
      {Icon && (
        <Icon className={`tw-h-6 tw-w-6 tw-shrink-0 ${iconSizeClass || ""}`} />
      )}
      {!collapsed && (
        <>
          <span className="tw-block">{label}</span>
          {rightSlot}
        </>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        aria-label={collapsed ? label : undefined}
        aria-current={active ? "page" : undefined}
        data-tooltip-id="sidebar-tooltip"
        data-tooltip-content={label}
        data-tooltip-hidden={!collapsed}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={classes}
      aria-label={collapsed ? label : undefined}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      data-tooltip-id="sidebar-tooltip"
      data-tooltip-content={label}
      data-tooltip-hidden={!collapsed}
    >
      {content}
    </button>
  );
}

export default React.memo(DesktopSidebarNavItem);
