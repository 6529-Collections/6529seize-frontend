"use client";

import React, { useState, useEffect } from "react";
import { ApiWaveMetadataType } from "@/generated/models/ApiWaveMetadataType";
import type { CreateDropMetadataType } from "./CreateDropContent";
import { Tooltip } from "react-tooltip";

interface CreateDropMetadataRowProps {
  readonly metadata: CreateDropMetadataType;
  readonly isError: boolean;
  readonly errorMessage: string | null;
  readonly index: number;
  readonly disabled: boolean;
  readonly onChangeKey: (params: { index: number; newKey: string }) => void;
  readonly onChangeValue: (params: {
    index: number;
    newValue: string | number | null;
  }) => void;
  readonly onRemove: (index: number) => void;
}

const CreateDropMetadataRow: React.FC<CreateDropMetadataRowProps> = ({
  metadata,
  index,
  onChangeKey,
  onChangeValue,
  isError,
  errorMessage,
  onRemove,
  disabled,
}) => {
  const [tempValue, setTempValue] = useState<string>(
    metadata.value !== null ? String(metadata.value) : ""
  );

  useEffect(() => {
    setTempValue(metadata.value !== null ? String(metadata.value) : "");
  }, [metadata.value]);

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeKey({ index, newKey: e.target.value });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (metadata.type === "NUMBER") {
      if (
        newValue === "" ||
        newValue === "-" ||
        /^-?\d*\.?\d*$/.test(newValue)
      ) {
        setTempValue(newValue);
        if (newValue === "" || newValue === "-") {
          onChangeValue({ index, newValue: null });
        } else {
          const numValue = parseFloat(newValue);
          onChangeValue({ index, newValue: numValue });
        }
      }
    } else {
      setTempValue(newValue);
      onChangeValue({ index, newValue });
    }
  };

  const isInputDisabled = disabled || metadata.required;
  const hasKeyError = !!errorMessage;
  let keyInputStateClasses =
    "tw-bg-iron-900 tw-pl-3 tw-text-iron-50 tw-ring-iron-700 focus:tw-bg-iron-950 focus:tw-outline-none focus:tw-ring-primary-400";

  if (isInputDisabled) {
    keyInputStateClasses =
      "tw-cursor-not-allowed tw-bg-iron-800 tw-pl-9 tw-text-iron-400 tw-ring-iron-700 focus:tw-ring-iron-700";
  } else if (hasKeyError) {
    keyInputStateClasses =
      "tw-bg-iron-900 tw-pl-3 tw-text-iron-50 tw-ring-red focus:tw-bg-iron-950 focus:tw-outline-none focus:tw-ring-red";
  }

  return (
    <div className="tw-w-full">
      <div className="tw-flex tw-w-full tw-items-center tw-gap-x-3">
        <div className="tw-flex tw-w-full tw-items-center tw-gap-x-3 tw-gap-y-2">
          <div className="tw-relative tw-w-full">
            <input
              type="text"
              placeholder="Key"
              value={metadata.key}
              onChange={isInputDisabled ? undefined : handleKeyChange}
              readOnly={isInputDisabled}
              disabled={disabled}
              className={`tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-text-base tw-font-normal tw-leading-6 tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 focus:tw-ring-1 focus:tw-ring-inset sm:tw-text-md ${keyInputStateClasses} tw-py-2.5`}
            />
            {metadata.required &&
              (metadata.type === ApiWaveMetadataType.Number ? (
                <svg
                  className="tw-absolute tw-left-3 tw-top-[15px] tw-size-3.5 tw-flex-shrink-0 tw-text-iron-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 256 512"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M160 64c0-11.8-6.5-22.6-16.9-28.2s-23-5-32.8 1.6l-96 64C-.5 111.2-4.4 131 5.4 145.8s29.7 18.7 44.4 8.9L96 123.8V416H32c-17.7 0-32 14.3-32 32s14.3 32 32 32h96 96c17.7 0 32-14.3 32-32s-14.3-32-32-32H160V64z"
                  ></path>
                </svg>
              ) : (
                <svg
                  className="tw-absolute tw-left-3 tw-top-3.5 tw-size-4 tw-flex-shrink-0 tw-text-iron-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 7C4 6.06812 4 5.60218 4.15224 5.23463C4.35523 4.74458 4.74458 4.35523 5.23463 4.15224C5.60218 4 6.06812 4 7 4H17C17.9319 4 18.3978 4 18.7654 4.15224C19.2554 4.35523 19.6448 4.74458 19.8478 5.23463C20 5.60218 20 6.06812 20 7M9 20H15M12 4V20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
              ))}
          </div>
          <div className="tw-w-full">
            <input
              type="text"
              inputMode={
                metadata.type === ApiWaveMetadataType.Number
                  ? "numeric"
                  : "text"
              }
              placeholder="Value"
              value={tempValue}
              onChange={disabled ? undefined : handleValueChange}
              readOnly={disabled}
              disabled={disabled}
              className={`tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-text-base tw-font-normal tw-text-iron-50 tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset sm:tw-text-md ${
                isError
                  ? "tw-bg-iron-950 tw-ring-red hover:tw-ring-red focus:tw-ring-red"
                  : "tw-ring-iron-700 hover:tw-ring-iron-700 focus:tw-ring-primary-400"
              } tw-py-2.5 tw-pl-3 tw-text-base tw-leading-6 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 focus:tw-bg-iron-950 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset sm:tw-text-md ${
                disabled ? "tw-cursor-not-allowed tw-opacity-50" : ""
              }`}
            />
          </div>
        </div>
        <>
          <div>
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label={metadata.required ? "Required field" : "Remove"}
              disabled={disabled || metadata.required}
              className={`tw-group -tw-ml-2 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-2 tw-text-xs tw-font-medium tw-transition tw-duration-300 tw-ease-out ${
                disabled || metadata.required
                  ? "tw-cursor-not-allowed tw-text-iron-600"
                  : "tw-text-iron-400 hover:tw-text-error"
              }`}
              data-tooltip-id={`metadata-action-${metadata.id}`}
            >
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
                ></path>
              </svg>
            </button>
          </div>
          <Tooltip
            id={`metadata-action-${metadata.id}`}
            style={{
              backgroundColor: "#1F2937",
              color: "white",
              padding: "4px 8px",
            }}
          >
            {metadata.required ? "Required field" : "Remove"}
          </Tooltip>
        </>
      </div>
      {errorMessage && (
        <div className="tw-pl-1 tw-pt-1 tw-text-xs tw-font-medium tw-text-error">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default CreateDropMetadataRow;
