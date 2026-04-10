"use client";

import type { CommunityMemberMinimal } from "@/entities/IProfile";
import GroupCreateIdentitySelectedItems from "@/components/groups/page/create/config/GroupCreateIdentitySelectedItems";
import GroupCreateIdentitiesSearch from "@/components/groups/page/create/config/identities/select/GroupCreateIdentitiesSearch";

export default function CreateWaveInlineGroupIdentities({
  identities,
  onIdentitySelect,
  onRemove,
}: {
  readonly identities: readonly CommunityMemberMinimal[];
  readonly onIdentitySelect: (identity: CommunityMemberMinimal) => void;
  readonly onRemove: (wallet: string) => void;
}) {
  const selectedWallets = identities.map((identity) => identity.wallet);

  return (
    <div className="tw-space-y-3">
      <GroupCreateIdentitiesSearch
        selectedWallets={selectedWallets}
        onIdentitySelect={onIdentitySelect}
      />
      {identities.length ? (
        <GroupCreateIdentitySelectedItems
          selectedIdentities={[...identities]}
          onRemove={onRemove}
        />
      ) : (
        <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
          Add identities one by one. Each selected identity becomes part of the
          new group.
        </p>
      )}
    </div>
  );
}
