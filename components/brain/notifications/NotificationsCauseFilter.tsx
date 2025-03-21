import { useState } from "react";
import { ApiNotificationCause } from "../../../generated/models/ApiNotificationCause";

export default function NotificationsCauseFilter({
  activeCause,
  setActiveCause,
}: {
  activeCause: ApiNotificationCause | null;
  setActiveCause: (cause: ApiNotificationCause | null) => void;
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
    <div className="tw-mb-2 tw-flex tw-justify-center tw-items-center tw-p-1 tw-gap-1 tw-w-full tw-h-10 tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-800 tw-rounded-lg tw-relative">
      <div
        className="tw-absolute tw-h-8 tw-bg-iron-800 tw-rounded-lg tw-transition-all tw-duration-300 tw-ease-in-out"
        style={{
          width: "calc(100% / 7 - 4px)",
          left: isActive(null)
            ? "2px"
            : `calc(100% / 7 * ${activeCauseIndex} + 2px)`,
        }}
      />
      <NotificationCauseFilterButton
        title="All"
        isActive={isActive(null)}
        onClick={() => handleChange(null, 0)}
      />
      <NotificationCauseFilterButton
        title="Mentions"
        isActive={isActive(ApiNotificationCause.IdentityMentioned)}
        onClick={() => handleChange(ApiNotificationCause.IdentityMentioned, 1)}
      />
      <NotificationCauseFilterButton
        title="Quotes"
        isActive={isActive(ApiNotificationCause.DropQuoted)}
        onClick={() => handleChange(ApiNotificationCause.DropQuoted, 2)}
      />
      <NotificationCauseFilterButton
        title="Replies"
        isActive={isActive(ApiNotificationCause.DropReplied)}
        onClick={() => handleChange(ApiNotificationCause.DropReplied, 3)}
      />
      <NotificationCauseFilterButton
        title="Follows"
        isActive={isActive(ApiNotificationCause.IdentitySubscribed)}
        onClick={() => handleChange(ApiNotificationCause.IdentitySubscribed, 4)}
      />
      <NotificationCauseFilterButton
        title="Ratings"
        isActive={isActive(ApiNotificationCause.DropVoted)}
        onClick={() => handleChange(ApiNotificationCause.DropVoted, 5)}
      />
      <NotificationCauseFilterButton
        title="Waves"
        isActive={isActive(ApiNotificationCause.WaveCreated)}
        onClick={() => handleChange(ApiNotificationCause.WaveCreated, 6)}
      />
    </div>
  );
}

function NotificationCauseFilterButton({
  title,
  isActive,
  onClick,
}: {
  title: string;
  isActive: boolean;
  onClick: () => void;
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
