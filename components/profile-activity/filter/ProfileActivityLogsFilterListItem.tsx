"use client";

import { PROFILE_ACTIVITY_TYPE_TO_TEXT } from "@/entities/IProfile";
import type { ProfileActivityLogType } from "@/types/enums";
import ProfileActivityLogsIcon from "../icons/ProfileActivityLogsIcon";

export default function ProfileActivityLogsFilterListItem({
  itemType,
  selectedItems,
  setSelected,
}: {
  readonly itemType: ProfileActivityLogType;
  readonly selectedItems: ProfileActivityLogType[];
  readonly setSelected: (selected: ProfileActivityLogType) => void;
}) {
  const isSelected = selectedItems.includes(itemType);

  return (
    <li>
      <button
        type="button"
        aria-pressed={isSelected}
        className={`tw-group tw-flex tw-min-h-11 tw-w-full tw-cursor-pointer tw-select-none tw-items-center tw-gap-3 tw-rounded-lg tw-border-none tw-px-2.5 tw-py-2 tw-text-left tw-transition-colors tw-duration-150 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px] focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none ${
          isSelected
            ? "tw-bg-white/[0.06] tw-text-iron-50 desktop-hover:hover:tw-bg-white/[0.09]"
            : "tw-bg-transparent tw-text-iron-300 desktop-hover:hover:tw-bg-white/[0.04] desktop-hover:hover:tw-text-iron-100"
        }`}
        onClick={() => setSelected(itemType)}
      >
        <span className="tw-flex tw-h-8 tw-w-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-bg-white/[0.04] tw-ring-1 tw-ring-inset tw-ring-white/[0.06]">
          <ProfileActivityLogsIcon logType={itemType} />
        </span>
        <span className="tw-min-w-0 tw-flex-1 tw-truncate tw-text-sm tw-font-medium">
          {PROFILE_ACTIVITY_TYPE_TO_TEXT[itemType]}
        </span>
        <span
          className={`tw-inline-flex tw-h-5 tw-w-5 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-ring-1 tw-ring-inset tw-transition-colors tw-duration-150 motion-reduce:tw-transition-none ${
            isSelected
              ? "tw-bg-primary-500/15 tw-text-primary-300 tw-ring-primary-400/30"
              : "tw-bg-transparent tw-text-transparent tw-ring-white/10"
          }`}
          aria-hidden="true"
        >
          {isSelected && (
            <svg
              className="tw-h-3.5 tw-w-3.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </span>
      </button>
    </li>
  );
}
