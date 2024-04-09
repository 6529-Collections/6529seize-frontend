import { DropMetadata } from "../../../../../entities/IDrop";

export default function CreateDropMetadataItem({
  item: { data_key, data_value },
  onMetadataRemove,
}: {
  readonly item: DropMetadata;
  readonly onMetadataRemove: (data_key: string) => void;
}) {
  return (
    <button
      onClick={() => onMetadataRemove(data_key)}
      type="button"
      className="tw-border-0 tw-group tw-inline-flex tw-items-center tw-justify-between tw-gap-x-2 tw-rounded-lg tw-px-3 tw-py-1 tw-text-sm tw-font-normal tw-text-iron-200 tw-bg-iron-400/10 tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600 tw-transition tw-duration-300 tw-ease-out"
    >
      <span>
        <b> {data_key}</b>: {data_value}
      </span>
      <svg
        className="-tw-mr-0.5 tw-w-6 tw-h-6 tw-shrink-0 tw-text-red group-hover:tw-scale-110 tw-transition tw-duration-300 tw-ease-out"
        viewBox="0 0 24 24"
        fill="none"
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
  );
}
