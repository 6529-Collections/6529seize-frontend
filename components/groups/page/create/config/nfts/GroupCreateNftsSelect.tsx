import { GroupOwnsNft } from "../../../../../../generated/models/GroupOwnsNft";
import { NFTSearchResult } from "../../../../../header/header-search/HeaderSearchModalItem";
import GroupCreateNftSearch from "./GroupCreateNftSearch";

export default function GroupCreateNftsSelect({
  selected,
  onSelect,
}: {
  readonly selected: GroupOwnsNft[];
  readonly onSelect: (item: NFTSearchResult) => void;
}) {
  return (
    <div className="tw-p-5 tw-bg-iron-900 tw-rounded-xl tw-shadow tw-border tw-border-solid tw-border-iron-800">
      <p className="tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-50">
        Search NFT&apos;s
      </p>
      <div className="tw-mt-4">
        <GroupCreateNftSearch onSelect={onSelect} selected={selected} />
      </div>

      {/* <GroupCreateIdentitySelectedItems
    selectedIdentities={selectedIdentities}
  /> */}
    </div>
  );
}
