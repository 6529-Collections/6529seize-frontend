import { useEffect, useState } from "react";
import {
  ApiProfileRepRatesState,
  IProfileAndConsolidations,
  RatingStats,
} from "../../../../entities/IProfile";
import UserPageRepsItem from "./UserPageRepsItem";

export default function UserPageRepReps({
  repRates,
  profile,
}: {
  readonly repRates: ApiProfileRepRatesState;
  readonly profile: IProfileAndConsolidations;
}) {
  const sortReps = (reps: RatingStats[]) =>
    [...reps].sort((a, d) => {
      if (a.rater_contribution && d.rater_contribution) {
        return Math.abs(d.rater_contribution) - Math.abs(a.rater_contribution);
      }
      if (a.rater_contribution) {
        return -1;
      }
      if (d.rater_contribution) {
        return 1;
      }
      return Math.abs(d.rating) - Math.abs(a.rating);
    });

  const [reps, setReps] = useState<RatingStats[]>(
    sortReps(repRates.rating_stats)
  );
  useEffect(
    () => setReps(sortReps(repRates.rating_stats)),
    [repRates.rating_stats]
  );
  return (
    <div>
      {!!reps.length && (
        <div className="tw-mt-6 tw-flex tw-flex-wrap tw-gap-4">
          {reps.map((rep) => (
            <UserPageRepsItem rep={rep} key={rep.category} profile={profile} />
          ))}
        </div>
      )}
    </div>
  );
}
