import { useRouter } from "next/router";
import { UserPageProxyActionProps } from "../../../../../pages/[user]/proxy/[proxy]/actions/[proxy-action]";
import { ProfileProxyActionType } from "../../../../../generated/models/ProfileProxyActionType";
import ProxyActionAllocateRep from "./ProxyActionAllocateRep";
import ProxyActionAllocateCic from "./ProxyActionAllocateCic";
import ProxyActionCreateWave from "./ProxyActionCreateWave";
import ProxyActionReadWave from "./ProxyActionReadWave";
import ProxyActionCreateDropToWave from "./ProxyActionCreateDropToWave";
import ProxyActionRateWaveDrop from "./ProxyActionRateWaveDrop";
import ProxyActionAcceptanceButton from "./acceptance/ProxyActionAcceptanceButton";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ProfileProxy } from "../../../../../generated/models/ProfileProxy";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../../services/api/common-api";
import ProxyHeader from "../ProxyHeader";
import ProfileProxyEndTime from "./utils/time/ProfileProxyEndTime";

export default function UserPageProxyAction({
  profile,
  profileProxy: initialProfileProxy,
}: UserPageProxyActionProps) {
  const router = useRouter();
  const handleOrWallet = router.query.user as string;
  const profileProxyId = router.query.proxy as string;
  const profileProxyActionId = router.query["proxy-action"] as string;

  const { data: profileProxy } = useQuery<ProfileProxy>({
    queryKey: [QueryKey.PROFILE_PROXY, { id: profileProxyId }],
    queryFn: async () =>
      await commonApiFetch<ProfileProxy>({
        endpoint: `proxies/${profileProxyId}`,
      }),
    enabled: !!profileProxyId,
    initialData: initialProfileProxy,
  });

  const action = profileProxy.actions.find(
    (a) => a.id === profileProxyActionId
  );
  const actionType = action?.action_type;

  if (!action || !actionType) {
    return <div>404</div>;
  }

  const components: Record<ProfileProxyActionType, JSX.Element> = {
    [ProfileProxyActionType.AllocateRep]: (
      <ProxyActionAllocateRep action={action} profileProxy={profileProxy} />
    ),
    [ProfileProxyActionType.AllocateCic]: (
      <ProxyActionAllocateCic action={action} profileProxy={profileProxy} />
    ),
    [ProfileProxyActionType.CreateWave]: <ProxyActionCreateWave />,
    [ProfileProxyActionType.ReadWave]: <ProxyActionReadWave />,
    [ProfileProxyActionType.CreateDropToWave]: <ProxyActionCreateDropToWave />,
    [ProfileProxyActionType.RateWaveDrop]: <ProxyActionRateWaveDrop />,
  };

  const backHref = `/${handleOrWallet}/proxy/${profileProxy.id}`;

  return (
    <div>
      <Link href={backHref}>Back</Link>
      <ProxyHeader profileProxy={profileProxy} />
      <div>
        <div>start time: {action.start_time}</div>
        <ProfileProxyEndTime
          profileProxy={profileProxy}
          profileProxyAction={action}
        />
        <div>created at: {action.created_at}</div>
        <div>accepted at: {action.accepted_at}</div>
        <div>rejected at: {action.rejected_at}</div>
        <div>revoked at: {action.revoked_at}</div>
      </div>
      {components[actionType]}

      <ProxyActionAcceptanceButton
        action={action}
        profile={profile}
        profileProxy={profileProxy}
      />
    </div>
  );
}
