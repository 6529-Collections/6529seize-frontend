import { useContext } from "react";
import { Drop } from "../../../../../../generated/models/Drop";
import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";
import RateClapOutlineIcon from "../../../../../utils/icons/RateClapOutlineIcon";
import RateClapSolidIcon from "../../../../../utils/icons/RateClapSolidIcon";
import { AuthContext } from "../../../../../auth/Auth";

export default function DropPartActionTriggersVoteVotings({
  drop,
}: {
  readonly drop: Drop;
}) {
  const { connectedProfile } = useContext(AuthContext);
  return (
    <button
      type="button"
      className="tw-text-iron-500 icon tw-px-0 tw-group tw-bg-transparent tw-border-0 tw-flex tw-items-center tw-gap-x-2 tw-text-[0.8125rem] tw-leading-5 tw-font-medium tw-transition tw-ease-out tw-duration-300"
    >
      <>
        {!!drop.context_profile_context?.rating ? (
          <RateClapSolidIcon />
        ) : (
          <RateClapOutlineIcon />
        )}

        <div className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-text-iron-500 tw-text-xs tw-font-normal">
          {!!drop.rating && <span>{formatNumberWithCommas(drop.rating)}</span>}
          {!!drop.context_profile_context?.rating && (
            <div className="tw-ml-2 tw-bg-primary-400/10 tw-rounded-full tw-w-auto tw-px-1 tw-py-0.5">
              <span className="tw-text-primary-400">
                {formatNumberWithCommas(drop.context_profile_context.rating)}
              </span>
            </div>
          )}
        </div>
      </>
    </button>
  );
}
