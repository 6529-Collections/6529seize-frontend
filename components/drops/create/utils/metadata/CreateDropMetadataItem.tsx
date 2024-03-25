import { DropMetadata } from "../../../../../entities/IDrop";

export default function CreateDropMetadataItem({
  item: { data_key, data_value },
  onMetadataRemove,
}: {
  readonly item: DropMetadata;
  readonly onMetadataRemove: (data_key: string) => void;
}) {
  return (
    <div className="tw-p-1 tw-bg-neutral-400 tw-rounded-md tw-justify-between tw-inline-flex tw-space-x-2">
      <div>
        {data_key}: {data_value}
      </div>
      <button
        className="tw-text-red"
        onClick={() => onMetadataRemove(data_key)}
      >
        X
      </button>
    </div>
  );
}
