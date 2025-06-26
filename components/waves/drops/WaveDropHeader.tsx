import Link from "next/link";
import { useRouter } from "next/router";
import { cicToType } from "../../../helpers/Helpers";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "../../user/utils/UserCICAndLevel";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import WaveDropTime from "./time/WaveDropTime";
import UserProfileTooltipWrapper from "../../utils/tooltip/UserProfileTooltipWrapper";

interface WaveDropHeaderProps {
  readonly drop: ApiDrop;
  readonly isStorm: boolean;
  readonly currentPartIndex: number;
  readonly partsCount: number;
  readonly showWaveInfo: boolean;
  readonly badge?: React.ReactNode;
}

const WaveDropHeader: React.FC<WaveDropHeaderProps> = ({
  drop,
  isStorm,
  currentPartIndex,
  partsCount,
  showWaveInfo,
  badge,
}) => {
  const router = useRouter();
  const cicType = cicToType(drop.author.cic);

  const handleNavigation = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(path);
  };

  return (
    <>
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-2">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <div className="tw-flex tw-items-center tw-gap-x-2">
            <UserCICAndLevel
              level={drop.author.level}
              cicType={cicType}
              size={UserCICAndLevelSize.SMALL}
            />

            <p className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold">
              <UserProfileTooltipWrapper user={drop.author.handle ?? drop.author.id}>
                <Link
                  onClick={(e) => handleNavigation(e, `/${drop.author.handle}`)}
                  href={`/${drop.author.handle}`}
                  className="tw-no-underline desktop-hover:hover:tw-underline tw-text-iron-200 desktop-hover:hover:tw-text-opacity-80 tw-transition tw-duration-300 tw-ease-out"
                >
                  {drop.author.handle}
                </Link>
              </UserProfileTooltipWrapper>
            </p>
            <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
            <WaveDropTime timestamp={drop.created_at} />
          </div>
          {badge && <div className="tw-ml-2">{badge}</div>}
        </div>
      </div>
      <div>
        {showWaveInfo && (
          <Link
            onClick={(e) =>
              handleNavigation(e, `/my-stream?wave=${drop.wave.id}`)
            }
            href={`/my-stream?wave=${drop.wave.id}`}
            className="tw-mb-0 tw-text-[11px] tw-leading-0 -tw-mt-1 tw-text-iron-500 hover:tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out tw-no-underline"
          >
            {drop.wave.name}
          </Link>
        )}
      </div>

      {isStorm && (
        <div className="tw-inline-flex tw-relative tw-mt-2">
          <span className="tw-text-xs tw-text-iron-50 tw-mb-1.5">
            {currentPartIndex + 1} /{" "}
            <span className="tw-text-iron-400">{partsCount}</span>
          </span>
        </div>
      )}
    </>
  );
};

export default WaveDropHeader;
