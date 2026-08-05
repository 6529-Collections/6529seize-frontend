import type { CommunityMemberMinimal } from "@/entities/IProfile";
import GroupCreateIdentitiesSearchItem from "./GroupCreateIdentitiesSearchItem";

export default function GroupCreateIdentitiesSearchItemsContent({
  selectedWallets,
  loading,
  items,
  onSelect,
}: {
  readonly selectedWallets: string[];
  readonly loading: boolean;
  readonly items: CommunityMemberMinimal[];
  readonly onSelect: (item: CommunityMemberMinimal) => void;
}) {
  if (loading) {
    return (
      <li className="tw-relative tw-flex tw-min-h-10 tw-w-full tw-select-none tw-items-center tw-px-2.5 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-400">
        Loading...
      </li>
    );
  }

  if (items.length) {
    return (
      <>
        {items.map((item) => (
          <GroupCreateIdentitiesSearchItem
            key={item.wallet}
            item={item}
            selected={selectedWallets.includes(item.wallet)}
            onProfileSelect={onSelect}
          />
        ))}
      </>
    );
  }

  return (
    <li className="tw-relative tw-flex tw-min-h-10 tw-w-full tw-select-none tw-items-center tw-px-2.5 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-400">
      No results
    </li>
  );
}
