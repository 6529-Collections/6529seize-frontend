import { useContext } from "react";
import { DropFull } from "../../../../../entities/IDrop";
import DropListItemRepGive from "./give/DropListItemRepGive";
import { AuthContext } from "../../../../auth/Auth";
import { useQuery } from "@tanstack/react-query";
import { ProfileAvailableDropRepResponse } from "../../../../../entities/IProfile";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../../services/api/common-api";

export const DEFAULT_DROP_REP_CATEGORY = "Rep";

export default function DropListItemRepWrapper({
  drop,
}: {
  readonly drop: DropFull;
}) {
  const { connectedProfile } = useContext(AuthContext);
  const { data: availableRepResponse } =
    useQuery<ProfileAvailableDropRepResponse>({
      queryKey: [
        QueryKey.PROFILE_AVAILABLE_DROP_REP,
        connectedProfile?.profile?.handle,
      ],
      queryFn: async () =>
        await commonApiFetch<ProfileAvailableDropRepResponse>({
          endpoint: `profiles/${connectedProfile?.profile?.handle}/drops/available-tdh-for-rep`,
        }),
      enabled: !!connectedProfile?.profile?.handle,
    });

  return (
    <DropListItemRepGive
      drop={drop}
      availableRep={availableRepResponse?.available_tdh_for_rep ?? 0}
    />
  );
}
