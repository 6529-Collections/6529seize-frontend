
import { formatNumberWithCommas } from "../../../../../helpers/Helpers";

export default function DropListItemActionsRepTooltip({
  current,
  myVotes,
}: {
  readonly current: number;
  readonly myVotes: number | null;
}) {
  return (
    <div>
      <div className="tw-text-center tw-text-white tw-text-xs tw-font-medium">
        {myVotes
          ? `Your Votes: ${formatNumberWithCommas(myVotes)}`
          : "You haven't given any vote yet"}
      </div>
      <div className="tw-text-center tw-text-white tw-text-xs tw-font-medium">
        Total: {formatNumberWithCommas(current)}
      </div>
    </div>
  );
}
