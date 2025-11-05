import { BuildPhasesPhase } from "@/components/distribution-plan-tool/build-phases/BuildPhases";
import DistributionPlanTableRowWrapper from "@/components/distribution-plan-tool/common/DistributionPlanTableRowWrapper";
import { Tooltip } from "react-tooltip";
import { FinalizeSnapshotRow } from "./FinalizeSnapshotsTable";
import FinalizeSnapshotsTableExcludedComponentsTooltip from "./FinalizeSnapshotsTableExcludedComponentsTooltip";
import FinalizeSnapshotsTableExcludedSnapshotsTooltip from "./FinalizeSnapshotsTableExcludedSnapshotsTooltip";
import FinalizeSnapshotsTableSnapshotTooltip from "./FinalizeSnapshotsTableSnapshotTooltip";

export default function FinalizeSnapshotsTableRow({
  row,
  onRemoveGroupSnapshot,
  phases,
}: {
  row: FinalizeSnapshotRow;
  onRemoveGroupSnapshot: (groupSnapshotId: string) => void;
  phases: BuildPhasesPhase[];
}) {
  return (
    <DistributionPlanTableRowWrapper>
      <td className="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-xs tw-font-medium tw-text-white sm:tw-pl-6">
        {row.snapshot?.name}
        <>
          <svg
            className="tw-ml-2 tw-flex-shrink-0 tw-h-4 tw-w-4 tw-text-iron-500 tw-cursor-pointer"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            data-tooltip-id={`snapshot-info-${row.groupSnapshotId}`}
          >
            <path
              d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <Tooltip
            id={`snapshot-info-${row.groupSnapshotId}`}
            place="top"
            style={{
              backgroundColor: "#1F2937",
              color: "white",
              padding: "4px 8px",
              maxWidth: "500px",
            }}
          >
            <FinalizeSnapshotsTableSnapshotTooltip
              snapshotId={row.snapshot?.id ?? null}
              snapshotType={row.snapshot?.poolType ?? null}
            />
          </Tooltip>
        </>
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-xs tw-font-normal tw-text-iron-300">
        {row.uniqueWalletsCount}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-xs tw-font-normal tw-text-iron-300">
        {row.excludeSnapshotsText}
        {!!row.excludeSnapshots.length && (
          <>
            <svg
              className="tw-ml-2 tw-flex-shrink-0 tw-h-4 tw-w-4 tw-text-iron-500 tw-cursor-pointer"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              data-tooltip-id={`excluded-snapshots-${row.groupSnapshotId}`}
            >
              <path
                d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <Tooltip
              id={`excluded-snapshots-${row.groupSnapshotId}`}
              place="top"
              style={{
                backgroundColor: "#1F2937",
                color: "white",
                padding: "4px 8px",
                maxWidth: "500px",
              }}
            >
              <FinalizeSnapshotsTableExcludedSnapshotsTooltip
                excludedSnapshots={row.excludeSnapshots}
              />
            </Tooltip>
          </>
        )}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-xs tw-font-normal tw-text-iron-300">
        {row.excludeComponentWinnersText}
        {!!row.excludeComponentWinners.length && (
          <>
            <svg
              className="tw-ml-2 tw-flex-shrink-0 tw-h-4 tw-w-4 tw-text-iron-500 tw-cursor-pointer"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              data-tooltip-id={`excluded-components-${row.groupSnapshotId}`}
            >
              <path
                d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <Tooltip
              id={`excluded-components-${row.groupSnapshotId}`}
              place="top"
              style={{
                backgroundColor: "#1F2937",
                color: "white",
                padding: "4px 8px",
                maxWidth: "500px",
              }}
            >
              <FinalizeSnapshotsTableExcludedComponentsTooltip
                excludedComponents={row.excludeComponentWinners}
                phases={phases}
              />
            </Tooltip>
          </>
        )}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-xs tw-font-normal tw-text-iron-300">
        {row.requiredTokens}
      </td>
      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-xs tw-font-normal tw-text-iron-300">
        {row.topHoldersFilter}
      </td>

      <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-xs tw-font-normal tw-text-iron-300">
        <button
          type="button"
          title="Delete"
          onClick={(e) => {
            e.preventDefault();
            onRemoveGroupSnapshot(row.groupSnapshotId);
          }}
          className="tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-p-2 tw-text-xs tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-iron-400 tw-bg-iron-400/10 tw-ring-iron-400/20"
        >
          <svg
            className="tw-h-4 tw-w-4 group-hover:tw-text-error tw-transition tw-duration-300 tw-ease-out"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 3H15M3 6H21M19 6L18.2987 16.5193C18.1935 18.0975 18.1409 18.8867 17.8 19.485C17.4999 20.0118 17.0472 20.4353 16.5017 20.6997C15.882 21 15.0911 21 13.5093 21H10.4907C8.90891 21 8.11803 21 7.49834 20.6997C6.95276 20.4353 6.50009 20.0118 6.19998 19.485C5.85911 18.8867 5.8065 18.0975 5.70129 16.5193L5 6M10 10.5V15.5M14 10.5V15.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </td>
    </DistributionPlanTableRowWrapper>
  );
}
