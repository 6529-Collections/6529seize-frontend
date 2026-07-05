import { useActiveGroup } from "@/contexts/ActiveGroupContext";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import GroupItem from "./item/GroupItem";
import type { GroupSelectVariant } from "./groupSelect.types";

export default function GroupItems({
  groups,
  variant = "default",
}: {
  readonly groups: ApiGroupFull[];
  readonly variant?: GroupSelectVariant | undefined;
}) {
  const { activeGroupId, setActiveGroupId } = useActiveGroup();
  const onActiveGroupId = (groupId: string | null) => {
    setActiveGroupId(groupId);
  };

  return (
    <div
      className={variant === "mobile-sheet" ? "tw-space-y-2" : "tw-space-y-4"}
    >
      {groups.map((group) => (
        <GroupItem
          key={group.id}
          group={group}
          activeGroupId={activeGroupId}
          onActiveGroupId={onActiveGroupId}
          variant={variant}
        />
      ))}
    </div>
  );
}
