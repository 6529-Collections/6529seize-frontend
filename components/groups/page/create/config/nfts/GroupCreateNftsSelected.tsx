import {
  GroupOwnsNft,
  GroupOwnsNftNameEnum,
} from "../../../../../../generated/models/GroupOwnsNft";
import GroupCreateNftsSelectedItem from "./GroupCreateNftsSelectedItem";

export default function GroupCreateNftsSelected({
  selected,
  onRemove,
}: {
  readonly selected: GroupOwnsNft[];
  readonly onRemove: ({
    name,
    token,
  }: {
    name: GroupOwnsNftNameEnum;
    token: string;
  }) => void;
}) {
  return (
    <div className="tw-flex tw-flex-wrap tw-gap-2 tw-mt-3">
      {selected.flatMap((group) =>
        group.tokens.map((token) => (
          <GroupCreateNftsSelectedItem
            key={`${group.name}-${token}`}
            nft={{ name: group.name, token }}
            onRemove={() => onRemove({ name: group.name, token })}
          />
        ))
      )}
    </div>
  );
}
