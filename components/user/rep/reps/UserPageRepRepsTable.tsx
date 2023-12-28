import {
  IProfileAndConsolidations,
  RatingStats,
} from "../../../../entities/IProfile";
import UserPageRepRepsTableItem from "./UserPageRepRepsTableItem";

export default function UserPageRepRepsTable({
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
    <div className="tw-mt-6 tw-flow-root">
      <div className="-tw-mx-4 -tw-my-2 tw-overflow-x-auto sm:-tw-mx-6 lg:-tw-mx-8">
        <div className="tw-inline-block tw-min-w-full tw-py-2 tw-align-middle sm:tw-px-6 lg:tw-px-8">
          <div className="tw-overflow-hidden tw-shadow tw-ring-1 tw-ring-black tw-ring-opacity-5 sm:tw-rounded-lg">
            <table className="tw-min-w-full tw-divide-y tw-divide-solid tw-divide-neutral-700">
              <tbody className="tw-divide-y tw-divide-solid tw-divide-neutral-700/40 tw-bg-neutral-800">
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
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
