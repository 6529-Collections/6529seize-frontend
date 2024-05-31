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

    </div>
  );
}
