import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import SelectGroupModalCard from "./SelectGroupModalCard";

export default function SelectGroupModalItems({
  groups,
  selectedGroupId,
  loading,
  onGroupSelect,
  onGroupClear,
}: {
  readonly groups: ApiGroupFull[];
  readonly selectedGroupId?: string | null | undefined;
  readonly loading: boolean;
  readonly onGroupSelect: (group: ApiGroupFull) => void;
  readonly onGroupClear?: (() => void) | undefined;
}) {
  if (loading) {
    return (
      <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center">
        <CircleLoader size={CircleLoaderSize.SMALL} />
      </div>
    );
  }

  return (
    <div className="tw-grid tw-grid-cols-1 tw-gap-4">
      {groups.map((group) => (
        <SelectGroupModalCard
          key={group.id}
          group={group}
          isSelected={selectedGroupId === group.id}
          onSelect={onGroupSelect}
          onClear={onGroupClear}
        />
      ))}
    </div>
  );
}
