import { useState } from "react";
import { ApiNotificationCause } from "../../../generated/models/ApiNotificationCause";

interface NotificationFilter {
  cause: ApiNotificationCause | null;
}

const NotificationFilters = [
  {
    cause: null,
    title: "All",
  },
  {
    cause: ApiNotificationCause.IdentityMentioned,
    title: "Mentions",
  },
  {
    cause: ApiNotificationCause.DropQuoted,
    title: "Quotes",
  },
  {
    cause: ApiNotificationCause.DropReplied,
    title: "Replies",
  },
  {
    cause: ApiNotificationCause.IdentitySubscribed,
    title: "Follows",
  },
  {
    cause: ApiNotificationCause.DropVoted,
    title: "Ratings",
  },
  {
    cause: ApiNotificationCause.WaveCreated,
    title: "Waves",
  },
];

export default function NotificationsCauseFilter({
  activeCause,
  setActiveCause,
}: {
  readonly activeCause: ApiNotificationCause | null;
  readonly setActiveCause: (cause: ApiNotificationCause | null) => void;
}) {
  const [activeCauseIndex, setActiveCauseIndex] = useState<number>(0);

  const isActive = (cause: ApiNotificationCause | null) => {
    return activeCause === cause;
  };

  const handleChange = (
    cause: ApiNotificationCause | null,
    causeIndex: number
  ) => {
    setActiveCause(cause);
    setActiveCauseIndex(causeIndex);
  };

  return (
    <div className="tw-mb-3 tw-flex tw-justify-center tw-items-center tw-p-1 tw-gap-1 tw-w-full tw-h-10 tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-800 tw-rounded-lg tw-relative">
      <div
        className="tw-absolute tw-h-8 tw-bg-iron-800 tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-in-out"
        style={{
          width: "calc(100% / 7 - 4px)",
          left: isActive(null)
            ? "2px"
            : `calc(100% / 7 * ${activeCauseIndex} + 2px)`,
        }}
      />
      {NotificationFilters.map((filter, index) => (
        <NotificationCauseFilterButton
          key={`notification-cause-filter-${filter.cause}`}
          title={filter.title}
          isActive={isActive(filter.cause)}
          onClick={() => handleChange(filter.cause, index)}
        />
      ))}
    </div>
  );
}

function NotificationCauseFilterButton({
  title,
  isActive,
  onClick,
}: {
  readonly title: string;
  readonly isActive: boolean;
  readonly onClick: () => void;
}) {
  const getLinkClasses = () =>
    `tw-border-none tw-bg-transparent tw-no-underline tw-flex tw-justify-center tw-items-center tw-px-3 tw-py-2 tw-gap-2 tw-flex-1 tw-h-8 tw-rounded-lg tw-transition-colors tw-duration-300 tw-ease-in-out tw-relative z-10 ${
      isActive ? "tw-text-iron-300" : "tw-text-iron-400 hover:tw-text-iron-300"
    }`;

  return (
    <button className={getLinkClasses()} onClick={onClick}>
      <span className="tw-font-semibold tw-text-sm">{title}</span>
    </button>
  );
}
