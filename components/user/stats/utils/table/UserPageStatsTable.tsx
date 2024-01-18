import { MEMES_SEASON } from "../../../../../enums";
import { getRandomObjectId } from "../../../../../helpers/AllowlistToolHelpers";
import UserPageStatsTableRow from "./UserPageStatsTableRow";
import UserPageStatsTableSection from "./UserPageStatsTableSection";

export interface UserPageStatsTableProps {
  readonly title: string;
  readonly data: UserPageStatsTableItemData[][];
}

export interface UserPageStatsTableItemData
  extends Record<MEMES_SEASON, string> {
  readonly title: string;
  readonly isMain: boolean;
  readonly total: string;
  readonly memes: string;
  readonly gradient: string;
}

export default function UserPageStatsTable({
  data,
}: {
  readonly data: UserPageStatsTableProps;
}) {
  return (
    <div>
      <div>{data.title}</div>
      <div className="tw-grid tw-grid-cols-11">
        <div className="tw-col-span-2"></div>
        <div className="tw-col-span-1">Total</div>
        <div className="w-col-span-1">Memes</div>
        {/* TODO: make SZN type safe */}
        <div className="w-col-span-1">SZN1</div>
        <div className="w-col-span-1">SZN2</div>
        <div className="w-col-span-1">SZN3</div>
        <div className="w-col-span-1">SZN4</div>
        <div className="w-col-span-1">SZN5</div>
        <div className="w-col-span-1">SZN6</div>
        <div className="w-col-span-1">Gradient</div>
      </div>
      {data.data.map((row) => (
        <UserPageStatsTableSection key={getRandomObjectId()} data={row} />
      ))}
    </div>
  );
}
