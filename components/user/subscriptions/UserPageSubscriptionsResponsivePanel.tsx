"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useScrollToHashOnMount } from "@/hooks/useScrollToHashOnMount";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import UserPageSubscriptionsSection from "./UserPageSubscriptionsSection";
import { useSubscriptionDisclosure } from "./useSubscriptionDisclosure";

const SHEET_MEDIA_QUERY = "(max-width: 1023px)";

/** Keep secondary sections inline on desktop and in the shared sheet below lg. */
export default function UserPageSubscriptionsResponsivePanel({
  id,
  title,
  summary,
  className,
  headerClassName,
  fullHeight = false,
  children,
}: Readonly<{
  id: string;
  title: string;
  summary?: ReactNode;
  className?: string;
  headerClassName?: string;
  fullHeight?: boolean;
  children: ReactNode;
}>) {
  const isMobile = useMediaQuery(SHEET_MEDIA_QUERY);
  const hasSummary = Boolean(summary);
  const { expanded, setExpanded } = useSubscriptionDisclosure(
    id,
    true,
    `${id}-title`,
    SHEET_MEDIA_QUERY
  );
  useScrollToHashOnMount(id, {
    enabled: !isMobile,
    focusId: `${id}-title`,
  });

  if (!isMobile) {
    return (
      <UserPageSubscriptionsSection
        id={id}
        title={title}
        className={`tw-hidden lg:tw-block ${className ?? ""}`}
        headerClassName={headerClassName}
      >
        {children}
      </UserPageSubscriptionsSection>
    );
  }

  return (
    <div id={id} className="tw-min-w-0 tw-scroll-mt-24">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={expanded}
        aria-controls={`${id}-sheet`}
        aria-labelledby={`${id}-title`}
        aria-describedby={hasSummary ? `${id}-summary` : undefined}
        onClick={() => setExpanded(true)}
        className="tw-flex tw-min-h-16 tw-w-full tw-items-center tw-justify-between tw-gap-4 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-5 tw-py-5 tw-text-left tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-bg-white/[0.03]"
      >
        <span className="tw-min-w-0">
          <span
            id={`${id}-title`}
            className="tw-block tw-text-[17px] tw-font-medium tw-text-iron-100"
          >
            {title}
          </span>
          {hasSummary && (
            <span
              id={`${id}-summary`}
              className="tw-mt-1 tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-text-[15px] tw-font-normal tw-leading-5 tw-text-iron-400"
            >
              {summary}
            </span>
          )}
        </span>
        <ChevronRightIcon
          className="tw-size-5 tw-shrink-0 tw-text-iron-500"
          aria-hidden="true"
        />
      </button>
      <MobileWrapperDialog
        id={`${id}-sheet`}
        title={title}
        titleClassName="!tw-text-lg !tw-font-semibold"
        isOpen={expanded}
        onClose={() => setExpanded(false)}
        tall
        fixedHeight={fullHeight}
        fitVisualViewport
        focusTitleOnOpen
        keepMounted
      >
        <div className="tw-min-w-0 tw-px-4 tw-pt-4 sm:tw-px-6">{children}</div>
      </MobileWrapperDialog>
    </div>
  );
}
