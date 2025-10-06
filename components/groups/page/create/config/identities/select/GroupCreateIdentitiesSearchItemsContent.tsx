import { CommunityMemberMinimal } from "@/entities/IProfile";
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
      <li className="tw-py-2 tw-w-full tw-h-full tw-flex tw-items-center tw-justify-between tw-text-sm tw-font-medium tw-text-white tw-rounded-lg tw-relative tw-select-none tw-px-2">
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
    <li className="tw-py-2 tw-w-full tw-h-full tw-flex tw-items-center tw-justify-between tw-text-sm tw-font-medium tw-text-white tw-rounded-lg tw-relative tw-select-none tw-px-2">
      No results
    </li>
  );
}
