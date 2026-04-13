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
  emptyStateMessage = "No groups found.",
}: {
  readonly groups: ApiGroupFull[];
  readonly selectedGroupId?: string | null | undefined;
  readonly loading: boolean;
  readonly onGroupSelect: (group: ApiGroupFull) => void;
  readonly onGroupClear?: (() => void) | undefined;
  readonly emptyStateMessage?: string | undefined;
}) {
  if (loading) {
    return (
      <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-pb-4">
        <CircleLoader size={CircleLoaderSize.SMALL} />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="tw-rounded-xl tw-border tw-border-dashed tw-border-white/[0.08] tw-bg-iron-950/60 tw-px-4 tw-py-5 tw-text-center">
        <p className="tw-mb-0 tw-text-sm tw-text-iron-400">
          {emptyStateMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="tw-grid tw-grid-cols-1 tw-gap-2">
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
