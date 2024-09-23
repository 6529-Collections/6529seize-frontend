import React from "react";
import { DropRequirementType } from "./CreateDropContentRequirements";
import Tippy from "@tippyjs/react";

interface CreateDropContentRequirementsItemProps {
  readonly isValid: boolean;
  readonly requirementType: DropRequirementType;
  readonly missingItems: string[];
  readonly disabled: boolean;
  readonly onOpenMetadata: () => void;
  readonly setFiles: (files: File[]) => void;
}

const CreateDropContentRequirementsItem: React.FC<
  CreateDropContentRequirementsItemProps
> = ({
  isValid,
  requirementType,
  missingItems,
  onOpenMetadata,
  setFiles,
  disabled,
}) => {
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

  const getButtonColorClass = () => {
    if (disabled) return "tw-opacity-50 tw-cursor-not-allowed";
    return isValid ? "tw-text-green" : "tw-text-yellow";
  };

  return (
    <Tippy
      content={
        <div className="tw-p-2 tw-bg-iron-900 tw-rounded-md tw-shadow-lg">
          {isValid ? (
            <p className="tw-text-green tw-text-sm tw-font-medium">
              All requirements met. Good job!
            </p>
          ) : (
            <div>
              <p className="tw-text-yellow tw-font-medium tw-mb-2">
                {requirementType === DropRequirementType.MEDIA
                  ? "Missing required media:"
                  : "Missing required metadata:"}
              </p>
              <ul className="tw-list-disc tw-list-inside tw-text-white">
                {missingItems.map((item) => (
                  <li key={item} className="tw-capitalize">
                    {item}
                  </li>
                ))}
              </ul>
              <p className="tw-text-iron-300 tw-mt-2 tw-text-sm">
                Please add the missing {requirementType.toLowerCase()} to
                proceed.
              </p>
            </div>
          )}
        </div>
      }
    >
      <button
        className={`tw-flex tw-bg-transparent tw-border-none tw-items-center tw-gap-x-1.5 ${getButtonColorClass()}`}
        onClick={handleClick}
        type="button"
        disabled={disabled}
      >
        {isValid ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke={disabled ? "currentColor" : "green"}
            aria-hidden="true"
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
            aria-hidden="true"
            stroke={disabled ? "currentColor" : "yellow"}
            className="tw-size-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        )}
        <span className="tw-text-xs">{LABELS[requirementType]}</span>
      </button>
    </Tippy>
  );
};

export default CreateDropContentRequirementsItem;
