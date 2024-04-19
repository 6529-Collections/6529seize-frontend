import { formatNumberWithCommas } from "../../../../../helpers/Helpers";
import LazyTippy from "../../../../utils/tooltip/LazyTippy";

export default function DropListItemVotesTooltip({
  current,
  myVotes,
  children,
}: {
  readonly current: number;
  readonly myVotes: number | null;
  readonly children: React.ReactNode;
}) {
  return (
    <LazyTippy
      placement="top"
      interactive={true}
      content={
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
      }
    >
      {children}
    </LazyTippy>
  );
}
