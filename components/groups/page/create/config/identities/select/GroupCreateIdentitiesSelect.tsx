import { GROUP_CREATE_PANEL_STYLES } from "../../../GroupCreate.styles";
import GroupCreateIdentitiesSearch from "./GroupCreateIdentitiesSearch";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import GroupCreateIdentitySelectedItems from "@/components/groups/page/create/config/GroupCreateIdentitySelectedItems";
import type {
  CommunityMemberSearchSort,
  GroupCreateIdentitiesSearchAppearance,
  GroupCreateIdentitiesSearchResultsLayout,
} from "./GroupCreateIdentitiesSearchItems";

export default function GroupCreateIdentitiesSelect({
  onIdentitySelect,
  selectedIdentities,
  selectedWallets,
  onRemove,
  appearance = "default",
  resultsLayout = "popover",
  sort,
}: {
  readonly onIdentitySelect: (identity: CommunityMemberMinimal) => void;
  readonly selectedIdentities: CommunityMemberMinimal[];
  readonly selectedWallets: string[];
  readonly onRemove: (wallet: string) => void;
  readonly appearance?: GroupCreateIdentitiesSearchAppearance | undefined;
  readonly resultsLayout?: GroupCreateIdentitiesSearchResultsLayout | undefined;
  readonly sort?: CommunityMemberSearchSort | undefined;
}) {
  const isModal = appearance === "modal";

  return (
    <div className={isModal ? "tw-w-full" : GROUP_CREATE_PANEL_STYLES}>
      <div className="tw-flex tw-flex-col">
        <div
          className={isModal ? "tw-space-y-3" : "tw-space-y-2 sm:tw-space-y-3"}
        >
          <p
            className={
              isModal
                ? "tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100"
                : "tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50 sm:tw-text-lg"
            }
          >
            Search Identity
          </p>
          <GroupCreateIdentitiesSearch
            onIdentitySelect={onIdentitySelect}
            selectedWallets={selectedWallets}
            appearance={appearance}
            hideLabel={isModal}
            placeholder={isModal ? "Identity" : " "}
            resultsLayout={resultsLayout}
            sort={sort}
          />
        </div>
        <GroupCreateIdentitySelectedItems
          selectedIdentities={selectedIdentities}
          onRemove={onRemove}
          variant={isModal ? "inline" : "default"}
        />
      </div>
    </div>
  );
}
