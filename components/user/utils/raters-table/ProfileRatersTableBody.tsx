import type { RatingWithProfileInfoAndLevel } from "@/entities/IProfile";
import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";
import ProfileRatersTableItem from "./ProfileRatersTableItem";

export default function ProfileRatersTableBody({
  ratings,
}: {
  readonly ratings: RatingWithProfileInfoAndLevel[];
}) {
  return (
    <tbody className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800">
      {ratings.map((rating) => (
        <ProfileRatersTableItem
          key={getRandomObjectId()}
          rating={rating}
        />
      ))}
    </tbody>
  );
}
