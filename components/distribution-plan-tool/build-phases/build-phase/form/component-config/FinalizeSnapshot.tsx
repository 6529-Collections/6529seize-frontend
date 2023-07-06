import { useEffect, useState } from "react";
import DistributionPlanSecondaryText from "../../../../common/DistributionPlanSecondaryText";
import DistributionPlanTableBodyWrapper from "../../../../common/DistributionPlanTableBodyWrapper";
import DistributionPlanTableHeaderWrapper from "../../../../common/DistributionPlanTableHeaderWrapper";
import DistributionPlanTableRowWrapper from "../../../../common/DistributionPlanTableRowWrapper";
import DistributionPlanTableWrapper from "../../../../common/DistributionPlanTableWrapper";
import {
  PhaseConfigStep,
  PhaseGroupSnapshotConfig,
  TopHolderType,
} from "../BuildPhaseFormConfigModal";
import { AllowlistToolSelectMenuOption } from "../../../../../allowlist-tool/common/select-menu/AllowlistToolSelectMenu";
import FinalizeSnapshotsTable from "./snapshots-table/FinalizeSnapshotsTable";

export default function FinalizeSnapshot({
  onConfigureGroup,
  onAddAnotherSnapshot,
  onRemoveGroupSnapshot,
  onStartAgain,
  groupSnapshots,
  snapshots,
}: {
  onConfigureGroup: () => void;
  onAddAnotherSnapshot: () => void;
  onRemoveGroupSnapshot: (groupSnapshotId: string) => void;
  onStartAgain: () => void;
  groupSnapshots: PhaseGroupSnapshotConfig[];
  snapshots: AllowlistToolSelectMenuOption[];
}) {
  // useEffect(() => {
  //   if (!groupSnapshots.length) {
  //     onStartAgain();
  //   }
  // }, [groupSnapshots, onStartAgain]);

  return (
    <div>
      <DistributionPlanSecondaryText>
        Here you can see your snapshot configurations.
        <br />
        If you would like to add another snapshot, click &ldquo;Add another
        snapshot&rdquo;, otherwise click &ldquo;Configure Group&rdquo;.
      </DistributionPlanSecondaryText>
      {!!groupSnapshots.length && (
        <FinalizeSnapshotsTable
          onRemoveGroupSnapshot={onRemoveGroupSnapshot}
          groupSnapshots={groupSnapshots}
          snapshots={snapshots}
        />
      )}
      <div className="tw-mt-8 tw-gap-x-4 tw-flex tw-justify-end">
        <button
          onClick={onAddAnotherSnapshot}
          type="button"
          className="tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
        >
          Add another snapshot
        </button>
        <button
          onClick={onConfigureGroup}
          type="button"
          className="tw-relative tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
        >
          Configure Group
        </button>
      </div>
    </div>
  );
}
