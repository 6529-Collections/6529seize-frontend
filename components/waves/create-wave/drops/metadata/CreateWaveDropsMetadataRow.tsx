import { useState } from "react";
import {
  CreateWaveDropsRequiredMetadata,
  WaveRequiredMetadataType,
} from "../../../../../types/waves.types";
import CommonBorderedRadioButton from "../../../../utils/radio/CommonBorderedRadioButton";
import { CREATE_WAVE_DROPS_REQUIRED_METADATA_TYPES_LABELS } from "../../../../../helpers/waves/waves.constants";
import CreateWaveDropsMetadataRowType from "./CreateWaveDropsMetadataRowType";

export default function CreateWaveDropsMetadataRow({
  item,
  index,
  itemsCount,
  onItemChange,
  onItemRemove,
}: {
  readonly item: CreateWaveDropsRequiredMetadata;
  readonly index: number;
  readonly onItemChange: (args: {
    readonly index: number;
    readonly key: string;
    readonly type: WaveRequiredMetadataType;
  }) => void;
  readonly itemsCount: number;
  readonly onItemRemove: (index: number) => void;
}) {
  const onKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onItemChange({
      index,
      key: event.target.value,
      type: item.type,
    });
  };

  const onTypeChange = (type: WaveRequiredMetadataType) => {
    onItemChange({
      index,
      key: item.key,
      type,
    });
  };

  return (
    <div>
      <div className="tw-flex">
        <CreateWaveDropsMetadataRowType
          activeType={item.type}
          onTypeChange={onTypeChange}
        />
        <div className="tw-relative tw-w-full">
          <input
            type="text"
            value={item.key}
            onChange={onKeyChange}
            id={`required_metadata_key_${index}`}
            autoComplete="off"
            className={`${
              true
                ? "tw-ring-error focus:tw-border-error focus:tw-ring-error"
                : "tw-border-iron-650 tw-ring-iron-650  focus:tw-border-blue-500  focus:tw-ring-primary-400"
            } tw-form-input tw-block tw-px-4 tw-pb-3 tw-pt-4 tw-w-full tw-text-base tw-rounded-r-lg tw-border-0 tw-appearance-none tw-text-white focus:tw-border-blue-500 tw-peer tw-bg-iron-900 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out`}
            placeholder=" "
          />
          {itemsCount > 1 && (
            <div
              role="button"
              aria-label="Remove item"
              className="tw-text-iron-300 hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out"
              onClick={() => onItemRemove(index)}
            >
              <svg
                className="tw-top-4 tw-cursor-pointer tw-absolute tw-right-3 tw-h-5 tw-w-5"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17 7L7 17M7 7L17 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
          <label
            htmlFor={`required_metadata_key_${index}`}
            className="tw-absolute tw-cursor-text tw-text-base tw-font-normal tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
              peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
          >
            Name
          </label>
          <div className="tw-absolute tw-right-3 tw-top-3 tw-text-error">
            <svg
              className="tw-size-5 tw-flex-shrink-0 tw-text-error"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
      <div className="tw-ml-24">
        <span className="tw-relative tw-mt-1.5 tw-z-10 tw-text-error tw-text-xs tw-font-medium">
          Please enter metadata
        </span>
      </div>
    </div>
  );
}
