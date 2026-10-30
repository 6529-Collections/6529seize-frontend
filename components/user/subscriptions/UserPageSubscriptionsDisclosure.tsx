"use client";

import { ChevronRightIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { useScrollToHashOnMount } from "@/hooks/useScrollToHashOnMount";
import { useSubscriptionDisclosure } from "./useSubscriptionDisclosure";

export default function UserPageSubscriptionsDisclosure({
  id,
  title,
  summary,
  children,
}: Readonly<{
  id: string;
  title: string;
  summary?: string | undefined;
  children: ReactNode;
}>) {
  const { expanded, setExpanded } = useSubscriptionDisclosure(id);
  useScrollToHashOnMount(id, { enabled: expanded, focusId: `${id}-title` });
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="tw-min-w-0 tw-scroll-mt-24"
    >
      <h2
        id={`${id}-title`}
        tabIndex={-1}
        className="tw-m-0 tw-rounded-lg tw-text-[15px] tw-font-medium focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={`${id}-content`}
          onClick={() => setExpanded(!expanded)}
          className="tw-flex tw-min-h-14 tw-w-full tw-items-center tw-gap-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-5 tw-py-4 tw-text-left tw-text-iron-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 max-md:tw-px-4"
        >
          <span className="tw-flex-1">{title}</span>
          {summary && (
            <span className="tw-max-w-[50%] tw-truncate tw-text-sm tw-font-normal tw-text-iron-400 max-md:tw-hidden">
              {summary}
            </span>
          )}
          <ChevronRightIcon
            aria-hidden="true"
            className={`tw-size-4 tw-shrink-0 tw-text-iron-400 ${expanded ? "tw-rotate-90" : ""}`}
          />
        </button>
      </h2>
      <div
        id={`${id}-content`}
        hidden={!expanded}
        className="tw-px-5 tw-pb-4 max-md:tw-px-4"
      >
        {children}
      </div>
    </section>
  );
}
