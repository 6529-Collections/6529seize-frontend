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
  readonly hasIndicator?: boolean;
}

function WebSidebarNavItem({
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
  hasIndicator,
}: SidebarPrimaryItemProps) {
  const content = (
    <>
      {Icon && (
        <div className="tw-relative">
          <Icon
            className={`tw-h-6 tw-w-6 tw-flex-shrink-0 ${iconSizeClass || ""}`}
          />
          {hasIndicator && (
            <div className="tw-flex-shrink-0 tw-absolute tw-right-0 tw-top-0 tw-rounded-full tw-bg-red tw-h-2 tw-w-2"></div>
          )}
        </div>
      )}
      {!collapsed && (
        <>
          <span className="tw-block">{label}</span>
          {rightSlot}
        </>
      )}
    </>
  );

  // Render as Link when href is provided (for page navigation like Home, Waves, Messages)
  // Render as button when no href (for actions like opening Collections menu or Search modal)
  return href ? (
    <Link
      href={href}
      className={`tw-w-full tw-flex tw-items-center tw-no-underline tw-rounded-xl tw-border-none tw-transition-colors tw-duration-200 tw-h-12 tw-cursor-pointer focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 tw-font-medium tw-text-base ${
        collapsed
          ? "tw-justify-center tw-px-2"
          : "tw-justify-start tw-px-3 tw-gap-4"
      } ${
        active
          ? "tw-text-white desktop-hover:hover:tw-text-white tw-bg-transparent active:tw-bg-transparent"
          : "tw-text-iron-400 tw-bg-transparent desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white active:tw-bg-transparent"
      }`}
      aria-label={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      data-tooltip-id="sidebar-tooltip"
      data-tooltip-content={label}
      data-tooltip-hidden={!collapsed}
    >
      {content}
    </Link>
  ) : (
    <button
      type="button"
      onClick={onClick}
      className={`tw-w-full tw-flex tw-items-center tw-no-underline tw-rounded-xl tw-border-none tw-transition-colors tw-duration-200 tw-h-12 tw-cursor-pointer focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 tw-font-medium tw-text-base ${
        collapsed
          ? "tw-justify-center tw-px-2"
          : "tw-justify-start tw-px-3 tw-gap-4"
      } ${
        active
          ? "tw-text-white desktop-hover:hover:tw-text-white tw-bg-transparent active:tw-bg-transparent"
          : "tw-text-iron-400 tw-bg-transparent desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white active:tw-bg-transparent"
      }`}
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

export default React.memo(WebSidebarNavItem);
