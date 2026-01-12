import type { RatingWithProfileInfoAndLevel } from "@/entities/IProfile";
import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";
import type { ProfileRatersTableType } from "@/types/enums";
import ProfileRatersTableItem from "./ProfileRatersTableItem";

export default function ProfileRatersTableBody({
  ratings,
  type,
}: {
  readonly ratings: RatingWithProfileInfoAndLevel[];
  readonly type: ProfileRatersTableType;
}) {
  return (
    <tbody className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800">
      {ratings.map((rating) => (
        <ProfileRatersTableItem
          key={getRandomObjectId()}
          rating={rating}
          type={type}
        />
      ))}
    </tbody>
  );
}
