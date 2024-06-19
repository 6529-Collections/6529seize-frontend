import { GroupFull } from "../../../generated/models/GroupFull";
import GroupItem from "../../groups/select/item/GroupItem";

export default function SelectGroupModalItems({
  groups,
  onGroupSelect,
}: {
  readonly groups: GroupFull[];
  readonly onGroupSelect: (group: GroupFull) => void;
}) {
  return (
    <ul className="tw-list-none tw-pl-0 tw-gap-y-4 tw-flex tw-flex-col">
      {groups.map((group) => (
        <GroupItem
          key={group.id}
          group={group}
          activeGroupId={null}
          onActiveGroupId={() => onGroupSelect(group)}
        />
      ))}
    </ul>
  );
}
