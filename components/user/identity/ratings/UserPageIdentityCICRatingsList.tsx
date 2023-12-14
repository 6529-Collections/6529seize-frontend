import { ProfilesMatterRatingWithRaterLevel } from "../../../../entities/IProfile";
import UserPageIdentityCICRatingsItem from "./UserPageIdentityCICRatingsItem";

export default function UserPageIdentityCICRatingsList({
  ratings,
}: {
  ratings: ProfilesMatterRatingWithRaterLevel[];
}) {
  return (
    <div className="tw-inline-block tw-min-w-full tw-align-middle tw-px-6 md:tw-px-8">
      <table className="tw-min-w-full">
        <tbody className="tw-px-6 md:tw-px-8 tw-list-none tw-divide-y tw-divide-white/10 tw-divide-solid tw-divide-x-0">
          {ratings.map((rating) => (
            <UserPageIdentityCICRatingsItem
              key={rating.rater_handle}
              rating={rating}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
