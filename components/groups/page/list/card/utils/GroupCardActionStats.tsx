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
  const MATTER_LABEL: Record<RateMatter, string> = {
    [RateMatter.Rep]: "Rep",
    [RateMatter.Cic]: "CIC",
  };

  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const [rater, setRater] = useState<string | null>(null);
  const [raterRepresentative, setRaterRepresentative] = useState<string | null>(
    null
  );

  const [creditPerMember, setCreditPerMember] = useState<number>(0);

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

  const { data: creditLeft } = useQuery<AvailableRatingCredit | null>({
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

  useEffect(() => console.log(creditLeft), [creditLeft]);

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
      setCreditPerMember(creditPerMember);
    } else {
      setCreditPerMember(0);
    }
  }, [creditLeft, membersCount]);

  const count =
    typeof membersCount === "number"
      ? formatNumberWithCommas(membersCount)
      : null;

  return (
    <div className="tw-mt-4">
      <p className="tw-text-sm tw-block tw-mb-0 tw-text-iron-50 tw-font-medium">
        <img
          src="/pepe-xglasses.png"
          className="-tw-mt-0.5 tw-w-4 tw-h-4 tw-ml-1 tw-mr-1.5 tw-object-contain tw-flex-shrink-0 tw-inline"
          alt="pepe-xglasses"
        />
        You can grant up to{" "}
        <span className="tw-text-primary-400 tw-font-semibold">
          {creditPerMember > 0 && "+-"}
          {formatNumberWithCommas(+creditPerMember.toFixed(0))}
        </span>{" "}
        {MATTER_LABEL[matter]} to each of
        <span>
          <span className="tw-text-primary-400 tw-font-semibold">
            {" "}
            {loadingMembersCount ? (
              <CircleLoader size={CircleLoaderSize.SMALL} />
            ) : (
              count
            )}
          </span>{" "}
          members of the group.
        </span>
      </p>
    </div>
  );
}
