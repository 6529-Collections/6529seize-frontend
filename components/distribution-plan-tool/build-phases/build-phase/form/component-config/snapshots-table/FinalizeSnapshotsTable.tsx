import { useEffect, useState } from "react";
import DistributionPlanTableRowWrapper from "../../../../../common/DistributionPlanTableRowWrapper";
import {
  DistributionPlanSnapshot,
  PhaseGroupSnapshotConfig,
  TopHolderType,
} from "../../BuildPhaseFormConfigModal";
import AllowlistToolAnimationWrapper from "../../../../../../allowlist-tool/common/animation/AllowlistToolAnimationWrapper";
import { Pool } from "../../../../../../allowlist-tool/allowlist-tool.types";
import FinalizeSnapshotsTableRow from "./FinalizeSnapshotsTableRow";

export interface FinalizeSnapshotRow {
  readonly groupSnapshotId: string;
  readonly snapshot: DistributionPlanSnapshot | null;
  readonly excludeComponentWinners: string;
  readonly topHoldersFilter: string;
}

export default function FinalizeSnapshotsTable({
  onRemoveGroupSnapshot,
  groupSnapshots,
  snapshots,
}: {
  onRemoveGroupSnapshot: (groupSnapshotId: string) => void;
  groupSnapshots: PhaseGroupSnapshotConfig[];
  snapshots: DistributionPlanSnapshot[];
}) {
  const [rows, setRows] = useState<FinalizeSnapshotRow[]>([]);

  useEffect(() => {
    const getTopHoldersFilterSubTitle = (param: {
      from: number | null;
      to: number | null;
    }): string => {
      if (param.from === null && param.to === null) {
        return "";
      }

      if (typeof param.from === "number" && typeof param.to === "number") {
        return `${param.from} - ${param.to}`;
      }

      if (typeof param.from === "number") {
        return `${param.from}+`;
      }

      if (typeof param.to === "number") {
        return `1 - ${param.to}`;
      }

      return "";
    };

    const getTopHoldersFilter = (param: {
      type: TopHolderType | null;
      from: number | null;
      to: number | null;
    }): string => {
      if (!param.type) {
        return "";
      }

      if (param.from === null && param.to === null) {
        return "";
      }

      const subTitle = getTopHoldersFilterSubTitle({
        from: param.from,
        to: param.to,
      });

      if (param.type === TopHolderType.TOTAL_TOKENS_COUNT) {
        return `Total Tokens Top ${subTitle}`;
      }
      if (param.type === TopHolderType.UNIQUE_TOKENS_COUNT) {
        return `Unique Tokens Top ${subTitle}`;
      }
      if (param.type === TopHolderType.MEMES_TDH) {
        return `Memes TDH Top ${subTitle}`;
      }
      return "";
    };

    setRows(
      groupSnapshots.map((groupSnapshot) => {
        const snapshot = snapshots.find(
          (snapshot) => snapshot.id === groupSnapshot.snapshotId
        );
        return {
          groupSnapshotId: groupSnapshot.groupSnapshotId ?? "",
          snapshot: snapshot ?? null,
          excludeComponentWinners: groupSnapshot.excludeComponentWinners.length
            ? `${groupSnapshot.excludeComponentWinners.length.toString()} groups`
            : "",
          topHoldersFilter: getTopHoldersFilter({
            type: groupSnapshot.topHoldersFilter?.type ?? null,
            from: groupSnapshot.topHoldersFilter?.from ?? null,
            to: groupSnapshot.topHoldersFilter?.to ?? null,
          }),
          topHoldersFrom:
            groupSnapshot.topHoldersFilter?.from?.toString() ?? "",
          topHoldersTo: groupSnapshot.topHoldersFilter?.to?.toString() ?? "",
        };
      })
    );
  }, [groupSnapshots, snapshots]);
  return (
    <div className="tw-mt-6 tw-flow-root">
      <div className="tw-overflow-x-auto tw-ring-1 tw-ring-white/10 tw-rounded-lg">
        <table className="tw-min-w-full tw-divide-y tw-divide-neutral-700/60">
          <thead className="tw-bg-neutral-800/60">
            <tr>
              <th
                scope="col"
                className="tw-py-3 tw-pl-4 tw-pr-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px] sm:tw-pl-6"
              >
                Name
              </th>
              <th
                scope="col"
                className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"
              >
                Type
              </th>
              <th
                scope="col"
                className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"
              >
                Exclude components
              </th>
              <th
                scope="col"
                className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"
              >
                Top holders
              </th>
              <th
                scope="col"
                className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"
              ></th>
            </tr>
          </thead>
          <tbody className="tw-bg-neutral-900 tw-divide-y tw-divide-neutral-700/40">
            <AllowlistToolAnimationWrapper mode="wait" initial={false}>
              {rows.map((row) => (
                <FinalizeSnapshotsTableRow
                  key={row.groupSnapshotId}
                  row={row}
                  onRemoveGroupSnapshot={onRemoveGroupSnapshot}
                />
              ))}
            </AllowlistToolAnimationWrapper>
          </tbody>
        </table>
      </div>
    </div>
  );
}
