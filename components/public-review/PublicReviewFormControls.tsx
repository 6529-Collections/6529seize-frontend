import { ChevronDownIcon } from "@heroicons/react/24/outline";
import type { ComponentPropsWithoutRef } from "react";

export const PUBLIC_REVIEW_INPUT_CLASSES =
  "tw-min-h-11 tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-base sm:tw-text-sm tw-text-iron-50 tw-caret-primary-400 tw-shadow-inner tw-outline-none tw-ring-1 tw-ring-inset tw-ring-white/[0.09] tw-transition tw-duration-200 tw-ease-out placeholder:tw-text-iron-500 hover:tw-bg-iron-800/70 hover:tw-ring-white/[0.15] focus:tw-bg-iron-900 focus:tw-ring-2 focus:tw-ring-inset focus:tw-ring-primary-400/70 disabled:tw-cursor-not-allowed disabled:tw-opacity-60";

export function PublicReviewSelect({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"select">) {
  return (
    <span className="tw-group tw-relative tw-block">
      <select
        {...props}
        className={`${PUBLIC_REVIEW_INPUT_CLASSES} tw-appearance-none tw-pr-10 !tw-text-base sm:!tw-text-sm ${className ?? ""}`}
      >
        {children}
      </select>
      <ChevronDownIcon
        aria-hidden="true"
        className="tw-pointer-events-none tw-absolute tw-right-3.5 tw-top-1/2 tw-size-4 -tw-translate-y-1/2 tw-text-iron-400 tw-transition-colors group-focus-within:tw-text-primary-300"
      />
    </span>
  );
}
