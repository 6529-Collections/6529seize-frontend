'use client';

import TooltipIconButton from "@/components/common/TooltipIconButton";
import { classNames } from "@/helpers/Helpers";
import { VIEW_ICONS, VIEW_LABELS, VIEW_ORDER, type ReceivedView } from "../constants";

export interface UserPageXtdhReceivedViewToggleProps {
  readonly view: ReceivedView;
  readonly onViewChange: (view: ReceivedView) => void;
  readonly announcement: string;
}

export function UserPageXtdhReceivedViewToggle({
  view,
  onViewChange,
  announcement,
}: UserPageXtdhReceivedViewToggleProps) {
  return (
    <div className="tw-inline-flex tw-flex-col tw-items-end">
      <div
        className="tw-inline-flex tw-overflow-hidden tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900"
        role="group"
        aria-label="View options"
      >
        {VIEW_ORDER.map((option) => {
          const isActive = view === option;
          return (
            <TooltipIconButton
              key={option}
              onClick={() => onViewChange(option)}
              aria-pressed={isActive}
              aria-label={`${VIEW_LABELS[option]} view`}
              tooltipText={`${VIEW_LABELS[option]} view`}
              className={classNames(
                "tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-border-solid tw-transition tw-duration-200 tw-ease-out focus-visible:tw-ring-2 focus-visible:tw-ring-primary-500 focus-visible:tw-ring-offset-0",
                option === VIEW_ORDER[0] ? "tw-rounded-l-lg" : "tw-rounded-r-lg",
                isActive
                  ? "tw-bg-primary-500"
                  : "tw-bg-transparent hover:tw-bg-iron-800",
                option !== VIEW_ORDER[0] ? "tw-border-l tw-border-iron-700" : ""
              )}
              icon={VIEW_ICONS[option]}
              iconClassName={classNames(
                "tw-text-base",
                isActive ? "tw-text-iron-50" : "tw-text-iron-300"
              )}
            />
          );
        })}
      </div>
      <span
        aria-live="polite"
        aria-atomic="true"
        className="tw-sr-only"
      >
        {announcement}
      </span>
    </div>
  );
}
