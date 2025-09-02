"use client";

import Link from "next/link";
import React from "react";

type IconComp = React.ComponentType<{ className?: string }>;

interface SidebarPrimaryItemProps {
  readonly href?: string;
  readonly onClick?: () => void;
  readonly icon?: IconComp;
  readonly iconSizeClass?: string;
  readonly label: string;
  readonly active?: boolean;
  readonly collapsed?: boolean;
  readonly title?: string;
  readonly ariaExpanded?: boolean;
  readonly ariaControls?: string;
}

const baseClasses =
  "tw-w-full tw-text-lg tw-no-underline tw-flex tw-items-center tw-gap-4 tw-rounded-xl tw-group tw-justify-start tw-px-3 tw-h-12 tw-transition-all tw-duration-300";

const stateClasses = (active?: boolean) =>
  active
    ? "tw-text-white desktop-hover:hover:tw-text-white"
    : "tw-text-iron-400 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-white";

export default function DesktopSidebarNavItem({
  href,
  onClick,
  icon: Icon,
  iconSizeClass,
  label,
  active,
  collapsed,
  title,
  ariaExpanded,
  ariaControls,
}: SidebarPrimaryItemProps) {
  const content = (
    <>
      {Icon && (
        <Icon className={`tw-h-6 tw-w-6 tw-shrink-0 ${iconSizeClass || ""}`} />
      )}
      {!collapsed && <span className="tw-hidden lg:tw-block">{label}</span>}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`${baseClasses} ${stateClasses(active)}`}
        title={title || label}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${stateClasses(
        active
      )} tw-bg-transparent tw-border-0`}
      title={title || label}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
    >
      {content}
    </button>
  );
}
