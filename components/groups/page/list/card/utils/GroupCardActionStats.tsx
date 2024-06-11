import { useContext, useEffect, useState } from "react";
import { RateMatter } from "../../../../../../generated/models/RateMatter";
import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";
import CircleLoader, {
  CircleLoaderSize,
} from "../../../../../distribution-plan-tool/common/CircleLoader";
import { AuthContext } from "../../../../../auth/Auth";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../../../services/api/common-api";
import { AvailableRatingCredit } from "../../../../../../generated/models/AvailableRatingCredit";
import { assertUnreachable } from "../../../../../../helpers/AllowlistToolHelpers";

export default function GroupCardActionStats({
  matter,
  membersCount,
  loadingMembersCount,
}: {
  readonly matter: RateMatter;
  readonly membersCount: number | null;
  readonly loadingMembersCount: boolean;
}) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const [rater, setRater] = useState<string | null>(null);
  const [raterRepresentative, setRaterRepresentative] = useState<string | null>(
    null
  );

  const [minCredit, setMinCredit] = useState<number>(0);
  const [maxCredit, setMaxCredit] = useState<number>(0);

  useEffect(() => {
    if (!connectedProfile?.profile?.handle) {
      setRater(null);
      setRaterRepresentative(null);
      return;
    }
    if (activeProfileProxy) {
      setRater(activeProfileProxy.created_by.handle);
      setRaterRepresentative(connectedProfile.profile.handle);
      return;
    }
    setRater(connectedProfile.profile.handle);
    setRaterRepresentative(null);
  }, [connectedProfile, activeProfileProxy]);

  const { data: creditLeft, isFetching } =
    useQuery<AvailableRatingCredit | null>({
      queryKey: [
        QueryKey.IDENTITY_AVAILABLE_CREDIT,
        {
          rater,
          rater_representative: raterRepresentative,
        },
      ],
      queryFn: async () => {
        if (!rater) {
          return null;
        }
        const params: {
          rater: string;
          rater_representative?: string;
        } = {
          rater,
        };

        if (raterRepresentative) {
          params.rater_representative = raterRepresentative;
        }

        return await commonApiFetch<
          AvailableRatingCredit,
          { rater: string; rater_representative?: string }
        >({
          endpoint: `ratings/credit`,
          params,
        });
      },
      placeholderData: keepPreviousData,
      enabled: !!rater,
    });

  const getCreditLeft = () => {
    switch (matter) {
      case RateMatter.Rep:
        return creditLeft?.rep_credit ?? null;
      case RateMatter.Cic:
        return creditLeft?.cic_credit ?? null;
      default:
        assertUnreachable(matter);
        return null;
    }
  };

  useEffect(() => {
    const credit = getCreditLeft();
    if (
      typeof credit === "number" &&
      typeof membersCount === "number" &&
      credit > 0 &&
      membersCount > 0
    ) {
      const creditPerMember = credit / membersCount;
      setMinCredit(+(0 - creditPerMember).toFixed(0));
      setMaxCredit(+creditPerMember.toFixed(0));
    } else {
      setMinCredit(0);
      setMaxCredit(0);
    }
  }, [creditLeft, membersCount]);

  const count =
    typeof membersCount === "number"
      ? formatNumberWithCommas(membersCount)
      : null;

  return (
    <div className="tw-mt-4 tw-flex tw-flex-wrap lg:tw-flex-nowrap tw-gap-x-4 xl:tw-gap-x-6 tw-gap-y-3">
      <div className="tw-text-sm tw-inline-flex tw-items-center tw-gap-x-1.5">
        <span className="tw-text-iron-400 tw-font-normal">Min rep:</span>
        <span className="tw-font-medium tw-text-red">
          {isFetching ? (
            <CircleLoader size={CircleLoaderSize.SMALL} />
          ) : (
            formatNumberWithCommas(minCredit)
          )}
        </span>
      </div>
      <div className="tw-text-sm tw-inline-flex tw-items-center tw-gap-x-1.5">
        <span className="tw-text-iron-400 tw-font-normal">Max rep:</span>
        <span className="tw-font-medium tw-text-green">
          {" "}
          {isFetching ? (
            <CircleLoader size={CircleLoaderSize.SMALL} />
          ) : (
            formatNumberWithCommas(maxCredit)
          )}
        </span>
      </div>
      <div className="tw-text-sm tw-inline-flex tw-items-center tw-gap-x-2">
        <svg
          className="tw-size-5 tw-flex-shrink-0 tw-text-iron-300"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          aria-hidden="true"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
          />
        </svg>
        <div className="tw-inline-flex tw-items-center tw-gap-x-1.5">
          <span className="tw-text-iron-400 tw-font-normal">
            Members count:
          </span>
          <span className="tw-font-medium tw-text-iron-50">
            {loadingMembersCount ? (
              <CircleLoader size={CircleLoaderSize.SMALL} />
            ) : (
              count
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
