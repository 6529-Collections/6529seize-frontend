import type { ReactNode } from "react";

export default function MySubmissionsButton({
  children,
  onClick,
}: {
  readonly children: ReactNode;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tw-inline-flex tw-h-9 tw-max-w-full tw-shrink-0 tw-cursor-pointer tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-1 tw-text-xs tw-font-medium tw-text-iron-300 tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-iron-100 desktop-hover:hover:tw-underline"
    >
      {children}
    </button>
  );
}
