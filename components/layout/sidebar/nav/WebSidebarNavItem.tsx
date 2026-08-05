"use client";

import React from "react";
import Link from "next/link";
import useDeviceInfo from "../../../../hooks/useDeviceInfo";

type IconComp = React.ComponentType<{ className?: string | undefined }>;

interface SidebarPrimaryItemProps {
  readonly href?: string | undefined;
  readonly onClick?: ((e?: React.MouseEvent) => void) | undefined;
  readonly onPointerEnter?:
    | React.PointerEventHandler<HTMLButtonElement>
    | undefined;
  readonly onPointerLeave?:
    | React.PointerEventHandler<HTMLButtonElement>
    | undefined;
  readonly onKeyDown?:
    | React.KeyboardEventHandler<HTMLButtonElement>
    | undefined;
  readonly icon?: IconComp | undefined;
  readonly iconSizeClass?: string | undefined;
  readonly label: string;
  readonly active?: boolean | undefined;
  readonly ariaCurrent?: React.AriaAttributes["aria-current"] | undefined;
  readonly collapsed?: boolean | undefined;
  readonly ariaExpanded?: boolean | undefined;
  readonly ariaControls?: string | undefined;
  readonly ariaHasPopup?: React.AriaAttributes["aria-haspopup"] | undefined;
  readonly rightSlot?: React.ReactNode | undefined;
  readonly hasIndicator?: boolean | undefined;
  readonly "data-section"?: string | undefined;
}

function WebSidebarNavItem({
  href,
  onClick,
  onPointerEnter,
  onPointerLeave,
  onKeyDown,
  icon: Icon,
  iconSizeClass,
  label,
  active,
  ariaCurrent,
  collapsed,
  ariaExpanded,
  ariaControls,
  ariaHasPopup,
  rightSlot,
  hasIndicator,
  "data-section": dataSection,
}: SidebarPrimaryItemProps) {
  const { hasTouchScreen } = useDeviceInfo();

  const content = (
    <div
      className={`tw-flex tw-h-full tw-w-full tw-items-center ${
        collapsed ? "" : "tw-gap-x-2"
      }`}
    >
      <div className="tw-flex tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center">
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
                <div className="tw-absolute tw-right-0 tw-top-0 tw-h-2 tw-w-2 tw-flex-shrink-0 tw-rounded-full tw-bg-red" />
                <span className="tw-sr-only">Unread</span>
              </>
            )}
          </div>
        )}
      </div>
      <span
        className={`tw-block tw-overflow-hidden tw-whitespace-nowrap tw-transition-all tw-duration-300 motion-reduce:tw-transition-none ${
          collapsed ? "tw-w-0 tw-opacity-0" : "tw-flex-1 tw-opacity-100"
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
      "data-tooltip-hidden": !collapsed || ariaExpanded === true,
    }),
    ...(dataSection ? { "data-section": dataSection } : {}),
  } as const;

  if (href) {
    return (
      <Link
        href={href}
        className={`tw-touch-action-manipulation tw-block tw-h-[2.875rem] tw-w-full tw-cursor-pointer tw-rounded-xl tw-border-none tw-px-2 tw-text-base tw-font-medium tw-no-underline tw-transition-colors tw-duration-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 motion-reduce:tw-transition-none ${
          active
            ? "tw-bg-transparent tw-text-white active:tw-text-white desktop-hover:hover:tw-bg-transparent desktop-hover:hover:tw-text-white"
            : "tw-bg-transparent tw-text-iron-400 active:tw-text-white desktop-hover:hover:tw-bg-transparent desktop-hover:hover:tw-text-white"
        }`}
        aria-current={active ? (ariaCurrent ?? "page") : undefined}
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
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onKeyDown={onKeyDown}
      className={`tw-touch-action-manipulation tw-block tw-h-[2.875rem] tw-w-full tw-cursor-pointer tw-rounded-xl tw-border-none tw-bg-transparent tw-px-2 tw-text-left tw-text-base tw-font-medium tw-no-underline tw-transition-colors tw-duration-200 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 motion-reduce:tw-transition-none ${
        active
          ? "tw-bg-transparent tw-text-white active:tw-text-white desktop-hover:hover:tw-bg-transparent desktop-hover:hover:tw-text-white"
          : "tw-bg-transparent tw-text-iron-400 active:tw-text-white desktop-hover:hover:tw-bg-transparent desktop-hover:hover:tw-text-white"
      }`}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      aria-haspopup={ariaHasPopup}
      {...commonProps}
    >
      {content}
    </button>
  );
}

export default React.memo(WebSidebarNavItem);
