"use client";

import React from "react";
import Link from "next/link";
import useDeviceInfo from "../../../../hooks/useDeviceInfo";

type IconComp = React.ComponentType<{ className?: string }>;

interface SidebarPrimaryItemProps {
  readonly href?: string;
  readonly onClick?: (e?: React.MouseEvent) => void;
  readonly icon?: IconComp;
  readonly iconSizeClass?: string;
  readonly label: string;
  readonly active?: boolean;
  readonly collapsed?: boolean;
  readonly ariaExpanded?: boolean;
  readonly ariaControls?: string;
  readonly rightSlot?: React.ReactNode;
  readonly hasIndicator?: boolean;
  readonly "data-section"?: string;
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
  "data-section": dataSection,
}: SidebarPrimaryItemProps) {
  const { hasTouchScreen } = useDeviceInfo();

  const content = (
    <div
      className={`tw-flex tw-items-center tw-w-full tw-h-full ${
        collapsed ? "" : "tw-gap-x-2"
      }`}
    >
      {/* Fixed width icon container - always same position */}
      <div className="tw-w-10 tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
        {Icon && (
          <div className="tw-relative">
            <Icon
              className={`tw-h-6 tw-w-6 tw-flex-shrink-0 ${
                iconSizeClass || ""
              }`}
            />
            {hasIndicator && (
              <div className="tw-flex-shrink-0 tw-absolute tw-right-0 tw-top-0 tw-rounded-full tw-bg-red tw-h-2 tw-w-2"></div>
            )}
          </div>
        )}
      </div>
      {/* Label with smooth fade/slide animation */}
      <span
        className={`tw-block tw-overflow-hidden tw-whitespace-nowrap tw-transition-all tw-duration-300 ${
          collapsed ? "tw-opacity-0 tw-w-0" : "tw-opacity-100 tw-flex-1"
        }`}
      >
        {label}
      </span>
      {!collapsed && rightSlot}
    </div>
  );

  // Render as Link when href is provided (for page navigation like Home, Waves, Messages)
  // Render as button when no href (for actions like opening Collections menu or Search modal)
  return href ? (
    <Link
      href={href}
      className={`tw-w-full tw-block tw-no-underline tw-rounded-xl tw-border-none tw-transition-colors tw-duration-200 tw-h-[2.875rem] tw-cursor-pointer focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 tw-font-medium tw-text-base tw-px-2 tw-touch-action-manipulation ${
        active
          ? "tw-text-white tw-bg-transparent desktop-hover:hover:tw-bg-transparent desktop-hover:hover:tw-text-white active:tw-text-white"
          : "tw-text-iron-400 tw-bg-transparent desktop-hover:hover:tw-bg-transparent desktop-hover:hover:tw-text-white active:tw-text-white"
      }`}
      aria-label={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      {...(!hasTouchScreen && {
        "data-tooltip-id": "sidebar-tooltip",
        "data-tooltip-content": label,
        "data-tooltip-hidden": !collapsed,
      })}
    >
      {content}
    </Link>
  ) : (
    <button
      type="button"
      onClick={(e) => onClick?.(e)}
      className={`tw-w-full tw-block tw-text-left tw-no-underline tw-rounded-xl tw-border-none tw-transition-colors tw-duration-200 tw-h-[2.875rem] tw-cursor-pointer focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 tw-font-medium tw-text-base tw-px-2 tw-touch-action-manipulation tw-bg-transparent ${
        active
          ? "tw-text-white tw-bg-transparent desktop-hover:hover:tw-bg-transparent desktop-hover:hover:tw-text-white active:tw-text-white"
          : "tw-text-iron-400 tw-bg-transparent desktop-hover:hover:tw-bg-transparent desktop-hover:hover:tw-text-white active:tw-text-white"
      }`}
      aria-label={collapsed ? label : undefined}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      data-section={dataSection}
      {...(!hasTouchScreen && {
        "data-tooltip-id": "sidebar-tooltip",
        "data-tooltip-content": label,
        "data-tooltip-hidden": !collapsed,
      })}
    >
      {content}
    </button>
  );
}

export default React.memo(WebSidebarNavItem);
