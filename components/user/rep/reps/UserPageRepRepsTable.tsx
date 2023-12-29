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
    <div className="tw-mt-4 tw-flow-root">
      <div className="tw-overflow-x-auto tw-shadow tw-ring-1 tw-ring-white/10 tw-rounded-lg">
        <table className="tw-min-w-full tw-divide-y tw-divide-solid tw-divide-white/10">
          <thead className="tw-bg-iron-900">
            <tr>
              <th
                scope="col"
                className="tw-whitespace-nowrap tw-px-6 tw-py-3 tw-text-left tw-text-sm tw-font-medium tw-text-iron-400"
              >
                Category
              </th>
              <th
                scope="col"
                className="tw-whitespace-nowrap tw-group tw-cursor-pointer tw-px-6 tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400"
              >
                <span className="group-hover:tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out">
                  Voters
                </span>
                <svg
                  className="-tw-mt-0.5 tw-ml-2 tw-text-iron-400 group-hover:tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out tw-h-4 tw-w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 20V4M12 4L6 10M12 4L18 10"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </th>
              <th
                scope="col"
                className="tw-whitespace-nowrap tw-group tw-cursor-pointer tw-px-6 tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400 "
              >
                <span className="group-hover:tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out">
                  Raters
                </span>
                <svg
                  className="-tw-mt-0.5 tw-ml-2 tw-text-iron-400 group-hover:tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out tw-h-4 tw-w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 20V4M12 4L6 10M12 4L18 10"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </th>
              <th
                scope="col"
                className="tw-whitespace-nowrap tw-group tw-cursor-pointer tw-px-6 tw-py-3 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400"
              >
                <span className="group-hover:tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out">
                  My Rates
                </span>
                <svg
                  className="-tw-mt-0.5 tw-ml-2 tw-text-iron-400 group-hover:tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out tw-h-4 tw-w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 20V4M12 4L6 10M12 4L18 10"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </th>
            </tr>
          </thead>
          <tbody className="tw-divide-y tw-divide-solid tw-divide-white/10 tw-bg-iron-950">
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
  );
}
