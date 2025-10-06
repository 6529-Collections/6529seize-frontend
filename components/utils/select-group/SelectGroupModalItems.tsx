import { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import GroupItem from "@/components/groups/select/item/GroupItem";

export default function SelectGroupModalItems({
  groups,
  loading,
  onGroupSelect,
}: {
  readonly groups: ApiGroupFull[];
  readonly loading: boolean;
  readonly onGroupSelect: (group: ApiGroupFull) => void;
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
