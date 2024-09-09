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
  return <GroupCreateNftSearch onSelect={onSelect} selected={selected} />;
}
