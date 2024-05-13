import { useContext } from "react";
import { RatingStats } from "../../../../entities/IProfile";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import { AuthContext } from "../../../auth/Auth";
import Link from "next/link";

export default function UserPageRepModifyModalRaterStats({
  repState,
  giverAvailableRep,
}: {
  readonly repState: RatingStats;
  readonly giverAvailableRep: number;
}) {
  const { activeProfileProxy } = useContext(AuthContext);
  return (
    <div className="tw-mt-6 sm:tw-mt-8">
      <div className="tw-flex tw-flex-col tw-space-y-1">
        {!!activeProfileProxy && (
          <span className="tw-text-base tw-block tw-text-iron-300 tw-font-normal">
            <span>You are acting as proxy for:</span>
            <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
              <Link href={`/${activeProfileProxy.created_by.handle}`}>
                {activeProfileProxy.created_by.handle}
              </Link>
            </span>
          </span>
        )}
        <span className="tw-text-sm tw-block tw-text-iron-300 tw-font-normal">
          <span>Your available Rep:</span>
          <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
            {formatNumberWithCommas(giverAvailableRep)}
          </span>
        </span>
        <span className="tw-text-sm tw-block tw-text-iron-300 tw-font-normal">
          <span>Your max/min Rep Rating to {repState.category}:</span>
          <span className="tw-ml-1 tw-font-semibold tw-text-iron-50">
            +/-{" "}
            {formatNumberWithCommas(
              giverAvailableRep + Math.abs(repState.rater_contribution)
            )}
          </span>
        </span>
      </div>
    </div>
  );
}
