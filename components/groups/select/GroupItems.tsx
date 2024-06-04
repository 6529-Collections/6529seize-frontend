import { GroupFull } from "../../../generated/models/GroupFull";
import GroupItem from "./item/GroupItem";

export default function GroupItems({
  groups,
  onEditClick,
}: {
  readonly groups: GroupFull[];
  readonly onEditClick: (filter: GroupFull) => void;
}) {
  return (
    <div className="tw-space-y-4">
      {groups.map((group) => (
        <GroupItem key={group.id} group={group} onEditClick={onEditClick} />
      ))}
    </div>
  );
}
