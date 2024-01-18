import { getRandomObjectId } from "../../../../../helpers/AllowlistToolHelpers";
import { UserPageStatsTableItemData } from "./UserPageStatsTable";
import UserPageStatsTableRow from "./UserPageStatsTableRow";

export default function UserPageStatsTableSection({
  data,
}: {
  readonly data: UserPageStatsTableItemData[];
}) {
  return (
    <div
      key={getRandomObjectId()}
      className="tw-grid tw-grid-cols-11 tw-border-b tw-border-solid tw-border-t-0 tw-border-x-0 tw-border-b-neutral-100"
    >
      {data.map((item) => (
        <UserPageStatsTableRow key={getRandomObjectId()} data={item} />
      ))}
    </div>
  );
}
