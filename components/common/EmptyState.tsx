import type { ReactNode } from "react";

interface EmptyStateProps {
  readonly title: string;
  readonly message: ReactNode;
  readonly children?: ReactNode | undefined;
}

export function EmptyState({ title, message, children }: Readonly<EmptyStateProps>) {
  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-text-center tw-p-12 tw-border tw-border-dashed tw-border-iron-800 tw-rounded-xl tw-bg-iron-900/20">
      <span className="tw-text-lg tw-font-semibold tw-text-iron-200 tw-mb-2">
        {title}
      </span>
      <span className="tw-text-sm tw-text-iron-400 tw-max-w-md">
        {message}
      </span>
      {children}
    </div>
  );
}
