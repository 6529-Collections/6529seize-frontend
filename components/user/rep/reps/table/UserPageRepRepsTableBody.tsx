import type { RatingStats } from "@/entities/IProfile";
import UserPageRepRepsTableItem from "./UserPageRepRepsTableItem";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

export default function UserPageRepRepsTableBody({
  reps,
  profile,
  canEditRep,
  maxRep,
}: {
  readonly reps: RatingStats[];
  readonly profile: ApiIdentity;
  readonly canEditRep: boolean;
  readonly maxRep: number;
}) {
  return (
    <tbody>
      {reps.map((rep) => (
        <UserPageRepRepsTableItem
          key={rep.category}
          rep={rep}
          profile={profile}
          canEditRep={canEditRep}
          maxRep={maxRep}
        />
      ))}
    </tbody>
  );
}
