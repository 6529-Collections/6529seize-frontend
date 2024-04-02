import { DropFull } from "../../../../../../entities/IDrop";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../../../helpers/image.helpers";

export default function DropListItemRepTopGivers({
  drop,
}: {
  readonly drop: DropFull;
}) {
  return (
    <div className="isolate flex -space-x-1 overflow-hidden">
      {drop.top_rep_givers.map((topRepGiver) => (
        <div key={topRepGiver.profile.id}>
          {topRepGiver.profile.pfp && (
            <img
              className="tw-flex-shrink-0 tw-relative tw-z-30 tw-inline-block tw-h-6 tw-w-6 tw-rounded-full tw-ring-2 tw-ring-black tw-bg-iron-800"
              src={getScaledImageUri(
                topRepGiver.profile.pfp,
                ImageScale.W_AUTO_H_50
              )}
              alt=""
            />
          )}
        </div>
      ))}
    </div>
  );
}
