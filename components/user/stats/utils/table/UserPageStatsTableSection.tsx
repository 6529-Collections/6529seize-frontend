import { getRandomObjectId } from "../../../../../helpers/AllowlistToolHelpers";
import { UserPageStatsTableItemData } from "./UserPageStatsTable";
import UserPageStatsTableRow from "./UserPageStatsTableRow";

export default function UserPageStatsTableSection({
  data,
}: {
  readonly data: UserPageStatsTableItemData;
}) {
  return (
    <tr>
      <UserPageStatsTableRow key={getRandomObjectId()} data={data} />
    </tr>
  );
}
