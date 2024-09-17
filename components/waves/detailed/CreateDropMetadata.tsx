import React from "react";

import CreateDropMetadataRow from "./CreateDropMetadataRow";
import { CreateDropMetadataType } from "./CreateDropContent";
import Tippy from "@tippyjs/react";

interface CreateDropMetadataProps {
  readonly metadata: CreateDropMetadataType[];
  readonly missingRequiredMetadataKeys: string[];
  readonly closeMetadata: () => void;
  readonly onChangeKey: (params: { index: number; newKey: string }) => void;
  readonly onChangeValue: (params: {
    index: number;
    newValue: string | number | null;
  }) => void;
  readonly onAddMetadata: () => void;
}

const CreateDropMetadata: React.FC<CreateDropMetadataProps> = ({
  metadata,
  missingRequiredMetadataKeys,
  closeMetadata,
  onChangeKey,
  onChangeValue,
  onAddMetadata,
}) => {
  return (
    <div className="tw-mt-3 tw-space-y-2">
      <div className="tw-flex tw-flex-col tw-gap-y-1.5 tw-items-start">
        <span className="tw-text-xs tw-text-iron-400">Required Media</span>
        <label className="tw-px-2 tw-py-1.5 tw-text-xs tw-font-medium tw-inline-flex tw-items-center tw-gap-x-2 tw-bg-primary-500 hover:tw-bg-primary-600 tw-rounded-lg tw-cursor-pointer tw-text-iron-50 tw-transition-all tw-duration-300 tw-ease-out">
          <svg
            className="tw-flex-shrink-0 tw-h-5 tw-w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            aria-hidden="true"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
            />
          </svg>
          <input
            type="file"
            className="tw-hidden"
            accept="image/*,video/*,audio/*"
            multiple
          />
          <span>Upload a file</span>
        </label>
      </div>
      <div>
        <div className="tw-w-full tw-flex tw-items-center tw-justify-between">
          <span>
            <span className="tw-text-xs tw-text-iron-400">Add Metadata</span>{" "}
            <span className="tw-text-xs tw-text-iron-400">
              Required Metadata
            </span>
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
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="tw-size-5"
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
        <div className="tw-space-y-2 tw-w-full">
          {metadata.map((item, index) => (
            <CreateDropMetadataRow
              key={index}
              isError={missingRequiredMetadataKeys.includes(item.key)}
              metadata={item}
              index={index}
              onChangeKey={onChangeKey}
              onChangeValue={onChangeValue}
            />
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={onAddMetadata}
        className="tw-border-none tw-bg-transparent tw-p-0 tw-items-center tw-text-sm tw-font-medium tw-gap-x-1 tw-flex tw-text-primary-400 hover:tw-text-primary-300 tw-transition tw-duration-300 tw-ease-out"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
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
