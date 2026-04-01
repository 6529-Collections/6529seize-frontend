import type { ApiWaveMetadataType } from "@/generated/models/ApiWaveMetadataType";
import type { CreateWaveDropsRequiredMetadata } from "@/types/waves.types";
import CreateWaveDropsMetadataRowType from "./CreateWaveDropsMetadataRowType";

export default function CreateWaveDropsMetadataRow({
  item,
  index,
  errorMessage,
  onItemChange,
  onItemRemove,
}: {
  readonly item: CreateWaveDropsRequiredMetadata;
  readonly index: number;
  readonly errorMessage: string | null;
  readonly onItemChange: (args: {
    readonly index: number;
    readonly key: string;
    readonly type: ApiWaveMetadataType;
  }) => void;
  readonly onItemRemove: (index: number) => void;
}) {
  const onKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onItemChange({
      index,
      key: event.target.value,
      type: item.type,
    });
  };

  const onTypeChange = (type: ApiWaveMetadataType) => {
    onItemChange({
      index,
      key: item.key,
      type,
    });
  };

  const hasError = !!errorMessage;

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
              hasError
                ? "tw-border-error tw-ring-error focus:tw-border-error focus:tw-ring-error"
                : "tw-border-iron-650 tw-ring-iron-650 focus:tw-border-blue-500 focus:tw-ring-primary-400"
            } tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-r-lg tw-border-0 tw-px-4 tw-pb-3 tw-pt-4 tw-text-base ${
              item.key
                ? "tw-text-primary-400 focus:tw-text-white"
                : "tw-text-white"
            } tw-peer tw-bg-iron-900 tw-font-medium tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset`}
            placeholder=" "
          />
          <button
            type="button"
            aria-label="Remove item"
            className="tw-absolute tw-right-3 tw-top-4 tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-400"
            onClick={() => onItemRemove(index)}
          >
            <svg
              className="tw-h-5 tw-w-5"
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
          </button>
          <label
            htmlFor={`required_metadata_key_${index}`}
            className={`${
              hasError
                ? "tw-text-error peer-focus:tw-text-error"
                : "tw-text-iron-500 peer-focus:tw-text-primary-400"
            } tw-absolute tw-start-1 tw-top-2 tw-z-10 tw-origin-[0] -tw-translate-y-4 tw-scale-75 tw-transform tw-cursor-text tw-bg-iron-900 tw-px-2 tw-text-base tw-font-normal tw-duration-300 peer-placeholder-shown:tw-top-1/2 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-scale-100 peer-focus:tw-top-2 peer-focus:-tw-translate-y-4 peer-focus:tw-scale-75 peer-focus:tw-bg-iron-900 peer-focus:tw-px-2 rtl:peer-focus:tw-left-auto rtl:peer-focus:tw-translate-x-1/4`}
          >
            Name
          </label>
        </div>
      </div>
      {errorMessage && (
        <div className="tw-ml-24">
          <div className="tw-pt-1.5 tw-text-xs tw-font-medium tw-text-error">
            <div className="tw-flex tw-items-center tw-gap-x-2">
              <svg
                className="tw-size-5 tw-flex-shrink-0 tw-text-error"
                viewBox="0 0 24 24"
                fill="none"
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
              <span>{errorMessage}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
