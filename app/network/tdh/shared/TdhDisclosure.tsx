import { ChevronRightIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { TDH_FOCUS_RING } from "./tdhStyles";

/**
 * The one disclosure of the TDH pages: a native details element whose summary
 * carries a chevron that turns when it opens. Works without JavaScript.
 */
export default function TdhDisclosure({
  summary,
  children,
  className = "",
  summaryClassName = "",
  tone = "default",
  defaultOpen = false,
}: {
  readonly summary: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
  readonly summaryClassName?: string;
  readonly tone?: "default" | "strong" | "link";
  readonly defaultOpen?: boolean;
}) {
  const text = {
    default: "tw-text-iron-300 hover:tw-text-iron-50",
    strong: "tw-font-medium tw-text-iron-100 hover:tw-text-iron-50",
    link: "tw-font-medium tw-text-primary-300 hover:tw-text-primary-400",
  }[tone];
  return (
    <details className={`tw-group ${className}`} open={defaultOpen}>
      <summary
        className={`tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-gap-2 tw-rounded-lg tw-text-sm tw-leading-6 [&::-webkit-details-marker]:tw-hidden ${text} ${TDH_FOCUS_RING} ${summaryClassName}`}
      >
        <ChevronRightIcon
          aria-hidden="true"
          className="tw-size-4 tw-shrink-0 tw-text-iron-500 tw-transition-transform group-open:tw-rotate-90 motion-reduce:tw-transition-none"
        />
        <span className="tw-min-w-0">{summary}</span>
      </summary>
      <div className="tw-pb-1 tw-pt-1">{children}</div>
    </details>
  );
}
