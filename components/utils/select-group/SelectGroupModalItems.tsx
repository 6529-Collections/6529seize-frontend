import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import GroupItem from "@/components/groups/select/item/GroupItem";

export default function SelectGroupModalItems({
  groups,
  selectedGroupId,
  loading,
  onGroupSelect,
}: {
  readonly groups: ApiGroupFull[];
  readonly selectedGroupId?: string | null | undefined;
  readonly loading: boolean;
  readonly onGroupSelect: (group: ApiGroupFull) => void;
}) {
  if (loading) {
    return (
      <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center">
        <CircleLoader size={CircleLoaderSize.XXLARGE} />
      </div>
    );
  }

  return (
    <ul className="tw-flex tw-list-none tw-flex-col tw-gap-y-4 tw-pl-0">
      {groups.map((group) => (
        <GroupItem
          key={group.id}
          group={group}
          activeGroupId={selectedGroupId ?? null}
          onActiveGroupId={() => onGroupSelect(group)}
        />
      ))}
    </ul>
  );
}
