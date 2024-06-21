import { GroupFull } from "../../../generated/models/GroupFull";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import GroupItem from "../../groups/select/item/GroupItem";

export default function SelectGroupModalItems({
  groups,
  loading,
  onGroupSelect,
}: {
  readonly groups: GroupFull[];
  readonly loading: boolean;
  readonly onGroupSelect: (group: GroupFull) => void;
}) {
  if (loading) {
    return (
      <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center">
        <CircleLoader size={CircleLoaderSize.XXLARGE} />
      </div>
    );
  }

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
