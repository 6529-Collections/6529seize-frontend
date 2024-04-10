import { DropMetadata } from "../../../../../entities/IDrop";

export default function CreateDropMetadataItem({
  item: { data_key, data_value },
  onMetadataRemove,
}: {
  readonly item: DropMetadata;
  readonly onMetadataRemove: (data_key: string) => void;
}) {
  return (
    <div className="tw-mt-2 tw-w-full tw-px-4 tw-py-2 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out">
      <div className="tw-flex tw-items-center tw-gap-x-3">
        <div className="tw-flex tw-items-center tw-justify-between tw-w-full tw-gap-x-1 tw-truncate">
          <p className="tw-mb-0 tw-max-w-xl tw-text-sm tw-font-medium tw-text-iron-50 tw-truncate">
            <b> {data_key}</b>: {data_value}
          </p>
          <div className="tw-h-8 tw-w-8 tw-flex tw-items-center tw-justify-center tw-border-0 tw-rounded-full tw-bg-transparent hover:tw-bg-iron-800 tw-transition tw-duration-300 tw-ease-out">
            <button
              onClick={() => onMetadataRemove(data_key)}
              aria-label="Remove file"
              className="tw-group tw-bg-transparent tw-border-none"
            >
              <svg
                className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-text-red group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out"
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
    </div>
  );
}
