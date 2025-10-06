import { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
import EmmaListSearchItem from "./EmmaListSearchItem";

export default function EmmaListSearchItemsContent({
  selectedId,
  loading,
  items,
  onSelect,
}: {
  readonly selectedId: string | null;
  readonly loading: boolean;
  readonly items: AllowlistDescription[];
  readonly onSelect: (item: AllowlistDescription) => void;
}) {
  if (loading) {
    return (
      <li className="tw-py-2 tw-w-full tw-h-full tw-flex tw-items-center tw-justify-between tw-text-sm tw-font-medium tw-text-white tw-rounded-lg tw-relative tw-select-none tw-px-2">
        Loading...
      </li>
    );
  }

  if (items.length) {
    return (
      <>
        {items.map((item) => (
          <EmmaListSearchItem
            key={item.id}
            item={item}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
      </>
    );
  }

  return (
    <li className="tw-py-2 tw-w-full tw-h-full tw-flex tw-items-center tw-justify-between tw-text-sm tw-font-medium tw-text-white tw-rounded-lg tw-relative tw-select-none tw-px-2">
      No results
    </li>
  );
}
