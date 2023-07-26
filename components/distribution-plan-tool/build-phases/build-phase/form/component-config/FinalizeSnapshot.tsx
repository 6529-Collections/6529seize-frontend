import { useContext, useEffect, useState } from "react";
import DistributionPlanSecondaryText from "../../../../common/DistributionPlanSecondaryText";
import {
  DistributionPlanSnapshot,
  PhaseGroupSnapshotConfig,
} from "../BuildPhaseFormConfigModal";
import FinalizeSnapshotsTable from "./snapshots-table/FinalizeSnapshotsTable";
import BuildPhaseFormConfigModalTitle from "./BuildPhaseFormConfigModalTitle";
import {
  AllowlistOperationBase,
  AllowlistToolResponse,
} from "../../../../../allowlist-tool/allowlist-tool.types";
import { DistributionPlanToolContext } from "../../../../DistributionPlanToolContext";
import ComponentConfigMeta from "./ComponentConfigMeta";

export default function FinalizeSnapshot({
  onConfigureGroup,
  onAddAnotherSnapshot,
  onRemoveGroupSnapshot,
  onStartAgain,
  groupSnapshots,
  snapshots,
  title,
  uniqueWalletsCountRequestOperations,
  onClose,
}: {
  onConfigureGroup: () => void;
  onAddAnotherSnapshot: () => void;
  onRemoveGroupSnapshot: (groupSnapshotId: string) => void;
  onStartAgain: () => void;
  groupSnapshots: PhaseGroupSnapshotConfig[];
  snapshots: DistributionPlanSnapshot[];
  title: string;
  uniqueWalletsCountRequestOperations: AllowlistOperationBase[];
  onClose: () => void;
}) {
  const { setToasts, distributionPlan } = useContext(
    DistributionPlanToolContext
  );
  useEffect(() => {
    if (!groupSnapshots.length) {
      onStartAgain();
    }
  }, [groupSnapshots, onStartAgain]);

  const [uniqueWalletsCount, setUniqueWalletsCount] = useState<number | null>(
    null
  );

  useEffect(() => {
    const setUniqueWalletsCountByOperations = async (
      distributionPlanId: string
    ) => {
      const url = `${process.env.ALLOWLIST_API_ENDPOINT}/allowlists/${distributionPlanId}/unique-wallets-count`;
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(uniqueWalletsCountRequestOperations),
        });
        const data: AllowlistToolResponse<number> = await response.json();
        if (typeof data !== "number" && "error" in data) {
          setToasts({
            messages:
              typeof data.message === "string" ? [data.message] : data.message,
            type: "error",
          });
          return { success: false };
        }
        setUniqueWalletsCount(data);
        return { success: true };
      } catch (error) {
        setToasts({
          messages: ["Something went wrong. Please try again."],
          type: "error",
        });
        return { success: false };
      }
    };
    if (!uniqueWalletsCountRequestOperations.length || !distributionPlan) {
      setUniqueWalletsCount(null);
      return;
    }

    setUniqueWalletsCountByOperations(distributionPlan.id);
  }, [uniqueWalletsCountRequestOperations, distributionPlan, setToasts]);

  return (
    <div>
      <BuildPhaseFormConfigModalTitle title={title} onClose={onClose} />
      <DistributionPlanSecondaryText>
        Here you can see your snapshot configurations.
        <br />
        If you would like to add another snapshot, click &ldquo;Add another
        snapshot&rdquo;, otherwise click &ldquo;Configure Group&rdquo;.
      </DistributionPlanSecondaryText>
      {!!groupSnapshots.length && (
        <div className="tw-mt-6">
          <FinalizeSnapshotsTable
            onRemoveGroupSnapshot={onRemoveGroupSnapshot}
            groupSnapshots={groupSnapshots}
            snapshots={snapshots}
          />
        </div>
      )}
      <div className="tw-mt-8 tw-w-full tw-inline-flex tw-justify-between">
        <ComponentConfigMeta tags={[]} walletsCount={uniqueWalletsCount} />
        <div className=" tw-gap-x-4 tw-flex tw-justify-end">
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
    </div>
  );
}
