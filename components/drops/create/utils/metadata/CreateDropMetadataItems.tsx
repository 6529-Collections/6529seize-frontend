import type { DropMetadata } from "@/entities/IDrop";
import CreateDropMetadataItem from "./CreateDropMetadataItem";

export default function CreateDropMetadataItems({
  items,
  onMetadataRemove,
  disabled = false,
}: {
  readonly items: DropMetadata[];
  readonly onMetadataRemove: (data_key: string) => void;
  readonly disabled?: boolean | undefined;
}) {
  return (
    <div className="tw-mb-3 tw-flex tw-flex-wrap tw-gap-x-2 tw-gap-y-2 lg:tw-mt-2">
      {items.map((item) => (
        <CreateDropMetadataItem
          key={item.data_key}
          item={item}
          onMetadataRemove={onMetadataRemove}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
