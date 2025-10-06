import { ApiGroupOwnsNft } from "@/generated/models/ApiGroupOwnsNft";
import { NFTSearchResult } from "@/components/header/header-search/HeaderSearchModalItem";
import GroupCreateNftSearchItem from "./GroupCreateNftSearchItem";

export default function GroupCreateNftSearchItemsContent({
  loading,
  items,
  selected,
  onSelect,
}: {
  readonly loading: boolean;
  readonly items: NFTSearchResult[];
  readonly selected: ApiGroupOwnsNft[];
  readonly onSelect: (item: NFTSearchResult) => void;
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
          <GroupCreateNftSearchItem
            key={`${item.contract}_${item.id}`}
            item={item}
            selected={selected}
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
