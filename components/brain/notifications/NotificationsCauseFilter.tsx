import { useRef, useState, useEffect, useContext } from "react";
import { ApiNotificationCause } from "../../../generated/models/ApiNotificationCause";
import { usePrefetchNotifications } from "../../../hooks/useNotificationsQuery";
import { AuthContext } from "../../auth/Auth";

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
  { cause: [ApiNotificationCause.IdentitySubscribed], title: "Follows" },
  { cause: [ApiNotificationCause.DropVoted], title: "Votes" },
  { cause: [ApiNotificationCause.WaveCreated], title: "Invites" },
];

export default function NotificationsCauseFilter({
  activeFilter,
  setActiveFilter,
}: {
  readonly activeFilter: NotificationFilter | null;
  readonly setActiveFilter: (filter: NotificationFilter | null) => void;
}) {
  const [activeFilterIndex, setActiveFilterIndex] = useState<number>(0);

  const [highlightStyle, setHighlightStyle] = useState<{
    left: number;
    width: number;
  }>({
    left: 0,
    width: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<HTMLButtonElement[]>([]);

  const { connectedProfile } = useContext(AuthContext);
  const prefetchNotifications = usePrefetchNotifications();

  const handleHover = (filter: NotificationFilter) => {
    if (!connectedProfile) return;
    prefetchNotifications({ identity: connectedProfile.handle, cause: filter.cause });
  };

  useEffect(() => {
    const button = buttonRefs.current[activeFilterIndex];
    if (button) {
      let l = button.offsetLeft;
      let w = button.offsetWidth;

      if (activeFilterIndex === 0) {
        l += 2;
        w -= 2;
      }
      if (activeFilterIndex === NotificationFilters.length - 1) {
        w -= 2;
      }

      setHighlightStyle({
        left: l,
        width: w,
      });
    }
  }, [activeFilterIndex]);

  const handleChange = (filter: NotificationFilter, filterIndex: number) => {
    setActiveFilter(filter);
    setActiveFilterIndex(filterIndex);

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
    <div className="tw-w-full tw-pt-2 tw-pb-2 lg:tw-pt-4">
      <div
        ref={containerRef}
        className="tw-relative tw-flex tw-nowrap tw-items-center tw-gap-1 tw-h-10 tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-800 tw-rounded-lg tw-overflow-x-auto">
        <div
          className="tw-absolute tw-h-8 tw-bg-iron-800 tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-in-out"
          style={{
            left: highlightStyle.left,
            width: highlightStyle.width,
          }}
        />
        {NotificationFilters.map((filter, index) => (
          <NotificationCauseFilterButton
            key={`notification-cause-filter-${filter.cause ?? "ALL"}`}
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
       isActive ? "tw-text-iron-300" : "tw-text-iron-400 desktop-hover:hover:tw-text-iron-300"
     }`;

  return (
    <button
      className={getLinkClasses()}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      ref={buttonRef}
    >
      <span className="tw-font-semibold tw-text-sm">{title}</span>
    </button>
  );
}
