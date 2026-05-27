import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import ApprovalStatusBadge from "@/components/waves/approval/ApprovalStatusBadge";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { isOfficiallyApprovedDrop } from "@/helpers/waves/approve-wave.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import Link from "next/link";
import type { ReactNode } from "react";
import type { DropTimestampLayout } from "../drop.types";
import WaveDropTime from "../time/WaveDropTime";
import WinnerDropBadge from "../winner/WinnerDropBadge";

interface ParticipationDropHeaderProps {
  readonly drop: ExtendedDrop;
  readonly showWaveInfo: boolean;
  readonly winningThreshold?: number | null | undefined;
  readonly timestampLayout?: DropTimestampLayout | undefined;
}

export default function ParticipationDropHeader({
  drop,
  showWaveInfo,
  winningThreshold,
  timestampLayout = "inline",
}: ParticipationDropHeaderProps) {
  const isStackedTimestamp = timestampLayout === "stacked";
  const authorIdentity = drop.author.handle ?? drop.author.primary_address;
  const isApproveDrop =
    typeof winningThreshold === "number" && winningThreshold > 0;
  const isApprovedDrop = isApproveDrop && isOfficiallyApprovedDrop(drop);
  const rank = drop.rank;
  const hasWinnerRank =
    typeof rank === "number" && rank !== 0 && !Number.isNaN(rank);
  let statusBadge: ReactNode = null;

  if (isApprovedDrop) {
    statusBadge = (
      <ApprovalStatusBadge
        approvedAt={drop.winning_context?.decision_time ?? null}
      />
    );
  } else if (!isApproveDrop && hasWinnerRank) {
    statusBadge = (
      <WinnerDropBadge
        rank={rank}
        decisionTime={drop.winning_context?.decision_time ?? null}
      />
    );
  }

  return (
    <>
      <div
        className={
          isStackedTimestamp
            ? "tw-flex tw-min-w-0 tw-flex-col tw-items-start tw-gap-y-1"
            : "tw-flex tw-flex-wrap tw-items-center tw-gap-x-2"
        }
      >
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
          <p className="tw-mb-0 tw-text-md tw-font-semibold tw-leading-none">
            <Link
              onClick={(e) => e.stopPropagation()}
              href={`/${authorIdentity}`}
              className="tw-text-iron-200 tw-no-underline tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-500"
            >
              {authorIdentity}
            </Link>
          </p>
          <UserCICAndLevel
            level={drop.author.level}
            size={UserCICAndLevelSize.SMALL}
          />
          {statusBadge}
          {!isStackedTimestamp && (
            <div className="tw-size-[3px] tw-flex-shrink-0 tw-rounded-full tw-bg-iron-700"></div>
          )}
          {!isStackedTimestamp && <WaveDropTime timestamp={drop.created_at} />}
        </div>
        {isStackedTimestamp && <WaveDropTime timestamp={drop.created_at} />}
      </div>
      {showWaveInfo &&
        (() => {
          const waveMeta = (
            drop.wave as unknown as {
              chat?:
                | {
                    scope?:
                      | {
                          group?:
                            | { is_direct_message?: boolean | undefined }
                            | undefined;
                        }
                      | undefined;
                  }
                | undefined;
            }
          ).chat;
          const isDirectMessage =
            waveMeta?.scope?.group?.is_direct_message ?? false;
          const waveHref = getWaveRoute({
            waveId: drop.wave.id,
            isDirectMessage,
            isApp: false,
          });
          return (
            <Link
              onClick={(e) => e.stopPropagation()}
              href={waveHref}
              className="tw-leading-0 tw-mb-0 tw-text-[11px] tw-text-iron-500 tw-no-underline tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-300"
            >
              {drop.wave.name}
            </Link>
          );
        })()}
    </>
  );
}
