import Link from "next/link";
import { cicToType, getTimeAgoShort } from "../../../../helpers/Helpers";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "../../../user/utils/UserCICAndLevel";
import { ApiDrop } from "../../../../generated/models/ApiDrop";

interface WaveDetailedDropHeaderProps {
  readonly drop: ApiDrop;
  readonly isStorm: boolean;
  readonly currentPartIndex: number;
  readonly partsCount: number;
  readonly showWaveInfo: boolean;
}

const WaveDetailedDropHeader: React.FC<WaveDetailedDropHeaderProps> = ({
  drop,
  isStorm,
  currentPartIndex,
  partsCount,
  showWaveInfo,
}) => {
  const cicType = cicToType(drop.author.cic);
  return (
    <>
      <div className="tw-flex tw-items-center tw-gap-x-2">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <UserCICAndLevel
            level={drop.author.level}
            cicType={cicType}
            size={UserCICAndLevelSize.SMALL}
          />

          <p className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold">
            <Link
              href={`/${drop.author.handle}`}
              className="tw-no-underline tw-text-iron-200 hover:tw-text-iron-500 tw-transition tw-duration-300 tw-ease-out"
            >
              {drop.author.handle}
            </Link>
          </p>
        </div>

        <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
        <p className="tw-text-md tw-mb-0 tw-whitespace-nowrap tw-font-normal tw-leading-none tw-text-iron-500">
          {getTimeAgoShort(drop.created_at)}
        </p>
      </div>
      <div className="tw-mt-0.5">
        {showWaveInfo && (
          <Link
            href={`/waves/${drop.wave.id}`}
            className="tw-text-[11px] tw-leading-0 -tw-mt-1 tw-text-iron-500 hover:tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out tw-no-underline"
          >
            {drop.wave.name}
          </Link>
        )}
      </div>
      {isStorm && (
        <div className="tw-mt-2 tw-inline-flex tw-relative">
          <span className="tw-text-xs tw-text-iron-50">
            {currentPartIndex + 1} /{" "}
            <span className="tw-text-iron-400">{partsCount}</span>
          </span>
        </div>
      )}
    </>
  );
};

export default WaveDetailedDropHeader;
