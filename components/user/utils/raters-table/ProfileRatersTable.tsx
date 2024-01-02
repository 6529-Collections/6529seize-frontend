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
    <div className="tw-inline-block tw-min-w-full tw-align-middle tw-px-4 sm:tw-px-6 md:tw-px-8">
      <table className="tw-min-w-full">
        <tbody className="tw-px-4 sm:tw-px-6 md:tw-px-8 tw-list-none tw-divide-y tw-divide-white/10 tw-divide-solid tw-divide-x-0">
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
