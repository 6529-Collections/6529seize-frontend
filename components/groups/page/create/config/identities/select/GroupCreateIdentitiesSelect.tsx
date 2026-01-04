import GroupCreateIdentitiesSearch from "./GroupCreateIdentitiesSearch";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import GroupCreateIdentitySelectedItems from "@/components/groups/page/create/config/GroupCreateIdentitySelectedItems";

export default function GroupCreateIdentitiesSelect({
  onIdentitySelect,
  selectedIdentities,
  selectedWallets,
  onRemove,
}: {
  readonly onIdentitySelect: (identity: CommunityMemberMinimal) => void;
  readonly selectedIdentities: CommunityMemberMinimal[];
  readonly selectedWallets: string[];
  readonly onRemove: (wallet: string) => void;
}) {
  return (
    <div className="tw-p-3 sm:tw-p-5 tw-bg-iron-950 tw-rounded-xl tw-shadow tw-border tw-border-solid tw-border-iron-800">
      <div className="tw-flex tw-flex-col">
        <div className="tw-space-y-2 sm:tw-space-y-3">
          <p className="tw-mb-0 tw-text-base sm:tw-text-lg tw-font-semibold tw-text-iron-50">
            Search Identity
          </p>
          <GroupCreateIdentitiesSearch
            onIdentitySelect={onIdentitySelect}
            selectedWallets={selectedWallets}
          />
        </div>
        <GroupCreateIdentitySelectedItems
          selectedIdentities={selectedIdentities}
          onRemove={onRemove}
        />
      </div>
    </div>
  );
}
