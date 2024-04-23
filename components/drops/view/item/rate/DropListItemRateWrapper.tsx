import { useContext } from "react";
import { Drop } from "../../../../../entities/IDrop";
import DropListItemRateGive from "./give/DropListItemRateGive";
import { AuthContext } from "../../../../auth/Auth";
import { useQuery } from "@tanstack/react-query";
import { ProfileAvailableDropRateResponse } from "../../../../../entities/IProfile";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../../services/api/common-api";

export default function DropListItemRateWrapper({
  drop,
}: {
  readonly drop: Drop;
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
      availableRates={availableRateResponse?.available_credit_for_rating ?? 0}
    />
  );
}
