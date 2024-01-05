import {
  IProfileAndConsolidations,
  RatingStats,
} from "../../../../../entities/IProfile";
import UserPageRepRepsTableItem from "./UserPageRepRepsTableItem";

export default function UserPageRepRepsTableBody({
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
    <tbody className="tw-divide-y tw-divide-solid tw-divide-iron-800">
      {reps.map((rep) => (
        <UserPageRepRepsTableItem
          key={rep.category}
          rep={rep}
          profile={profile}
          giverAvailableRep={giverAvailableRep}
          canEditRep={canEditRep}
        />
      ))}
    </tbody>
  );
}
