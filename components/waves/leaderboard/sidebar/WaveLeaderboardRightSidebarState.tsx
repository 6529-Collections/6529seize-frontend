import type { ReactNode } from "react";

interface WaveLeaderboardRightSidebarStateProps {
  readonly icon: ReactNode;
  readonly title: string;
  readonly description?: string | undefined;
  readonly announce?: boolean | undefined;
}

export function WaveLeaderboardRightSidebarState({
  icon,
  title,
  description,
  announce = false,
}: WaveLeaderboardRightSidebarStateProps) {
  return (
    <div
      role={announce ? "status" : undefined}
      aria-live={announce ? "polite" : undefined}
      className="tw-flex tw-min-h-36 tw-flex-col tw-items-center tw-justify-center tw-p-4 tw-text-center"
    >
      <span className="tw-flex tw-size-8 tw-items-center tw-justify-center tw-text-iron-500">
        {icon}
      </span>
      <h3 className="tw-mb-0 tw-mt-2 tw-text-sm tw-font-semibold tw-text-iron-300">
        {title}
      </h3>
      {description && (
        <p className="tw-mb-0 tw-mt-1 tw-max-w-56 tw-text-xs tw-leading-5 tw-text-iron-500">
          {description}
        </p>
      )}
    </div>
  );
}
