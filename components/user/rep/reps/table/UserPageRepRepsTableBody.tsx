import type { RatingStats } from "@/entities/IProfile";
import UserPageRepRepsTableItem from "./UserPageRepRepsTableItem";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

export default function UserPageRepRepsTableBody({
  reps,
  profile,
  canEditRep,
}: {
  readonly reps: RatingStats[];
  readonly profile: ApiIdentity;
  readonly canEditRep: boolean;
}) {
  return (
    <tbody className="tw-divide-y tw-divide-solid tw-divide-iron-800">
      {reps.map((rep) => (
        <UserPageRepRepsTableItem
          key={rep.category}
          rep={rep}
          profile={profile}
          canEditRep={canEditRep}
        />
      ))}
    </tbody>
  );
}
