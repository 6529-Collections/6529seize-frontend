import { useDispatch, useSelector } from "react-redux";
import { GroupFull } from "../../../generated/models/GroupFull";
import GroupItem from "./item/GroupItem";
import { selectActiveGroupId, setActiveGroupId } from "../../../store/groupSlice";

export default function GroupItems({
  groups,
}: {
  readonly groups: GroupFull[];
}) {
  const activeGroupId = useSelector(selectActiveGroupId);
  const dispatch = useDispatch();
  const onActiveGroupId = (groupId: string | null) => {
    dispatch(setActiveGroupId(groupId));
  };

  return (
    <div className="tw-space-y-4">
      {groups.map((group) => (
        <GroupItem
          key={group.id}
          group={group}
          activeGroupId={activeGroupId}
          onActiveGroupId={onActiveGroupId}
        />
      ))}
    </div>
  );
}
