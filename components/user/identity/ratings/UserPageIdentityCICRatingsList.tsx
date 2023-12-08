import { ProfilesMatterRatingWithRaterLevel } from "../../../../entities/IProfile";
import UserPageIdentityCICRatingsItem from "./UserPageIdentityCICRatingsItem";

export default function UserPageIdentityCICRatingsList({
  ratings,
}: {
  ratings: ProfilesMatterRatingWithRaterLevel[];
}) {
  return (
    <ul
      role="list"
      className="tw-px-8 tw-list-none tw-divide-y tw-divide-white/5 tw-divide-solid tw-divide-x-0"
    >
      {ratings.map((rating) => (
        <UserPageIdentityCICRatingsItem
          key={rating.rater_handle}
          rating={rating}
        />
      ))}
    </ul>
  );
}
