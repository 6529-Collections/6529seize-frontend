"use client";

import { useEffect, useState } from "react";
import {
  DistributionPlanSnapshot,
  PhaseGroupSnapshotConfig,
  TopHolderType,
} from "@/components/distribution-plan-tool/build-phases/build-phase/form/BuildPhaseFormConfigModal";
import AllowlistToolAnimationWrapper from "@/components/allowlist-tool/common/animation/AllowlistToolAnimationWrapper";
import { Pool } from "@/components/allowlist-tool/allowlist-tool.types";
import FinalizeSnapshotsTableRow from "./FinalizeSnapshotsTableRow";
import { BuildPhasesPhase } from "@/components/distribution-plan-tool/build-phases/BuildPhases";

export interface FinalizeSnapshotRow {
  readonly groupSnapshotId: string;
  readonly snapshot: DistributionPlanSnapshot | null;
  readonly excludeSnapshots: {
    readonly snapshotId: string;
    readonly snapshotType: Pool;
  }[];
  readonly excludeSnapshotsText: string;
  readonly excludeComponentWinners: string[];
  readonly excludeComponentWinnersText: string;
  readonly requiredTokens: string | null;
  readonly topHoldersFilter: string;
  readonly uniqueWalletsCount: number | null;
}

export default function FinalizeSnapshotsTable({
  onRemoveGroupSnapshot,
  groupSnapshots,
  snapshots,
  phases,
}: {
  onRemoveGroupSnapshot: (groupSnapshotId: string) => void;
  groupSnapshots: PhaseGroupSnapshotConfig[];
  snapshots: DistributionPlanSnapshot[];
  phases: BuildPhasesPhase[];
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
          excludeSnapshots: groupSnapshot.excludeSnapshots.map((ss) => ({
            snapshotId: ss.snapshotId,
            snapshotType: ss.snapshotType,
          })),
          excludeSnapshotsText:
            groupSnapshot.excludeSnapshots.length > 1
              ? `${groupSnapshot.excludeSnapshots.length} snapshots`
              : groupSnapshot.excludeSnapshots.length === 1
              ? `1 snapshot`
              : "",
          excludeComponentWinners: groupSnapshot.excludeComponentWinners,
          excludeComponentWinnersText:
            groupSnapshot.excludeComponentWinners.length > 1
              ? `${groupSnapshot.excludeComponentWinners.length} components`
              : groupSnapshot.excludeComponentWinners.length === 1
              ? `1 component`
              : "",
          requiredTokens: groupSnapshot.tokenIds ?? null,
          topHoldersFilter: getTopHoldersFilter({
            type: groupSnapshot.topHoldersFilter?.type ?? null,
            from: groupSnapshot.topHoldersFilter?.from ?? null,
            to: groupSnapshot.topHoldersFilter?.to ?? null,
          }),
          topHoldersFrom:
            groupSnapshot.topHoldersFilter?.from?.toString() ?? "",
          topHoldersTo: groupSnapshot.topHoldersFilter?.to?.toString() ?? "",
          uniqueWalletsCount: groupSnapshot.uniqueWalletsCount,
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
                className="tw-py-3 tw-pl-4 tw-pr-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px] sm:tw-pl-6">
                Name
              </th>
              <th
                scope="col"
                className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]">
                Wallets
              </th>
              <th
                scope="col"
                className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]">
                Exclude snapshots
              </th>
              <th
                scope="col"
                className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]">
                Exclude components
              </th>
              <th
                scope="col"
                className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]">
                Required Tokens
              </th>
              <th
                scope="col"
                className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]">
                Top holders
              </th>

              <th
                scope="col"
                className="tw-px-3 tw-py-3 tw-whitespace-nowrap tw-text-left tw-text-[0.6875rem] tw-leading-[1.125rem] tw-font-medium tw-text-neutral-400 tw-uppercase tw-tracking-[0.25px]"></th>
            </tr>
          </thead>
          <tbody className="tw-bg-neutral-800/60 tw-divide-y tw-divide-neutral-700/40">
            <AllowlistToolAnimationWrapper mode="wait" initial={false}>
              {rows.map((row) => (
                <FinalizeSnapshotsTableRow
                  key={row.groupSnapshotId}
                  row={row}
                  onRemoveGroupSnapshot={onRemoveGroupSnapshot}
                  phases={phases}
                />
              ))}
            </AllowlistToolAnimationWrapper>
          </tbody>
        </table>
      </div>
    </div>
  );
}
