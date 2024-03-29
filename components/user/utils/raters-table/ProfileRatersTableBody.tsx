import { RatingWithProfileInfoAndLevel } from "../../../../entities/IProfile";
import {

  getRandomObjectId,
} from "../../../../helpers/AllowlistToolHelpers";
import ProfileRatersTableItem from "./ProfileRatersTableItem";
import { ProfileRatersTableType } from "./wrapper/ProfileRatersTableWrapper";

export default function ProfileRatersTableBody({
  ratings,
  type,
}: {
  readonly ratings: RatingWithProfileInfoAndLevel[];
  readonly type: ProfileRatersTableType;
}) {
  return (
    <tbody className="tw-divide-y tw-divide-iron-800 tw-divide-solid tw-divide-x-0">
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
