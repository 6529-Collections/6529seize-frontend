import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import CreateWaveGroupSearchField from "./CreateWaveGroupSearchField";
import type { CreateWaveGroupSearchResultsLayout } from "./CreateWaveGroupSearchResults";

export default function CreateWaveInlineGroupSearch({
  defaultLabel,
  disabled,
  hasUnsavedGroup,
  selectedGroup,
  allowGroupClear = true,
  resultsLayout = "popover",
  onSelect,
}: {
  readonly defaultLabel: string;
  readonly disabled: boolean;
  readonly hasUnsavedGroup: boolean;
  readonly selectedGroup: ApiGroupFull | null;
  readonly allowGroupClear?: boolean;
  readonly resultsLayout?: CreateWaveGroupSearchResultsLayout;
  readonly onSelect: (group: ApiGroupFull | null) => void;
}) {
  return (
    <div className="tw-space-y-3">
      {hasUnsavedGroup && (
        <div className="tw-rounded-lg tw-border tw-border-solid tw-border-primary-500/20 tw-bg-primary-500/5 tw-p-3">
          <p className="tw-mb-1 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wider tw-text-primary-300">
            Unsaved group
          </p>
          <p className="tw-mb-0 tw-text-xs tw-font-medium tw-text-iron-300">
            Choosing another group will discard this unsaved group.
          </p>
        </div>
      )}
      <CreateWaveGroupSearchField
        label="Search groups…"
        defaultLabel={defaultLabel}
        disabled={disabled}
        selectedGroup={selectedGroup}
        allowClear={allowGroupClear}
        resultsLayout={resultsLayout}
        onSelect={onSelect}
      />
    </div>
  );
}
