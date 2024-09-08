import GroupCreateIdentitiesSearch from "./GroupCreateIdentitiesSearch";
import { CommunityMemberMinimal } from "../../../../../../../entities/IProfile";
import GroupCreateIdentitySelectedItems from "../GroupCreateIdentitySelectedItems";

export default function GroupCreateIdentitiesSelect({
  onIdentitySelect,
  selectedIdentities,
  selectedWallets,
}: {
  readonly onIdentitySelect: (identity: CommunityMemberMinimal) => void;
  readonly selectedIdentities: CommunityMemberMinimal[];
  readonly selectedWallets: string[];
}) {
  return (
    <div className="tw-p-5 tw-bg-iron-900 tw-rounded-xl tw-shadow tw-border tw-border-solid tw-border-iron-800">
      <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
        Search Identity
      </p>
      <div className="tw-mt-4">
        <GroupCreateIdentitiesSearch
          onIdentitySelect={onIdentitySelect}
          selectedWallets={selectedWallets}
        />
      </div>

      <GroupCreateIdentitySelectedItems
        selectedIdentities={selectedIdentities}
      />
    </div>
  );
}
