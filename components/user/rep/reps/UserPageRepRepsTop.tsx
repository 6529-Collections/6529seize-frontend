import {
  IProfileAndConsolidations,
  RatingStats,
} from "../../../../entities/IProfile";
import UserPageRepsItem from "./UserPageRepsItem";

export default function UserPageRepRepsTop({
  reps,
  profile,
  canEditRep,
}: {
  readonly reps: RatingStats[];
  readonly profile: IProfileAndConsolidations;
  readonly canEditRep: boolean;
}) {
  return (
    <div className="tw-mt-2 lg:tw-mt-4 tw-flex tw-flex-wrap tw-gap-y-4 tw-gap-x-4">
      {reps.map((rep) => (
        <UserPageRepsItem
          rep={rep}
          key={rep.category}
          profile={profile}
          canEditRep={canEditRep}
        />
      ))}
    </div>
  );
}
