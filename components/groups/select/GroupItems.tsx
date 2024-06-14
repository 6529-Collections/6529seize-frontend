import { GroupFull } from "../../../generated/models/GroupFull";
import GroupItem from "./item/GroupItem";

export default function GroupItems({
  groups,

}: {
  readonly groups: GroupFull[];

}) {
  return (
    <div className="tw-space-y-4">
      {groups.map((group) => (
        <GroupItem key={group.id} group={group} />
      ))}
    </div>
  );
}
