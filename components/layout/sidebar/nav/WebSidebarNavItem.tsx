"use client";

import React from "react";
import Link from "next/link";
import useDeviceInfo from "../../../../hooks/useDeviceInfo";

type IconComp = React.ComponentType<{ className?: string | undefined }>;

interface SidebarPrimaryItemProps {
  readonly href?: string | undefined;
  readonly onClick?: ((e?: React.MouseEvent) => void) | undefined;
  readonly icon?: IconComp | undefined;
  readonly iconSizeClass?: string | undefined;
  readonly label: string;
  readonly active?: boolean | undefined;
  readonly collapsed?: boolean | undefined;
  readonly ariaExpanded?: boolean | undefined;
  readonly ariaControls?: string | undefined;
  readonly rightSlot?: React.ReactNode | undefined;
  readonly hasIndicator?: boolean | undefined;
  readonly "data-section"?: string | undefined;
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
      <div className="tw-w-10 tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
        {Icon && (
          <div className="tw-relative">
            <Icon
              aria-hidden="true"
              className={`tw-h-6 tw-w-6 tw-flex-shrink-0 ${
                iconSizeClass ?? ""
              }`}
            />
            {hasIndicator && (
              <>
                <div className="tw-flex-shrink-0 tw-absolute tw-right-0 tw-top-0 tw-rounded-full tw-bg-red tw-h-2 tw-w-2" />
                <span className="tw-sr-only">Unread</span>
              </>
            )}
          </div>
        )}
      </div>
      <span
        className={`tw-block tw-overflow-hidden tw-whitespace-nowrap tw-transition-all tw-duration-300 motion-reduce:tw-transition-none ${
          collapsed ? "tw-opacity-0 tw-w-0" : "tw-opacity-100 tw-flex-1"
        }`}
      >
        {label}
      </span>
      {!collapsed && rightSlot}
    </div>
  );

  const commonProps = {
    "aria-label": collapsed ? label : undefined,
    ...(!hasTouchScreen && {
      "data-tooltip-id": "sidebar-tooltip",
      "data-tooltip-content": label,
      "data-tooltip-hidden": !collapsed,
    }),
    ...(dataSection ? { "data-section": dataSection } : {}),
  } as const;

  if (href) {
    return (
      <Link
        href={href}
        className={`tw-w-full tw-block tw-no-underline tw-rounded-xl tw-border-none tw-transition-colors tw-duration-200 motion-reduce:tw-transition-none tw-h-[2.875rem] tw-cursor-pointer focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 tw-font-medium tw-text-base tw-px-2 tw-touch-action-manipulation ${
          active
            ? "tw-text-white tw-bg-transparent desktop-hover:hover:tw-bg-transparent desktop-hover:hover:tw-text-white active:tw-text-white"
            : "tw-text-iron-400 tw-bg-transparent desktop-hover:hover:tw-bg-transparent desktop-hover:hover:tw-text-white active:tw-text-white"
        }`}
        aria-current={active ? "page" : undefined}
        {...commonProps}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => onClick?.(e)}
      className={`tw-w-full tw-block tw-text-left tw-no-underline tw-rounded-xl tw-border-none tw-transition-colors tw-duration-200 motion-reduce:tw-transition-none tw-h-[2.875rem] tw-cursor-pointer focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 tw-font-medium tw-text-base tw-px-2 tw-touch-action-manipulation tw-bg-transparent ${
        active
          ? "tw-text-white tw-bg-transparent desktop-hover:hover:tw-bg-transparent desktop-hover:hover:tw-text-white active:tw-text-white"
          : "tw-text-iron-400 tw-bg-transparent desktop-hover:hover:tw-bg-transparent desktop-hover:hover:tw-text-white active:tw-text-white"
      }`}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      {...commonProps}
    >
      {content}
    </button>
  );
}

export default React.memo(WebSidebarNavItem);
