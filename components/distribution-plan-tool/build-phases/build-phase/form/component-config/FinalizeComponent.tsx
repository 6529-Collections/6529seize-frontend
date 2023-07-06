import { AllowlistToolSelectMenuOption } from "../../../../../allowlist-tool/common/select-menu/AllowlistToolSelectMenu";
import DistributionPlanSecondaryText from "../../../../common/DistributionPlanSecondaryText";
import {
  PhaseGroupConfig,
  PhaseGroupSnapshotConfig,
} from "../BuildPhaseFormConfigModal";
import FinalizeSnapshotsTable from "./snapshots-table/FinalizeSnapshotsTable";

export default function FinalizeComponent({
  onSave,
  onStartAgain,
  onRemoveGroupSnapshot,
  phaseGroupConfig,
  snapshots,
}: {
  onSave: () => void;
  onStartAgain: () => void;
  onRemoveGroupSnapshot: (groupSnapshotId: string) => void;
  phaseGroupConfig: PhaseGroupConfig;
  snapshots: AllowlistToolSelectMenuOption[];
}) {
  return (
    <div>
      <DistributionPlanSecondaryText>
        Here you can see your group configurations.
        <br />
        If you are happy with the group, click &ldquo;Save&rdquo;, otherwise
        click &ldquo;Start again&rdquo;.
      </DistributionPlanSecondaryText>
      {!!phaseGroupConfig.snapshots.length && (
        <FinalizeSnapshotsTable
          onRemoveGroupSnapshot={onRemoveGroupSnapshot}
          groupSnapshots={[...phaseGroupConfig.snapshots].reverse()}
          snapshots={snapshots}
        />
      )}
      <div>Random: {phaseGroupConfig.randomHoldersCount}</div>
      <div>Max mints: {phaseGroupConfig.maxMintCount}</div>
      <div className="tw-w-full tw-inline-flex tw-space-x-2 tw-justify-around tw-mt-4">
        <button
          onClick={onStartAgain}
          type="button"
          className="tw-w-1/3 tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
        >
          Start again
        </button>
        <button
          onClick={onSave}
          type="button"
          className="tw-w-1/3 tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
        >
          Save
        </button>
      </div>
    </div>
  );
}
