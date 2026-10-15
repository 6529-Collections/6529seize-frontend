import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactNode } from "react";
import { TDH_FOCUS_RING } from "./tdhStyles";

/**
 * The one style of a link that stands on its own line on the TDH pages: the
 * next step to take, in primary colour with an arrow, never underlined, with
 * a 44 px target. Links inside sentences stay underlined (TDH_LINK).
 */
export default function TdhArrowLink({
  href,
  children,
  className = "",
}: {
  readonly href: string;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <Link
      href={href}
      className={`tw-group tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-text-sm tw-font-medium tw-text-primary-300 tw-no-underline hover:tw-text-primary-400 ${TDH_FOCUS_RING} ${className}`}
    >
      {children}
      <ArrowRightIcon
        aria-hidden="true"
        className="tw-size-4 tw-shrink-0 tw-transition-transform group-hover:tw-translate-x-0.5 motion-reduce:tw-transition-none"
      />
    </Link>
  );
}
