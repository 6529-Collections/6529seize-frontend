import { useRouter } from "next/router";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import UserPageDrops from "./UserPageDrops";

export default function UserPageBrainWrapper({
  profile: initialProfile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();

  const { data: profile } = useQuery<IProfileAndConsolidations>({
    queryKey: [QueryKey.PROFILE, user.toLowerCase()],
    queryFn: async () =>
      await commonApiFetch<IProfileAndConsolidations>({
        endpoint: `profiles/${user.toLowerCase()}`,
      }),
    enabled: !!user,
    initialData: initialProfile,
  });

  return <UserPageDrops profile={profile} />;
}
