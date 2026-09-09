import type { AllowlistDescription } from "@/components/allowlist-tool/allowlist-tool.types";
import EmmaListSearchItem from "./EmmaListSearchItem";

export default function EmmaListSearchItemsContent({
  selectedId,
  loading,
  items,
  onSelect,
  loadingLabel = "Loading...",
  noResultsLabel = "No results",
}: {
  readonly selectedId: string | null;
  readonly loading: boolean;
  readonly items: AllowlistDescription[];
  readonly onSelect: (item: AllowlistDescription) => void;
  readonly loadingLabel?: string;
  readonly noResultsLabel?: string;
}) {
  if (loading) {
    return (
      <li className="tw-relative tw-flex tw-h-full tw-w-full tw-select-none tw-items-center tw-justify-between tw-rounded-lg tw-px-2 tw-py-2 tw-text-sm tw-font-medium tw-text-white">
        {loadingLabel}
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
    <li className="tw-relative tw-flex tw-h-full tw-w-full tw-select-none tw-items-center tw-justify-between tw-rounded-lg tw-px-2 tw-py-2 tw-text-sm tw-font-medium tw-text-white">
      {noResultsLabel}
    </li>
  );
}
