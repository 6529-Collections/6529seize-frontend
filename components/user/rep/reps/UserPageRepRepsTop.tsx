import {
  IProfileAndConsolidations,
  RatingStats,
} from "../../../../entities/IProfile";
import UserPageRepsItem from "./UserPageRepsItem";

export default function UserPageRepRepsTop({
  reps,
  profile,
  giverAvailableRep,
  canEditRep,
}: {
  readonly reps: RatingStats[];
  readonly profile: IProfileAndConsolidations;
  readonly giverAvailableRep: number;
  readonly canEditRep: boolean;
}) {
  return (
    <div className="tw-mt-6 tw-flex tw-flex-wrap tw-gap-4">
    
      {reps.map((rep) => (
        <UserPageRepsItem
          rep={rep}
          key={rep.category}
          profile={profile}
          giverAvailableRep={giverAvailableRep}
          canEditRep={canEditRep}
        />
      ))}
    </div>
  );
}
