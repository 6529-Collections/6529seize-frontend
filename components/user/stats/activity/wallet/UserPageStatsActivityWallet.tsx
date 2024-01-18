import { useQuery } from "@tanstack/react-query";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import { commonApiFetch } from "../../../../../services/api/common-api";
import { MemeLite } from "../../../settings/UserSettingsImgSelectMeme";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import UserPageStatsActivityWalletFilter from "./filter/UserPageStatsActivityWalletFilter";

export enum UserPageStatsActivityWalletFilterType {
  ALL = "ALL",
  AIRDROPS = "AIRDROPS",
  MINTS = "MINTS",
  SALES = "SALES",
  PURCHASES = "PURCHASES",
  TRANSFERS = "TRANSFERS",
  BURNS = "BURNS",
}

export default function UserPageStatsActivityWallet({
  profile,
  activeAddress,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly activeAddress: string | null;
}) {
  const { data: memes } = useQuery({
    queryKey: [QueryKey.MEMES_LITE],
    queryFn: async () => {
      const memesResponse = await commonApiFetch<{
        count: number;
        data: MemeLite[];
        next: string | null;
        page: number;
      }>({
        endpoint: "memes_lite",
      });
      return memesResponse.data;
    },
  });
  return (
    <div>
      <div>Wallet activity</div>
      <UserPageStatsActivityWalletFilter />
    </div>
  );
}
