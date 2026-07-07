"use client";

import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { useAuth } from "@/components/auth/Auth";
import GroupCreateIdentitySelectedItems from "@/components/groups/page/create/config/GroupCreateIdentitySelectedItems";
import GroupCreateIdentitiesSearch from "@/components/groups/page/create/config/identities/select/GroupCreateIdentitiesSearch";
import type { GroupCreateIdentitiesSearchResultsLayout } from "@/components/groups/page/create/config/identities/select/GroupCreateIdentitiesSearchItems";
import { areEqualAddresses } from "@/helpers/Helpers";

export default function CreateWaveInlineGroupIdentities({
  identities,
  onIdentitySelect,
  onRemove,
  resultsLayout = "popover",
}: {
  readonly identities: readonly CommunityMemberMinimal[];
  readonly onIdentitySelect: (identity: CommunityMemberMinimal) => void;
  readonly onRemove: (wallet: string) => void;
  readonly resultsLayout?: GroupCreateIdentitiesSearchResultsLayout;
}) {
  const { connectedProfile } = useAuth();
  const selectedWallets = identities.map((identity) => identity.wallet);
  const currentUserIdentity: CommunityMemberMinimal | null =
    connectedProfile?.primary_wallet
      ? {
          profile_id: connectedProfile.id,
          handle: connectedProfile.handle,
          normalised_handle: connectedProfile.normalised_handle,
          primary_wallet: connectedProfile.primary_wallet,
          display: connectedProfile.display,
          tdh: connectedProfile.tdh,
          level: connectedProfile.level,
          cic_rating: connectedProfile.cic,
          wallet: connectedProfile.primary_wallet,
          pfp: connectedProfile.pfp,
        }
      : null;
  const isCurrentUserSelected =
    !!currentUserIdentity &&
    selectedWallets.some((wallet) =>
      areEqualAddresses(wallet, currentUserIdentity.wallet)
    );
  const identitiesHelperText =
    identities.length === 0
      ? "Add identities one by one to build this access group."
      : null;
  const showHelperRow = !!identitiesHelperText || !!currentUserIdentity;
  const showCurrentUserExcludedWarning =
    identities.length > 0 && !!currentUserIdentity && !isCurrentUserSelected;

  const onCurrentUserToggle = (checked: boolean) => {
    if (!currentUserIdentity) {
      return;
    }

    if (checked) {
      if (!isCurrentUserSelected) {
        onIdentitySelect(currentUserIdentity);
      }
      return;
    }

    if (isCurrentUserSelected) {
      onRemove(currentUserIdentity.wallet);
    }
  };

  return (
    <div className="tw-space-y-5">
      <div className="tw-space-y-4">
        <GroupCreateIdentitiesSearch
          selectedWallets={selectedWallets}
          onIdentitySelect={onIdentitySelect}
          placeholder="Search identities..."
          hideLabel={true}
          inputClassName="tw-border-white/5 tw-bg-iron-950 tw-ring-white/5 hover:tw-ring-white/10 focus:tw-border-primary-400 focus:tw-bg-iron-950 focus:tw-ring-primary-400"
          iconClassName="tw-top-3.5 tw-text-iron-500"
          resultsLayout={resultsLayout}
        />
        {showHelperRow && (
          <div
            className={`tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-px-1 ${
              identitiesHelperText ? "tw-justify-between" : "tw-justify-end"
            }`}
          >
            {identitiesHelperText && (
              <p className="tw-mb-0 tw-text-sm tw-font-normal tw-leading-relaxed tw-text-iron-500">
                {identitiesHelperText}
              </p>
            )}
            {currentUserIdentity && (
              <label className="tw-inline-flex tw-cursor-pointer tw-items-center tw-gap-x-2 sm:tw-gap-x-3">
                <span className="tw-text-xs tw-font-semibold tw-text-iron-50">
                  Include me
                </span>
                <span
                  className={`tw-rounded-full tw-bg-gradient-to-b tw-p-[1px] ${
                    isCurrentUserSelected
                      ? "tw-from-primary-300"
                      : "tw-from-iron-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    role="switch"
                    checked={isCurrentUserSelected}
                    onChange={(event) =>
                      onCurrentUserToggle(event.target.checked)
                    }
                    className="tw-peer tw-sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`tw-relative tw-flex tw-h-5 tw-w-9 tw-flex-shrink-0 tw-items-center tw-rounded-full tw-border-2 tw-border-transparent tw-p-0 tw-transition-colors tw-duration-200 tw-ease-in-out peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-500 peer-focus-visible:tw-ring-offset-2 ${
                      isCurrentUserSelected
                        ? "tw-bg-primary-500"
                        : "tw-bg-iron-700"
                    }`}
                  >
                    <span
                      className={`tw-pointer-events-none tw-inline-block tw-size-4 tw-transform tw-rounded-full tw-bg-iron-50 tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out ${
                        isCurrentUserSelected
                          ? "tw-translate-x-[18px]"
                          : "tw-translate-x-0"
                      }`}
                    />
                  </span>
                </span>
              </label>
            )}
          </div>
        )}
      </div>
      {identities.length > 0 && (
        <GroupCreateIdentitySelectedItems
          selectedIdentities={[...identities]}
          onRemove={onRemove}
          variant="inline"
        />
      )}
      {showCurrentUserExcludedWarning && (
        <p
          role="status"
          aria-live="polite"
          className="tw-mb-0 tw-rounded-lg tw-border tw-border-solid tw-border-[#fef08a]/20 tw-bg-[#fef08a]/10 tw-px-3 tw-py-2 tw-text-xs tw-font-medium tw-leading-relaxed tw-text-[#fef08a]"
        >
          Warning: You are not included in this group. If it controls who can
          view the wave, you may not be able to access the wave after creating
          it.
        </p>
      )}
    </div>
  );
}
