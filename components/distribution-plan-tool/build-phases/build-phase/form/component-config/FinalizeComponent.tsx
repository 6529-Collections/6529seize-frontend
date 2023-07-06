import { useEffect, useState } from "react";
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
  const [groupSnapshots, setGroupSnapshots] = useState<
    PhaseGroupSnapshotConfig[]
  >(phaseGroupConfig.snapshots);

  useEffect(() => {
    setGroupSnapshots([...phaseGroupConfig.snapshots].reverse());
  }, [phaseGroupConfig.snapshots]);

  useEffect(() => {
    if (!groupSnapshots.length) {
      onStartAgain();
    }
  }, [groupSnapshots, onStartAgain]);
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
          groupSnapshots={groupSnapshots}
          snapshots={snapshots}
        />
      )}
      <div className="tw-mt-2 tw-inline-flex tw-gap-x-6">
        {!!phaseGroupConfig.randomHoldersCount && (
          <span className="tw-block tw-text-sm tw-text-neutral-400 tw-font-light">
            Random wallets:{" "}
            <span className="tw-font-medium  tw-text-neutral-100">
              {phaseGroupConfig.randomHoldersCount}
            </span>
          </span>
        )}
        <span className="tw-block tw-text-sm tw-text-neutral-400 tw-font-light">
          Max mints per wallet:{" "}
          <span className="tw-font-medium tw-text-neutral-100">
            {" "}
            {phaseGroupConfig.maxMintCount}
          </span>
        </span>
      </div>
      <div className="tw-flex tw-gap-x-4 tw-justify-end tw-mt-8">
        <button
          onClick={onStartAgain}
          type="button"
          className="tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out"
        >
          Start again
        </button>
        <button
          onClick={onSave}
          type="button"
          className="tw-relative tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
        >
          Save
        </button>
      </div>
    </div>
  );
}
