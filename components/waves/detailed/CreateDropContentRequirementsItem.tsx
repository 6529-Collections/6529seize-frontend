import React from "react";
import { DropRequirementType } from "./CreateDropContentRequirements";
import Tippy from "@tippyjs/react";

interface CreateDropContentRequirementsItemProps {
  isValid: boolean;
  requirementType: DropRequirementType;
  readonly missingItems: string[];
}

const CreateDropContentRequirementsItem: React.FC<
  CreateDropContentRequirementsItemProps
> = ({ isValid, requirementType, missingItems }) => {
  const LABELS: Record<DropRequirementType, string> = {
    [DropRequirementType.MEDIA]: "Media",
    [DropRequirementType.METADATA]: "Metadata",
  };
  return (
    <Tippy
      content={
        <div className="tw-p-2 tw-bg-gray-800 tw-rounded-md tw-shadow-lg">
          {isValid ? (
            <p className="tw-text-green-400">All requirements met. Good job!</p>
          ) : (
            <div>
              <p className="tw-text-yellow-400 tw-font-semibold tw-mb-2">
                {requirementType === DropRequirementType.MEDIA
                  ? "Missing required media:"
                  : "Missing required metadata:"}
              </p>
              <ul className="tw-list-disc tw-list-inside tw-text-white">
                {missingItems.map((item, index) => (
                  <li key={index} className="tw-capitalize">
                    {item}
                  </li>
                ))}
              </ul>
              <p className="tw-text-gray-300 tw-mt-2 tw-text-sm">
                Please add the missing {requirementType.toLowerCase()} to
                proceed.
              </p>
            </div>
          )}
        </div>
      }
    >
      <div
        className={`tw-flex tw-items-center tw-gap-x-2 ${
          isValid ? "tw-text-green" : "tw-text-yellow"
        }`}
      >
        {isValid ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            className="tw-size-4"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m4.5 12.75 6 6 9-13.5"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            className="tw-size-4"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        )}
        <span className="tw-text-sm">{LABELS[requirementType]}</span>
      </div>
    </Tippy>
  );
};

export default CreateDropContentRequirementsItem;
