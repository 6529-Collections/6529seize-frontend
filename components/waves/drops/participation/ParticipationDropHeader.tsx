import Link from "next/link";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import WinnerDropBadge from "../winner/WinnerDropBadge";
import WaveDropTime from "../time/WaveDropTime";

interface ParticipationDropHeaderProps {
  readonly drop: ExtendedDrop;
  readonly showWaveInfo: boolean;
}

export default function ParticipationDropHeader({
  drop,
  showWaveInfo,
}: ParticipationDropHeaderProps) {
  return (
    <>
      <div className="tw-flex tw-items-center tw-gap-x-2">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <UserCICAndLevel
            level={drop.author.level}
            size={UserCICAndLevelSize.SMALL}
          />

          <p className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold">
            <Link
              onClick={(e) => e.stopPropagation()}
              href={`/${drop.author.handle}`}
              className="tw-no-underline tw-text-iron-200 hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out"
            >
              {drop.author.handle}
            </Link>
          </p>
        </div>

        <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
        <WaveDropTime timestamp={drop.created_at} />
      </div>
      <div className="tw-flex tw-items-center tw-gap-x-2">
        {drop.rank && (
          <WinnerDropBadge
            rank={drop.rank}
            decisionTime={drop.winning_context?.decision_time ?? null}
          />
        )}
      </div>
      {showWaveInfo && drop.wave && (() => {
        const waveMeta = (drop.wave as unknown as {
          chat?: { scope?: { group?: { is_direct_message?: boolean } } };
        })?.chat;
        const isDirectMessage = waveMeta?.scope?.group?.is_direct_message ?? false;
        const waveHref = getWaveRoute({
          waveId: drop.wave.id,
          isDirectMessage,
          isApp: false,
        });
        return (
          <Link
            onClick={(e) => e.stopPropagation()}
            href={waveHref}
            className="tw-mb-0 tw-text-[11px] tw-leading-0 tw-text-iron-500 hover:tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out tw-no-underline"
          >
            {drop.wave.name}
          </Link>
        );
      })()}
    </>
  );
}
