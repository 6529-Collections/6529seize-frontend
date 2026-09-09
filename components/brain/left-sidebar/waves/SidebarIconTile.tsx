import type { ReactNode } from "react";

export function SidebarIconTile({
  variant,
  children,
}: {
  readonly variant: "neutral" | "selected" | "accent";
  readonly children: ReactNode;
}) {
  const variantClasses = {
    accent:
      "tw-border-primary-400/35 tw-bg-primary-500/10 tw-text-primary-400",
    selected: "tw-border-white/15 tw-bg-iron-800 tw-text-iron-100",
    neutral:
      "tw-border-iron-700/80 tw-bg-iron-900 tw-text-iron-400 desktop-hover:group-hover:tw-border-iron-600/70 desktop-hover:group-hover:tw-text-iron-300",
  }[variant];

  return (
    <div
      className={`tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-transition-colors tw-duration-200 ${variantClasses}`}
    >
      {children}
    </div>
  );
}

export function AnnouncementWaveIcon() {
  return (
    <SidebarIconTile variant="accent">
      <svg
        aria-hidden="true"
        className="tw-size-[18px]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 10.25v3.5c0 .69.56 1.25 1.25 1.25H8l8.5 3.75V5.25L8 9H5.25C4.56 9 4 9.56 4 10.25Z" />
        <path d="m8 15 1.25 4" />
        <path d="M19 8.5c.67.82 1 1.99 1 3.5s-.33 2.68-1 3.5" />
      </svg>
    </SidebarIconTile>
  );
}
