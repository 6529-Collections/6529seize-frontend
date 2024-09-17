import React, { useState, useEffect } from "react";
import { CreateDropMetadataType } from "./CreateDropContent";

interface CreateDropMetadataRowProps {
  readonly metadata: CreateDropMetadataType;
  readonly isError: boolean;
  readonly index: number;
  readonly onChangeKey: (params: { index: number; newKey: string }) => void;
  readonly onChangeValue: (params: {
    index: number;
    newValue: string | number | null;
  }) => void;
}

const CreateDropMetadataRow: React.FC<CreateDropMetadataRowProps> = ({
  metadata,
  index,
  onChangeKey,
  onChangeValue,
  isError,
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
      // Allow only numbers, or a single minus sign at the start
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

  return (
    <div className="tw-gap-y-2 tw-w-full">
      <div className="tw-flex tw-items-center tw-gap-x-3 tw-w-full">
        <div className="tw-w-full">
          <input
            type="text"
            placeholder="Key"
            value={metadata.key}
            onChange={metadata.required ? undefined : handleKeyChange}
            readOnly={metadata.required}
            className={`tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset focus:tw-ring-1 focus:tw-ring-inset placeholder:tw-text-iron-500 tw-text-md tw-leading-6 tw-transition tw-duration-300 tw-ease-out tw-pl-3 tw-py-2.5 ${
              metadata.required
                ? "tw-cursor-not-allowed focus:tw-ring-iron-800 tw-bg-iron-800 tw-ring-iron-800"
                : "focus:tw-outline-none focus:tw-bg-iron-950 focus:tw-ring-primary-400 tw-bg-iron-900 tw-ring-iron-700"
            }`}
          />
        </div>
        <div className="tw-w-full">
          <input
            type="text"
            inputMode={metadata.type === "NUMBER" ? "numeric" : "text"}
            placeholder="Value"
            value={tempValue}
            onChange={handleValueChange}
            className={`tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-text-iron-50 tw-font-normal tw-caret-primary-400 tw-shadow-sm tw-ring-1 tw-ring-inset ${
              isError
                ? "tw-ring-red hover:tw-ring-red focus:tw-ring-red"
                : "tw-ring-iron-700 hover:tw-ring-iron-700 focus:tw-ring-primary-400"
            } placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-iron-950 focus:tw-ring-1 focus:tw-ring-inset tw-text-md tw-leading-6 tw-transition tw-duration-300 tw-ease-out tw-pl-3 tw-py-2.5`}
          />
        </div>
        <button
          type="button"
          aria-label="Remove"
          className="tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-p-2 tw-text-xs tw-font-medium tw-text-iron-400 hover:tw-text-error tw-bg-transparent tw-border-0 tw-transition tw-duration-300 tw-ease-out"
        >
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
            ></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CreateDropMetadataRow;
