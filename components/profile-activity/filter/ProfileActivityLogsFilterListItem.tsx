"use client";

import { PROFILE_ACTIVITY_TYPE_TO_TEXT } from "@/entities/IProfile";
import type { ProfileActivityLogType } from "@/enums";
import { useEffect, useState } from "react";
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
  const [isSelected, setIsSelected] = useState(
    selectedItems.includes(itemType)
  );

  useEffect(() => {
    setIsSelected(selectedItems.includes(itemType));
  }, [selectedItems]);

  return (
    <li>
      <button
        className="tw-bg-transparent tw-border-none tw-w-full tw-h-full tw-group tw-text-iron-50 tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-py-2.5 tw-pl-3 tw-pr-9 hover:tw-bg-iron-700 tw-transition tw-duration-300 tw-ease-out"
        onClick={() => setSelected(itemType)}
      >
        <div className="tw-w-full tw-flex tw-items-center tw-space-x-3 tw-pr-4">
          <ProfileActivityLogsIcon logType={itemType} />
          <span className="tw-font-normal tw-block tw-truncate">
            {PROFILE_ACTIVITY_TYPE_TO_TEXT[itemType]}
          </span>
        </div>
        {isSelected && (
          <span className="tw-text-iron-50 tw-absolute tw-inset-y-0 tw-right-0 tw-flex tw-items-center tw-pr-4">
            <svg
              className="tw-h-4 tw-w-4 tw-text-primary-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        )}
      </button>
    </li>
  );
}
