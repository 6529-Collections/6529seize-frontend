import { useRouter } from "next/router";
import { IProfileAndConsolidations } from "../../../../../entities/IProfile";
import UserPageStatsTDHcharts from "../../../to-be-removed/UserPageStatsTDHcharts";

export default function UserPageStatsActivityTDHHistory({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const router = useRouter();
  const mainAddress =
    profile.profile?.primary_wallet?.toLowerCase() ??
    (router.query.user as string).toLowerCase();
  return <UserPageStatsTDHcharts mainAddress={mainAddress} />;
}
