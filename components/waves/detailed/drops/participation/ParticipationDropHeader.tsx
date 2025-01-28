import Link from "next/link";
import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import { cicToType, getTimeAgoShort } from "../../../../../helpers/Helpers";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "../../../../user/utils/UserCICAndLevel";
import { DropTrophyIcon } from "../../../utils/DropThrophyIcon";
import ParticipationDropPfp from "./ParticipationDropPfp";
import { ApiDropType } from "../../../../../generated/models/ApiDropType";

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
    <div className="tw-grid tw-grid-cols-[auto_1fr] tw-gap-5 tw-px-4 md:tw-px-6 tw-pb-4 md:tw-pb-6">
      <div className="tw-relative">
        <div className="tw-rounded-lg tw-overflow-hidden tw-ring-2 tw-ring-iron-700/50 desktop-hover:group-hover:tw-ring-iron-600/30 tw-transition-all tw-duration-300 tw-shadow-lg desktop-hover:hover:tw-shadow-xl">
          <div className="tw-size-12 sm:tw-size-[52px]">
            <ParticipationDropPfp drop={drop} />
          </div>
        </div>
        <div className="tw-absolute -tw-bottom-2 -tw-right-2">
          <UserCICAndLevel
            level={drop.author.level}
            cicType={cicType}
            size={UserCICAndLevelSize.SMALL}
          />
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-justify-center tw-gap-1.5">
        <div className="tw-flex tw-items-center tw-gap-3">
          <p className="tw-text-lg sm:tw-text-xl tw-m-0 tw-leading-none tw-font-semibold">
            <Link
              onClick={(e) => e.stopPropagation()}
              href={`/${drop.author.handle}`}
              className="tw-no-underline tw-text-iron-200 desktop-hover:hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out"
            >
              {drop.author.handle}
            </Link>
          </p>
          {drop.drop_type === ApiDropType.Participatory && (
            <div className="tw-flex tw-items-center tw-justify-center tw-h-6">
              <DropTrophyIcon rank={drop.rank} />
            </div>
          )}
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <p className="tw-text-xs sm:tw-text-sm tw-m-0 tw-whitespace-nowrap tw-font-medium tw-leading-none tw-text-iron-400">
            {getTimeAgoShort(drop.created_at)}
          </p>
          {showWaveInfo && (
            <>
              <div className="tw-size-[3px] tw-bg-iron-500 tw-rounded-full tw-flex-shrink-0" />
              <Link
                onClick={(e) => e.stopPropagation()}
                href={`/my-stream?wave=${drop.wave.id}`}
                className="tw-text-xs sm:tw-text-sm tw-leading-none tw-font-medium tw-text-iron-400 desktop-hover:hover:tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out tw-no-underline"
              >
                {drop.wave.name}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
