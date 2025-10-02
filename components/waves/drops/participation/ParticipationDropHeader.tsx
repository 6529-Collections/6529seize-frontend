import Link from "next/link";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { cicToType } from "@/helpers/Helpers";
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
  const cicType = cicToType(drop.author.cic);

  return (
    <>
      <div className="tw-flex tw-items-center tw-gap-x-4 tw-w-full">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <UserCICAndLevel
              level={drop.author.level}
              cicType={cicType}
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

        {drop.rank && (
          <WinnerDropBadge
            rank={drop.rank}
            decisionTime={drop.winning_context?.decision_time ?? null}
          />
        )}
      </div>
      {showWaveInfo && (
        <Link
          onClick={(e) => e.stopPropagation()}
          href={`/my-stream?wave=${drop.wave.id}`}
          className="tw-mb-0 tw-text-[11px] tw-leading-0 tw-text-iron-500 hover:tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out tw-no-underline"
        >
          {drop.wave.name}
        </Link>
      )}
    </>
  );
}
