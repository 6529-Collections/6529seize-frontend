import { DropMetadata } from "../../../../../entities/IDrop";
import CreateDropMetadataItem from "./CreateDropMetadataItem";

export default function CreateDropMetadataItems({
  items,
  onMetadataRemove,
}: {
  readonly items: DropMetadata[];
  readonly onMetadataRemove: (data_key: string) => void;
}) {
  return (
    <div className="tw-space-x-2">
      {items.map((item) => (
        <CreateDropMetadataItem
          key={item.data_key}
          item={item}
          onMetadataRemove={onMetadataRemove}
        />
      ))}
    </div>
  );
}
