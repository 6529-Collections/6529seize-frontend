import { useContext } from "react";
import DropListItemRateGive from "./give/DropListItemRateGive";
import { AuthContext } from "../../../../auth/Auth";
import { useQuery } from "@tanstack/react-query";
import { ProfileAvailableDropRateResponse } from "../../../../../entities/IProfile";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../../services/api/common-api";
import { Drop } from "../../../../../generated/models/Drop";
import { DropVoteState } from "../DropsListItem";

export default function DropListItemRateWrapper({
  drop,
  voteState,
  maxAbsoluteCredit,
}: {
  readonly drop: Drop;
  readonly voteState: DropVoteState;
  readonly maxAbsoluteCredit: number;
}) {
  const { connectedProfile } = useContext(AuthContext);
  const { data: availableRateResponse } =
    useQuery<ProfileAvailableDropRateResponse>({
      queryKey: [
        QueryKey.PROFILE_AVAILABLE_DROP_RATE,
        connectedProfile?.profile?.handle,
      ],
      queryFn: async () =>
        await commonApiFetch<ProfileAvailableDropRateResponse>({
          endpoint: `profiles/${connectedProfile?.profile?.handle}/drops/available-credit-for-rating`,
        }),
      enabled: !!connectedProfile?.profile?.handle,
    });

  return (
    <DropListItemRateGive
      drop={drop}
      voteState={voteState}
      maxAbsoluteCredit={maxAbsoluteCredit}
      // availableRates={availableRateResponse?.available_credit_for_rating ?? 0}
    />
  );
}
