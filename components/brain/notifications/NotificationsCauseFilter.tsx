import { useRef, useState, useEffect } from "react";
import { ApiNotificationCause } from "../../../generated/models/ApiNotificationCause";

interface NotificationFilter {
  cause: ApiNotificationCause | null;
  title: string;
}

const NotificationFilters: NotificationFilter[] = [
  { cause: null, title: "All" },
  { cause: ApiNotificationCause.IdentityMentioned, title: "Mentions" },
  { cause: ApiNotificationCause.DropQuoted, title: "Quotes" },
  { cause: ApiNotificationCause.DropReplied, title: "Replies" },
  { cause: ApiNotificationCause.IdentitySubscribed, title: "Follows" },
  { cause: ApiNotificationCause.DropVoted, title: "Ratings" },
  { cause: ApiNotificationCause.WaveCreated, title: "Waves" },
];

export default function NotificationsCauseFilter({
  activeCause,
  setActiveCause,
}: {
  readonly activeCause: ApiNotificationCause | null;
  readonly setActiveCause: (cause: ApiNotificationCause | null) => void;
}) {
  const [activeCauseIndex, setActiveCauseIndex] = useState<number>(0);

  // We'll store the position/width for our highlight bar in state
  const [highlightStyle, setHighlightStyle] = useState<{
    left: number;
    width: number;
  }>({
    left: 0,
    width: 0,
  });

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<HTMLButtonElement[]>([]);

  useEffect(() => {
    const button = buttonRefs.current[activeCauseIndex];
    if (button) {
      // Position the highlight bar under the selected button
      setHighlightStyle({
        left: button.offsetLeft,
        width: button.offsetWidth,
      });
    }
  }, [activeCauseIndex]);

  const handleChange = (
    cause: ApiNotificationCause | null,
    causeIndex: number
  ) => {
    setActiveCause(cause);
    setActiveCauseIndex(causeIndex);

    // Scroll that button into the center, if possible
    const button = buttonRefs.current[causeIndex];
    const container = containerRef.current;
    if (button && container) {
      const containerWidth = container.clientWidth;
      const scrollWidth = container.scrollWidth;

      const buttonLeft = button.offsetLeft;
      const buttonWidth = button.offsetWidth;

      // Ideal scrollLeft to center the button:
      let scrollLeft = buttonLeft - containerWidth / 2 + buttonWidth / 2;

      // Clamp to avoid over-scrolling
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

  const isActive = (cause: ApiNotificationCause | null) =>
    activeCause === cause;

  return (
    <div className="tw-mb-3 tw-w-full">
      {/* Scrollable container with a ref */}
      <div
        ref={containerRef}
        className="tw-relative tw-flex tw-nowrap tw-items-center tw-gap-1 tw-h-10 tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-800 tw-rounded-lg tw-overflow-x-auto">
        {/* Highlight bar */}
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
            isActive={isActive(filter.cause)}
            onClick={() => handleChange(filter.cause, index)}
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
  buttonRef,
}: {
  readonly title: string;
  readonly isActive: boolean;
  readonly onClick: () => void;
  readonly buttonRef: (el: HTMLButtonElement | null) => void;
}) {
  const getLinkClasses = () =>
    `tw-border-none tw-bg-transparent tw-no-underline tw-flex tw-justify-center tw-items-center
     tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-8 tw-rounded-lg tw-transition-colors tw-duration-300
     tw-ease-in-out tw-relative z-10 ${
       isActive ? "tw-text-iron-300" : "tw-text-iron-400 hover:tw-text-iron-300"
     }`;

  return (
    <button className={getLinkClasses()} onClick={onClick} ref={buttonRef}>
      <span className="tw-font-semibold tw-text-sm">{title}</span>
    </button>
  );
}
