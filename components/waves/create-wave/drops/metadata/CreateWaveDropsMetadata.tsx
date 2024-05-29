import { CreateWaveDropsRequiredMetadata } from "../../../../../types/waves.types";
import CreateWaveDropsMetadataAdd from "./CreateWaveDropsMetadataAdd";

export default function CreateWaveDropsMetadata({
  requiredMetadata,
  onRequiredMetadataChange,
  onRequiredMetadataRemove,
}: {
  readonly requiredMetadata: CreateWaveDropsRequiredMetadata[];
  readonly onRequiredMetadataChange: (
    metadata: CreateWaveDropsRequiredMetadata
  ) => void;
  readonly onRequiredMetadataRemove: (key: string) => void;
}) {
  return (
    <div>
      <p className="tw-mb-0 tw-text-xl tw-font-bold tw-text-iron-50">
        Required metadata
      </p>
      {requiredMetadata.map((metadata) => (
        <div key={metadata.key} className="tw-col-span-full">
          {metadata.key} - {metadata.type}
          <button onClick={() => onRequiredMetadataRemove(metadata.key)}>
            Remove
          </button>
        </div>
      ))}
      <CreateWaveDropsMetadataAdd
        onRequiredMetadataChange={onRequiredMetadataChange}
      />
      <div className="tw-mt-6 tw-text-right">
        <button
          type="button"
          className="tw-relative tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-2.5 tw-text-base tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
        >
          <span>Next step</span>
        </button>
      </div>
    </div>
  );
}
