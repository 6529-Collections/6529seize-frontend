import { useState } from "react";
import {
  CreateWaveDropsRequiredMetadata,
  WaveRequiredMetadataType,
} from "../../../../../types/waves.types";
import CommonBorderedRadioButton from "../../../../utils/radio/CommonBorderedRadioButton";
import { CREATE_WAVE_DROPS_REQUIRED_METADATA_TYPES_LABELS } from "../../../../../helpers/waves/waves.constants";

export default function CreateWaveDropsMetadataAdd({
  onRequiredMetadataChange,
}: {
  readonly onRequiredMetadataChange: (
    metadata: CreateWaveDropsRequiredMetadata
  ) => void;
}) {
  const [selectedType, setSelectedType] = useState<WaveRequiredMetadataType>(
    WaveRequiredMetadataType.STRING
  );
  const [key, setKey] = useState<string>("");

  const onKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setKey(event.target.value);
  };

  const onAddRequiredMetadata = () => {
    onRequiredMetadataChange({
      key,
      type: selectedType,
    });
    setSelectedType(WaveRequiredMetadataType.STRING);
    setKey("");
  };

  return (
    <div className="tw-mt-4 tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-4">
      <div className="tw-col-span-full tw-flex tw-flex-col tw-gap-y-2">
        {/*  {Object.values(WaveRequiredMetadataType).map((type) => (
          <CommonBorderedRadioButton
            key={type}
            type={type}
            selected={selectedType}
            label={CREATE_WAVE_DROPS_REQUIRED_METADATA_TYPES_LABELS[type]}
            onChange={setSelectedType}
          />
        ))} */}
        <div className="tw-flex">
          <span className="tw-isolate tw-inline-flex tw-rounded-lg tw-shadow-sm">
            <button
              title="Text"
              className="tw-flex-shrink-0 tw-z-10 tw-ring-1 tw-ring-inset tw-ring-primary-400 tw-bg-[#202B45] tw-rounded-l-lg tw-text-primary-400 tw-whitespace-nowrap tw-flex-1 sm:tw-flex-none tw-w-12 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-border-0 tw-transition-all tw-duration-300 tw-ease-out"
              type="button"
            >
              <svg
                className="tw-h-5 tw-w-5"
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
                />
              </svg>
            </button>
            <button
              title="Number"
              className="tw-flex-shrink-0 -tw-ml-px focus:tw-z-10 tw-ring-1 tw-ring-inset tw-ring-iron-600 tw-bg-iron-900 hover:tw-bg-iron-800 tw-text-iron-300 tw-whitespace-nowrap tw-flex-1 sm:tw-flex-none tw-w-12 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-border-0 tw-transition-all tw-duration-300 tw-ease-out"
              type="button"
            >
              <svg
                className="tw-h-4 tw-w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 256 512"
                aria-hidden="true"
              >
                {/* !Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. */}
                <path
                  fill="currentColor"
                  d="M160 64c0-11.8-6.5-22.6-16.9-28.2s-23-5-32.8 1.6l-96 64C-.5 111.2-4.4 131 5.4 145.8s29.7 18.7 44.4 8.9L96 123.8V416H32c-17.7 0-32 14.3-32 32s14.3 32 32 32h96 96c17.7 0 32-14.3 32-32s-14.3-32-32-32H160V64z"
                />
              </svg>
            </button>
          </span>
          <div className="tw-relative tw-w-full -tw-ml-px">
            <input
              type="text"
              value={key}
              onChange={onKeyChange}
              id="required_metadata_key"
              autoComplete="off"
              className="tw-form-input tw-block tw-px-4 tw-pb-3 tw-pt-4 tw-w-full tw-text-base tw-rounded-r-lg tw-border-0 tw-appearance-none tw-text-white tw-border-iron-600 focus:tw-border-blue-500 tw-peer
     tw-py-3 tw-pl-4 tw-pr-4 tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
              placeholder=" "
            />
            <label
              htmlFor="required_metadata_key"
              className="tw-absolute tw-cursor-text tw-text-base tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 peer-hover:tw-bg-iron-800 peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 
              peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1"
            >
              Name
            </label>
          </div>
        </div>
        <div className="tw-flex tw-justify-center">
          <button
            type="button"
            onClick={onAddRequiredMetadata}
            className="tw-py-1 tw-px-2 tw-bg-transparent tw-border-0 tw-flex tw-items-center tw-gap-x-2 tw-text-sm tw-text-iron-400 tw-font-medium hover:tw-text-iron-50 tw-transition tw-duration-300 tw-ease-out"
          >
            <svg
              className="tw-h-5 tw-w-5 tw-flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 5V19M5 12H19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Add more</span>
          </button>
        </div>
      </div>
    </div>
  );
}
