import { ExtendedDrop } from "../../../../../../helpers/waves/drop.helpers";
import { cicToType } from "../../../../../../helpers/Helpers";
import UserCICAndLevel from "../../../../../user/utils/UserCICAndLevel";
import { UserCICAndLevelSize } from "../../../../../user/utils/UserCICAndLevel";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../../../helpers/image.helpers";

interface WaveWinnersDropHeaderAuthorPfpProps {
  readonly drop: ExtendedDrop;
}

export default function WaveWinnersDropHeaderAuthorPfp({
  drop,
}: WaveWinnersDropHeaderAuthorPfpProps) {
  return (
    <div className="tw-relative">
      {drop.author.pfp ? (
        <img
          className="tw-size-9 md:tw-size-11 tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-object-contain tw-flex-shrink-0"
          src={getScaledImageUri(drop.author.pfp, ImageScale.W_AUTO_H_50)}
          alt="User avatar"
        />
      ) : (
        <div className="tw-size-9 md:tw-size-11 tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-inset tw-ring-white/10 tw-object-contain tw-flex-shrink-0" />
      )}
      <div className="tw-absolute -tw-top-1.5 -tw-right-1.5">
        <UserCICAndLevel
          level={drop.author.level}
          cicType={cicToType(drop.author.cic)}
          size={UserCICAndLevelSize.SMALL}
        />
      </div>
    </div>
  );
}
