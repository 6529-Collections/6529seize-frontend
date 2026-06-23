import type { DropMetadata } from "@/entities/IDrop";

export default function CreateDropMetadataItem({
  item: { data_key, data_value },
  onMetadataRemove,
  disabled = false,
}: {
  readonly item: DropMetadata;
  readonly onMetadataRemove: (data_key: string) => void;
  readonly disabled?: boolean | undefined;
}) {
  return (
    <div className="tw-rounded-lg tw-px-3 tw-py-1 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out hover:tw-ring-iron-600">
      <div className="tw-flex tw-items-center tw-gap-x-3">
        <div className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-x-2 tw-truncate">
          <p className="tw-mb-0 tw-max-w-xl tw-truncate tw-text-sm tw-font-medium tw-text-iron-50">
            <span className="tw-font-bold"> {data_key}</span>: {data_value}
          </p>
          <button
            onClick={() => {
              if (!disabled) {
                onMetadataRemove(data_key);
              }
            }}
            aria-label="Remove file"
            disabled={disabled}
            type="button"
            className="tw-group tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-p-1.5 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-800"
          >
            <svg
              className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-red tw-transition tw-duration-300 tw-ease-out group-hover:tw-scale-110"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
