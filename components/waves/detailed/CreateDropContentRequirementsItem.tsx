import React from "react";
import { DropRequirementType } from "./CreateDropContentRequirements";
import Tippy from "@tippyjs/react";

interface CreateDropContentRequirementsItemProps {
  readonly isValid: boolean;
  readonly requirementType: DropRequirementType;
  readonly missingItems: string[];
  readonly onOpenMetadata: () => void;
  readonly setFiles: (files: File[]) => void;
}

const CreateDropContentRequirementsItem: React.FC<
  CreateDropContentRequirementsItemProps
> = ({ isValid, requirementType, missingItems, onOpenMetadata, setFiles }) => {
  const LABELS: Record<DropRequirementType, string> = {
    [DropRequirementType.MEDIA]: "Media",
    [DropRequirementType.METADATA]: "Metadata",
  };

  const handleClick = () => {
    if (requirementType === DropRequirementType.METADATA) {
      onOpenMetadata();
    } else {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.multiple = true;
      fileInput.accept = "image/*,audio/*,video/*";
      fileInput.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.files) {
          setFiles(Array.from(target.files));
        }
      };
      fileInput.click();
    }
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
      <button
        className={`tw-flex tw-bg-transparent tw-border-none tw-items-center tw-gap-x-2 ${
          isValid ? "tw-text-green" : "tw-text-yellow"
        }`}
        onClick={handleClick}
      >
        {isValid ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="tw-size-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m4.5 12.75 6 6 9-13.5"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="tw-size-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        )}
        <span className="tw-text-sm">{LABELS[requirementType]}</span>
      </button>
    </Tippy>
  );
};

export default CreateDropContentRequirementsItem;
