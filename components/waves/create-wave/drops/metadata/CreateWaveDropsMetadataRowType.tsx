import { ApiWaveMetadataType } from "../../../../../generated/models/ApiWaveMetadataType";

export default function CreateWaveDropsMetadataRowType({
  activeType,
  onTypeChange,
}: {
  readonly activeType: ApiWaveMetadataType;
  readonly onTypeChange: (type: ApiWaveMetadataType) => void;
}) {
  const activeClasses =
    "tw-ring-primary-400 tw-bg-[#202B45] tw-text-primary-400 tw-z-10";
  const inactiveClasses =
    "tw-ring-iron-650 tw-bg-iron-900 hover:tw-bg-iron-800 tw-text-iron-300";

  const STRING_CLASSES =
    activeType === ApiWaveMetadataType.String ? activeClasses : inactiveClasses;
  const NUMBER_CLASSES =
    activeType === ApiWaveMetadataType.Number ? activeClasses : inactiveClasses;
  return (
    <span className="tw-isolate tw-inline-flex tw-rounded-lg tw-shadow-sm">
      <button
        onClick={() => onTypeChange(ApiWaveMetadataType.String)}
        title="Text"
        className={`${STRING_CLASSES} tw-flex-shrink-0 tw-ring-1 tw-ring-inset focus:tw-z-10 tw-rounded-l-lg tw-whitespace-nowrap tw-flex-1 sm:tw-flex-none tw-w-12 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-border-0 tw-transition-all tw-duration-300 tw-ease-out`}
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
        onClick={() => onTypeChange(ApiWaveMetadataType.Number)}
        title="Number"
        className={`${NUMBER_CLASSES} tw-flex-shrink-0 -tw-ml-px focus:tw-z-10 tw-ring-1 tw-ring-inset tw-whitespace-nowrap tw-flex-1 sm:tw-flex-none tw-w-12 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-border-0 tw-transition-all tw-duration-300 tw-ease-out`}
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
  );
}
