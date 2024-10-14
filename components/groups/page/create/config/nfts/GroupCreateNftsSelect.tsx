import { ApiGroupOwnsNft } from "../../../../../../generated/models/ApiGroupOwnsNft";
import { NFTSearchResult } from "../../../../../header/header-search/HeaderSearchModalItem";
import GroupCreateNftSearch from "./GroupCreateNftSearch";

export default function GroupCreateNftsSelect({
  selected,
  onSelect,
}: {
  readonly selected: ApiGroupOwnsNft[];
  readonly onSelect: (item: NFTSearchResult) => void;
}) {
  return <GroupCreateNftSearch onSelect={onSelect} selected={selected} />;
}
