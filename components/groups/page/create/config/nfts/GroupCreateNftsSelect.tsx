import type { ApiGroupOwnsNft } from "@/generated/models/ApiGroupOwnsNft";
import type { NFTSearchResult } from "@/components/header/header-search/HeaderSearchModalItem";
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
