import { useEffect, useState } from "react";
import {
  CLASSIFICATIONS,
  PROFILE_CLASSIFICATION,
} from "../../../entities/IProfile";

export default function UserSettingsClassificationItem({
  classification,
  selected,
  onClassification,
}: {
  selected: PROFILE_CLASSIFICATION | null;
  classification: PROFILE_CLASSIFICATION;
  onClassification: (classification: PROFILE_CLASSIFICATION) => void;
}) {
  const [isActive, setIsActive] = useState<boolean>(
    classification === selected
  );
  useEffect(() => {
    setIsActive(classification === selected);
  }, [selected, classification]);
  return (
    <li
      onClick={() => onClassification(classification)}
      className="tw-group tw-text-white tw-justify-between tw-w-full tw-flex tw-rounded-lg tw-relative tw-cursor-pointer tw-select-none tw-p-2 hover:tw-bg-neutral-600 tw-transition tw-duration-300 tw-ease-out"
    >
      <span className="tw-inline-block tw-text-sm tw-font-medium tw-text-white">
        {CLASSIFICATIONS[classification].title}
      </span>
      {isActive && (
        <svg
          className="tw-h-5 tw-w-5 tw-ml-2 tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 6L9 17L4 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </li>
  );
}
