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
      <p className="tw-mb-0 tw-text-2xl tw-font-bold tw-text-iron-50">
        Required metadata
      </p>
      <CreateWaveDropsMetadataAdd
        onRequiredMetadataChange={onRequiredMetadataChange}
      />
    </div>
  );
}
