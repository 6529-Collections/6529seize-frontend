import { useContext } from "react";
import { DropFull } from "../../../../../entities/IDrop";
import DropListItemRepGive from "./give/DropListItemRepGive";
import { AuthContext } from "../../../../auth/Auth";
import { useQuery } from "@tanstack/react-query";
import { ProfileAvailableDropRepResponse } from "../../../../../entities/IProfile";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../../services/api/common-api";
import DropListItemRepTopGivers from "./top-givers/DropListItemRepTopGivers";
import DropListItemRepTopCategories from "./top-categories/DropListItemRepTopCategories";

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
    <div className="tw-mt-4 tw-flex tw-w-full tw-justify-between tw-items-end">
      <div className="tw-flex tw-flex-col">
        {!!drop.top_rep_givers.length && (
          <DropListItemRepTopGivers drop={drop} />
        )}
        {!!drop.top_rep_categories.length && (
          <DropListItemRepTopCategories drop={drop} />
        )}
      </div>
      <DropListItemRepGive
        drop={drop}
        availableRep={availableRepResponse?.available_tdh_for_rep ?? 0}
      />
    </div>
  );
}
