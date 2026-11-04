import { ChevronDownIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

/**
 * A closed section the reader opens: what most people don't need, kept one
 * click away. A link to its id opens it (ValidatorFoldOpener).
 */
export default function ValidatorFold({
  id,
  title,
  children,
  small = false,
}: {
  readonly id?: string | undefined;
  readonly title: string;
  readonly children: ReactNode;
  /** A lighter fold inside a section, such as the steps' extra pictures. */
  readonly small?: boolean | undefined;
}) {
  return (
    <details
      id={id}
      className={`tw-group tw-scroll-mt-24 tw-rounded-xl tw-border tw-border-solid ${
        small
          ? "tw-border-white/[0.07] tw-bg-transparent"
          : "tw-border-white/[0.08] tw-bg-iron-900/40"
      }`}
    >
      <summary
        className={`tw-flex tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-4 tw-rounded-xl tw-px-5 tw-text-iron-100 tw-transition-colors hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 [&::-webkit-details-marker]:tw-hidden ${
          small
            ? "tw-min-h-12 tw-py-2 tw-text-base tw-font-medium"
            : "tw-min-h-14 tw-py-3 tw-text-lg tw-font-semibold"
        }`}
      >
        <span>{title}</span>
        <ChevronDownIcon
          aria-hidden="true"
          className="tw-size-5 tw-flex-none tw-text-iron-400 tw-transition group-open:tw-rotate-180"
        />
      </summary>
      <div className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-px-5 tw-pb-5 tw-pt-4">
        {children}
      </div>
    </details>
  );
}
