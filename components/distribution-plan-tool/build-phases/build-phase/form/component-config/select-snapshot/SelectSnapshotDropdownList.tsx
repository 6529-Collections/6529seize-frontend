import type { DistributionPlanSnapshot } from "@/components/distribution-plan-tool/build-phases/build-phase/form/BuildPhaseFormConfigModal";
import SelectSnapshotDropdownListItem from "./SelectSnapshotDropdownListItem";

export default function SelectSnapshotDropdownList({
  snapshots,
  selectedSnapshot,
  setSelectedSnapshot,
}: {
  snapshots: DistributionPlanSnapshot[];
  selectedSnapshot: DistributionPlanSnapshot | null;
  setSelectedSnapshot: (snapshot: DistributionPlanSnapshot) => void;
}) {
  return (
    <ul
      className="tw-absolute tw-z-10 tw-pl-1.5 tw-pr-1.5 tw-list-none tw-mt-1 tw-max-h-60 tw-w-full tw-overflow-auto tw-rounded-lg tw-bg-[#282828] tw-py-2 tw-text-base tw-shadow-xl  tw-ring-1 tw-ring-inset tw-ring-white/10 focus:tw-outline-none sm:tw-text-sm"
      role="listbox"
      aria-labelledby="listbox-label"
      aria-activedescendant="listbox-option-3"
    >
      {!!snapshots.length &&
        snapshots.map((snapshot) => (
          <SelectSnapshotDropdownListItem
            snapshot={snapshot}
            selectedSnapshot={selectedSnapshot}
            setSelectedSnapshot={setSelectedSnapshot}
            key={snapshot.id}
          />
        ))}
      {snapshots.length === 0 && (
        <li className="tw-p-2 tw-text-iron-300">No snapshots found</li>
      )}
    </ul>
  );
}
