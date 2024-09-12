import React, { useContext } from "react";
import Link from "next/link";
import UserCICAndLevel from "../../../user/utils/UserCICAndLevel";
import WaveDetailedDropFollowAuthor from "./WaveDetailedDropFollowAuthor";
import { cicToType, getTimeAgoShort } from "../../../../helpers/Helpers";
import { UserCICAndLevelSize } from "../../../user/utils/UserCICAndLevel";
import { Drop } from "../../../../generated/models/Drop";
import { AuthContext } from "../../../auth/Auth";

interface WaveDetailedDropHeaderProps {
  drop: Drop;
  showWaveInfo: boolean;
}

const WaveDetailedDropHeader: React.FC<WaveDetailedDropHeaderProps> = ({
  drop,
  showWaveInfo,
}) => {
  const { connectedProfile } = useContext(AuthContext);
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
        {connectedProfile?.profile?.handle !== drop.author.handle && (
          <WaveDetailedDropFollowAuthor drop={drop} />
        )}
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
    </>
  );
};

export default WaveDetailedDropHeader;
