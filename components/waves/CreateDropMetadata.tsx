import React from "react";

import CreateDropMetadataRow from "./CreateDropMetadataRow";
import type { CreateDropMetadataType } from "./CreateDropContent";
import { Tooltip } from "react-tooltip";

interface CreateDropMetadataProps {
  readonly metadata: CreateDropMetadataType[];
  readonly missingRequiredMetadataKeys: string[];
  readonly metadataErrorById: Readonly<Record<string, string>>;
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
  metadataErrorById,
  closeMetadata,
  disabled,
  onChangeKey,
  onChangeValue,
  onAddMetadata,
  onRemoveMetadata,
}) => {
  return (
    <div className="tw-mt-2 tw-space-y-2">
      <div className="tw-inline-flex tw-w-full tw-items-center tw-justify-between">
        <span>
          <span className="tw-text-xs tw-text-iron-300">Add Metadata</span>
        </span>
        <>
          <button
            type="button"
            onClick={closeMetadata}
            className="-tw-mr-2 tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-50"
            data-tooltip-id="close-metadata"
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
          <Tooltip
            id="close-metadata"
            style={{
              backgroundColor: "#1F2937",
              color: "white",
              padding: "4px 8px",
            }}
          >
            Close
          </Tooltip>
        </>
      </div>
      <div className="tw-space-y-2">
        {metadata.map((item, index) => (
          <CreateDropMetadataRow
            key={item.id}
            isError={
              missingRequiredMetadataKeys.includes(item.key) ||
              !!metadataErrorById[item.id]
            }
            errorMessage={metadataErrorById[item.id] ?? null}
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
        className={`tw-flex tw-items-center tw-gap-x-1 tw-border-none tw-bg-transparent tw-p-0 tw-text-sm tw-font-medium tw-text-primary-400 tw-transition tw-duration-300 tw-ease-out hover:tw-text-primary-300 ${
          disabled ? "tw-cursor-default tw-opacity-50" : ""
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
