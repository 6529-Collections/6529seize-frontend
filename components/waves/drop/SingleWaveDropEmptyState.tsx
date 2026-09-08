import type { ReactNode } from "react";

interface SingleWaveDropEmptyStateProps {
  readonly icon: ReactNode;
  readonly title: string;
  readonly description: string;
}

export function SingleWaveDropEmptyState({
  icon,
  title,
  description,
}: SingleWaveDropEmptyStateProps) {
  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-px-4 tw-py-6 tw-text-center">
      <span
        aria-hidden="true"
        className="tw-flex tw-size-6 tw-shrink-0 tw-text-iron-500"
      >
        {icon}
      </span>
      <div className="tw-flex tw-flex-col tw-items-center tw-gap-1">
        <span className="tw-text-sm tw-font-medium tw-text-iron-300">
          {title}
        </span>
        <p className="tw-m-0 tw-max-w-64 tw-text-xs tw-leading-5 tw-text-iron-400">
          {description}
        </p>
      </div>
    </div>
  );
}
