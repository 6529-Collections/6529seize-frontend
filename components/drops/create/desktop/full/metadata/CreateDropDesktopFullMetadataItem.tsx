export default function CreateDropDesktopFullMetadataItem({
  item: { key, value },
  onMetadataRemove,
}: {
  readonly item: { readonly key: string; readonly value: string };
  readonly onMetadataRemove: (key: string) => void;
}) {
  return (
    <div className="tw-p-1 tw-bg-neutral-400 tw-rounded-md tw-justify-between tw-inline-flex tw-space-x-2">
      <div>
        {key}: {value}
      </div>
      <button className="tw-text-red" onClick={() => onMetadataRemove(key)}>
        X
      </button>
    </div>
  );
}