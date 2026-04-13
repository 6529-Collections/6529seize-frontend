import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import CreateWaveGroupSearchField from "./CreateWaveGroupSearchField";

export default function CreateWaveInlineGroupSearch({
  defaultLabel,
  disabled,
  selectedGroup,
  onSelect,
}: {
  readonly defaultLabel: string;
  readonly disabled: boolean;
  readonly selectedGroup: ApiGroupFull | null;
  readonly onSelect: (group: ApiGroupFull | null) => void;
}) {
  return (
    <div className="tw-space-y-3">
      <CreateWaveGroupSearchField
        label="Search groups…"
        defaultLabel={defaultLabel}
        disabled={disabled}
        selectedGroup={selectedGroup}
        onSelect={onSelect}
      />
    </div>
  );
}
