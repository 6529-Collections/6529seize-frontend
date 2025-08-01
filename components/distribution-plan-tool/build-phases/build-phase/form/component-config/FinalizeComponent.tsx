"use client";

import { useEffect, useState } from "react";
import DistributionPlanSecondaryText from "../../../../common/DistributionPlanSecondaryText";
import {
  DistributionPlanSnapshot,
  PhaseGroupConfig,
  PhaseGroupSnapshotConfig,
  RandomHoldersType,
} from "../BuildPhaseFormConfigModal";
import FinalizeSnapshotsTable from "./snapshots-table/FinalizeSnapshotsTable";
import BuildPhaseFormConfigModalTitle from "./BuildPhaseFormConfigModalTitle";
import ComponentConfigMeta from "./ComponentConfigMeta";
import { BuildPhasesPhase } from "../../../BuildPhases";

export default function FinalizeComponent({
  onSave,
  onStartAgain,
  onRemoveGroupSnapshot,
  phaseGroupConfig,
  snapshots,
  loading,
  title,
  uniqueWalletsCount,
  isLoadingUniqueWalletsCount,
  onClose,
  phases,
}: {
  onSave: () => void;
  onStartAgain: () => void;
  onRemoveGroupSnapshot: (groupSnapshotId: string) => void;
  phaseGroupConfig: PhaseGroupConfig;
  snapshots: DistributionPlanSnapshot[];
  loading: boolean;
  title: string;
  uniqueWalletsCount: number | null;
  isLoadingUniqueWalletsCount: boolean;
  onClose: () => void;
  phases: BuildPhasesPhase[];
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

  const [randomWalletsText, setRandomWalletsText] = useState<string>("");

  useEffect(() => {
    if (
      phaseGroupConfig.randomHoldersFilter?.type ===
      RandomHoldersType.BY_PERCENTAGE
    ) {
      setRandomWalletsText(`${phaseGroupConfig.randomHoldersFilter.value}%`);
    } else {
      setRandomWalletsText(
        phaseGroupConfig.randomHoldersFilter?.value?.toString() ?? ""
      );
    }
  }, [phaseGroupConfig.randomHoldersFilter]);
  return (
    <div className="tw-p-6">
      <BuildPhaseFormConfigModalTitle title={title} onClose={onClose} />
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
          phases={phases}
        />
      )}
      <div className="tw-mt-2 tw-inline-flex tw-gap-x-6">
        {!!phaseGroupConfig.randomHoldersFilter?.value && (
          <span className="tw-block tw-text-sm tw-text-neutral-400 tw-font-light">
            Random wallets:{" "}
            <span className="tw-font-medium  tw-text-neutral-100">
              {randomWalletsText}
            </span>
          </span>
        )}
        <span className="tw-block tw-text-xs tw-text-neutral-400 tw-font-light">
          Max mints per wallet:{" "}
          <span className="tw-pl-1 tw-font-medium tw-text-neutral-100">
            {" "}
            {phaseGroupConfig.maxMintCount}
          </span>
        </span>
      </div>
      <div className="tw-mt-8 tw-w-full tw-flex tw-items-center tw-justify-between">
        <ComponentConfigMeta
          tags={[]}
          walletsCount={uniqueWalletsCount}
          isLoading={isLoadingUniqueWalletsCount}
        />
        <div className="tw-flex tw-gap-x-4 tw-justify-end">
          <button
            disabled={loading}
            onClick={onStartAgain}
            type="button"
            className="tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-transparent hover:tw-bg-neutral-800/80 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border-2 tw-border-solid tw-border-neutral-700 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out">
            Start again
          </button>
          <button
            disabled={loading}
            onClick={onSave}
            type="button"
            className="tw-relative tw-inline-flex tw-items-center tw-justify-center tw-cursor-pointer tw-bg-primary-500 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out">
            <div style={{ visibility: loading ? "hidden" : "visible" }}>
              Save
            </div>
            {loading && (
              <svg
                aria-hidden="true"
                role="status"
                className="tw-inline tw-w-5 tw-h-5 tw-text-primary-400 tw-animate-spin tw-absolute"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  className="tw-text-neutral-600"
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor"></path>
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="currentColor"></path>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
