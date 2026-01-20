"use client";

import { AuthContext } from "@/components/auth/Auth";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import { usePrefetchNotifications } from "@/hooks/useNotificationsQuery";
import { useContext, useLayoutEffect, useRef } from "react";

export interface NotificationFilter {
  cause: ApiNotificationCause[];
  title: string;
}

const NotificationFilters: NotificationFilter[] = [
  { cause: [], title: "All" },
  {
    cause: [
      ApiNotificationCause.IdentityMentioned,
      ApiNotificationCause.DropQuoted,
    ],
    title: "Mentions",
  },
  { cause: [ApiNotificationCause.DropReplied], title: "Replies" },
  {
    cause: [
      ApiNotificationCause.IdentitySubscribed,
      ApiNotificationCause.IdentityRep,
      ApiNotificationCause.IdentityNic,
    ],
    title: "Identity",
  },
  {
    cause: [
      ApiNotificationCause.DropVoted,
      ApiNotificationCause.DropReacted,
      ApiNotificationCause.DropBoosted,
    ],
    title: "Reactions",
  },
  { cause: [ApiNotificationCause.WaveCreated], title: "Invites" },
];

export default function NotificationsCauseFilter({
  activeFilter,
  setActiveFilter,
}: {
  readonly activeFilter: NotificationFilter | null;
  readonly setActiveFilter: (filter: NotificationFilter | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<HTMLButtonElement[]>([]);
  const highlightRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef<number>(0);

  const { connectedProfile } = useContext(AuthContext);
  const prefetchNotifications = usePrefetchNotifications();

  const handleHover = (filter: NotificationFilter) => {
    if (!connectedProfile) return;
    prefetchNotifications({
      identity: connectedProfile.handle,
      cause: filter.cause.length > 0 ? filter.cause : null,
      pages: 1,
    });
  };

  const updateHighlightPosition = (filterIndex: number) => {
    const button = buttonRefs.current[filterIndex];
    const highlight = highlightRef.current;
    if (button && highlight) {
      let l = button.offsetLeft;
      let w = button.offsetWidth;

      if (filterIndex === 0) {
        l += 2;
        w -= 2;
      }
      if (filterIndex === NotificationFilters.length - 1) {
        w -= 2;
      }

      // Direct DOM manipulation - no React state needed
      highlight.style.left = `${l}px`;
      highlight.style.width = `${w}px`;
    }
  };

  // Sync highlight position with activeFilter prop + handle layout shifts
  useLayoutEffect(() => {
    const idx =
      activeFilter == null
        ? 0
        : Math.max(
            0,
            NotificationFilters.findIndex((f) => f.title === activeFilter.title)
          );
    activeIndexRef.current = idx;
    updateHighlightPosition(idx);

    // Handle layout shifts (resize, font load, etc.)
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() =>
      updateHighlightPosition(activeIndexRef.current)
    );
    ro.observe(container);
    return () => ro.disconnect();
  }, [activeFilter]);

  const handleChange = (filter: NotificationFilter, filterIndex: number) => {
    setActiveFilter(filter);
    activeIndexRef.current = filterIndex;
    updateHighlightPosition(filterIndex);

    const button = buttonRefs.current[filterIndex];
    const container = containerRef.current;
    if (button && container) {
      const containerWidth = container.clientWidth;
      const scrollWidth = container.scrollWidth;

      const buttonLeft = button.offsetLeft;
      const buttonWidth = button.offsetWidth;

      let scrollLeft = buttonLeft - containerWidth / 2 + buttonWidth / 2;

      if (scrollLeft < 0) scrollLeft = 0;
      if (scrollLeft > scrollWidth - containerWidth) {
        scrollLeft = scrollWidth - containerWidth;
      }

      container.scrollTo({
        left: scrollLeft,
        behavior: "smooth",
      });
    }
  };

  const isActive = (filter: NotificationFilter) => activeFilter === filter;

  return (
    <div className="tw-w-full tw-pb-2 tw-pt-2 lg:tw-pt-4">
      <div
        ref={containerRef}
        className="tw-nowrap tw-relative tw-flex tw-h-10 tw-items-center tw-gap-1 tw-overflow-x-auto tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950"
      >
        <div
          ref={highlightRef}
          className="tw-absolute tw-h-8 tw-rounded-lg tw-bg-iron-800 tw-transition-all tw-duration-300 tw-ease-in-out"
        />
        {NotificationFilters.map((filter, index) => (
          <NotificationCauseFilterButton
            key={`notification-cause-filter-${filter.title}`}
            title={filter.title}
            isActive={isActive(filter)}
            onClick={() => handleChange(filter, index)}
            onMouseEnter={() => handleHover(filter)}
            buttonRef={(el) => (buttonRefs.current[index] = el!)}
          />
        ))}
      </div>
    </div>
  );
}

function NotificationCauseFilterButton({
  title,
  isActive,
  onClick,
  onMouseEnter,
  buttonRef,
}: {
  readonly title: string;
  readonly isActive: boolean;
  readonly onClick: () => void;
  readonly onMouseEnter: () => void;
  readonly buttonRef: (el: HTMLButtonElement | null) => void;
}) {
  const getLinkClasses = () =>
    `tw-border-none tw-bg-transparent tw-no-underline tw-flex tw-justify-center tw-items-center
     tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-8 tw-rounded-lg tw-transition-colors tw-duration-300
     tw-ease-in-out tw-relative z-10 ${
       isActive
         ? "tw-text-iron-300"
         : "tw-text-iron-400 desktop-hover:hover:tw-text-iron-300"
     }`;

  return (
    <button
      className={getLinkClasses()}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      ref={buttonRef}
    >
      <span className="tw-text-sm tw-font-semibold">{title}</span>
    </button>
  );
}
