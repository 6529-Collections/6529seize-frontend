import type { ReactNode } from "react";
import Link from "next/link";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import WinnerDropBadge from "../winner/WinnerDropBadge";
import WaveDropTime from "../time/WaveDropTime";
import ApprovalStatusBadge from "@/components/waves/approval/ApprovalStatusBadge";
import { isOfficiallyApprovedDrop } from "@/helpers/waves/approve-wave.helpers";

interface ParticipationDropHeaderProps {
  readonly drop: ExtendedDrop;
  readonly showWaveInfo: boolean;
  readonly winningThreshold?: number | null | undefined;
}

export default function ParticipationDropHeader({
  drop,
  showWaveInfo,
  winningThreshold,
}: ParticipationDropHeaderProps) {
  const isApproveDrop =
    typeof winningThreshold === "number" && winningThreshold > 0;
  const isApprovedDrop = isApproveDrop && isOfficiallyApprovedDrop(drop);
  const rank = drop.rank;
  let statusBadge: ReactNode = null;

  if (isApprovedDrop) {
    statusBadge = (
      <ApprovalStatusBadge
        approvedAt={drop.winning_context?.decision_time ?? null}
        order={drop.winning_context?.place ?? rank}
      />
    );
  } else if (
    !isApproveDrop &&
    rank !== null &&
    rank !== 0 &&
    !Number.isNaN(rank)
  ) {
    statusBadge = (
      <WinnerDropBadge
        rank={rank}
        decisionTime={drop.winning_context?.decision_time ?? null}
      />
    );
  }

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
  const isDirectMessage = waveMeta?.scope?.group?.is_direct_message ?? false;
  const waveHref = getWaveRoute({
    waveId: drop.wave.id,
    isDirectMessage,
    isApp: false,
  });

  return (
    <>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2">
        <p className="tw-mb-0 tw-text-md tw-font-semibold tw-leading-none">
          <Link
            onClick={(e) => e.stopPropagation()}
            href={`/${drop.author.handle}`}
            className="tw-text-iron-200 tw-no-underline tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-500"
          >
            {drop.author.handle}
          </Link>
        </p>
        <UserCICAndLevel
          level={drop.author.level}
          size={UserCICAndLevelSize.SMALL}
        />
        {statusBadge}
        <div className="tw-size-[3px] tw-flex-shrink-0 tw-rounded-full tw-bg-iron-600"></div>
        <WaveDropTime timestamp={drop.created_at} />
      </div>
      {showWaveInfo ? (
        <Link
          onClick={(e) => e.stopPropagation()}
          href={waveHref}
          className="tw-leading-0 tw-mb-0 tw-text-[11px] tw-text-iron-500 tw-no-underline tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-300"
        >
          {drop.wave.name}
        </Link>
      ) : null}
    </>
  );
}
