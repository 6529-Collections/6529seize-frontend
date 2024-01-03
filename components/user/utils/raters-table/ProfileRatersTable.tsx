import { getRandomObjectId } from "../../../../helpers/AllowlistToolHelpers";
import ProfileRatersTableItem from "./ProfileRatersTableItem";
import {
  IProfileRatersTableItem,
  ProfileRatersTableType,
} from "./wrapper/ProfileRatersTableWrapper";

export default function ProfileRatersTable({
  ratings,
  type,
}: {
  readonly ratings: IProfileRatersTableItem[];
  readonly type: ProfileRatersTableType;
}) {
  return (
    <div className="tw-inline-block tw-min-w-full tw-align-middle">
      <table className="tw-min-w-full">
        <thead className="tw-border-b tw-border-x-0 tw-border-t-0 tw-border-white/10">
          <tr>
            <th className="tw-whitespace-nowrap tw-px-4 sm:tw-px-6 tw-py-3.5 tw-text-left tw-text-sm tw-font-medium tw-text-iron-400">
              Name
            </th>
            <th className="tw-whitespace-nowrap tw-px-4 sm:tw-px-6 tw-py-3.5 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400">
              Total Rep
            </th>
            <th className="tw-whitespace-nowrap tw-px-4 sm:tw-px-6 tw-py-3.5 tw-text-right tw-text-sm tw-font-medium tw-text-iron-400">
              Last Updates
            </th>
          </tr>
        </thead>
        <tbody className="tw-divide-y tw-divide-white/10 tw-divide-solid tw-divide-x-0">
          {ratings.map((rating) => (
            <ProfileRatersTableItem
              key={getRandomObjectId()}
              rating={rating}
              type={type}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
