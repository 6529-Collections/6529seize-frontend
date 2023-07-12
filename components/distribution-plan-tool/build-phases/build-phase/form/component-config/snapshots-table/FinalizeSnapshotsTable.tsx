import { useEffect, useState } from "react";
import { AllowlistToolSelectMenuOption } from "../../../../../../allowlist-tool/common/select-menu/AllowlistToolSelectMenu";
import DistributionPlanTableRowWrapper from "../../../../../common/DistributionPlanTableRowWrapper";
import {
  PhaseGroupSnapshotConfig,
  TopHolderType,
} from "../../BuildPhaseFormConfigModal";
import AllowlistToolAnimationWrapper from "../../../../../../allowlist-tool/common/animation/AllowlistToolAnimationWrapper";

export interface FinalizeSnapshotRow {
  readonly groupSnapshotId: string;
  readonly snapshotId: string;
  readonly snapshotName: string;
  readonly snapshotType: string;
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
  snapshots: AllowlistToolSelectMenuOption[];
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
          (snapshot) => snapshot.value === groupSnapshot.snapshotId
        );
        return {
          groupSnapshotId: groupSnapshot.groupSnapshotId ?? "",
          snapshotId: groupSnapshot.snapshotId ?? "",
          snapshotName: snapshot?.title ?? "",
          snapshotType: snapshot?.subTitle ?? "",
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
                <DistributionPlanTableRowWrapper key={row.groupSnapshotId}>
                  <td className="tw-whitespace-nowrap tw-py-4 tw-pl-4 tw-pr-3 tw-text-xs tw-font-medium tw-text-white sm:tw-pl-6">
                    {row.snapshotName}
                  </td>
                  <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-xs tw-font-normal tw-text-neutral-300">
                    {row.snapshotType}
                  </td>
                  <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-xs tw-font-normal tw-text-neutral-300">
                    {row.excludeComponentWinners}
                  </td>
                  <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-xs tw-font-normal tw-text-neutral-300">
                    {row.topHoldersFilter}
                  </td>
                  <td className="tw-whitespace-nowrap tw-px-3 tw-py-4 tw-text-xs tw-font-normal tw-text-neutral-300">
                    <button
                      type="button"
                      title="Delete"
                      onClick={(e) => {
                        e.preventDefault();
                        onRemoveGroupSnapshot(row.groupSnapshotId);
                      }}
                      className="tw-rounded-full tw-group tw-flex tw-items-center tw-justify-center tw-p-2 tw-text-xs tw-font-medium tw-border-none tw-ring-1 tw-ring-inset tw-text-neutral-400 tw-bg-neutral-400/10 tw-ring-neutral-400/20"
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
              ))}
            </AllowlistToolAnimationWrapper>
          </tbody>
        </table>
      </div>
    </div>
  );
}
