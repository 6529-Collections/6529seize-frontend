import React from "react";

import CreateDropMetadataRow from "./CreateDropMetadataRow";
import { CreateDropMetadataType } from "./CreateDropContent";
import Tippy from "@tippyjs/react";

interface CreateDropMetadataProps {
  readonly metadata: CreateDropMetadataType[];
  readonly missingRequiredMetadataKeys: string[];
  readonly disabled: boolean;
  readonly closeMetadata: () => void;
  readonly onChangeKey: (params: { index: number; newKey: string }) => void;
  readonly onChangeValue: (params: {
    index: number;
    newValue: string | number | null;
  }) => void;
  readonly onAddMetadata: () => void;
  readonly onRemoveMetadata: (index: number) => void;
}

const CreateDropMetadata: React.FC<CreateDropMetadataProps> = ({
  metadata,
  missingRequiredMetadataKeys,
  closeMetadata,
  disabled,
  onChangeKey,
  onChangeValue,
  onAddMetadata,
  onRemoveMetadata,
}) => {
  return (
    <div className="tw-mt-2 tw-space-y-2">
      <div className="tw-w-full tw-inline-flex tw-items-center tw-justify-between">
        <span>
          <span className="tw-text-xs tw-text-iron-300">Add Metadata</span>
        </span>
        <Tippy
          content={
            <div className="tw-text-center">
              <span
                className={`tw-text-xs tw-font-normal tw-text-center tw-w-full tw-transition tw-duration-300 tw-ease-out`}
              >
                Close
              </span>
            </div>
          }
          placement="top"
          disabled={false}
        >
          <button
            type="button"
            onClick={closeMetadata}
            className="tw-bg-transparent tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-h-8 tw-w-8 tw-border-0 -tw-mr-2  tw-text-iron-400 hover:tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              aria-hidden="true"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="tw-size-5 tw-flex-shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </Tippy>
      </div>
      <div className="tw-space-y-2">
        {metadata.map((item, index) => (
          <CreateDropMetadataRow
            key={`${item.key}-${index}`}
            isError={missingRequiredMetadataKeys.includes(item.key)}
            onRemove={onRemoveMetadata}
            metadata={item}
            index={index}
            onChangeKey={onChangeKey}
            onChangeValue={onChangeValue}
            disabled={disabled}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onAddMetadata}
        disabled={disabled}
        className={`tw-border-none tw-bg-transparent tw-p-0 tw-items-center tw-text-sm tw-font-medium tw-gap-x-1 tw-flex tw-text-primary-400 hover:tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out ${
          disabled ? "tw-opacity-50 tw-cursor-default" : ""
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          aria-hidden="true"
          className="tw-size-5 tw-flex-shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          ></path>
        </svg>
        <span>Add new</span>
      </button>
    </div>
  );
};

export default CreateDropMetadata;
