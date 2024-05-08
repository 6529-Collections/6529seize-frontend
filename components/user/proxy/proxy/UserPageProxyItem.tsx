import { useQuery } from "@tanstack/react-query";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { useRouter } from "next/router";
import { commonApiFetch } from "../../../../services/api/common-api";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../auth/Auth";
import { ProfileProxy } from "../../../../generated/models/ProfileProxy";
import ProxyHeader from "./ProxyHeader";
import ProxyActions from "./list/ProxyActions";
import ProxyCreateAction from "./create-action/ProxyCreateAction";
import CommonChangeAnimation from "../../../utils/animation/CommonChangeAnimation";
import { Time } from "../../../../helpers/time";
import Link from "next/link";

enum VIEW_TYPE {
  LIST = "LIST",
  CREATE_NEW = "CREATE_NEW",
}

export default function UserPageProxyItem({
  profile: initialProfile,
  profileProxy: initialProfileProxy,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly profileProxy: ProfileProxy;
}) {
  const router = useRouter();
  const handleOrWallet = (router.query.user as string).toLowerCase();
  const profileProxyId = router.query.proxy as string;
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);

  const { data: profile } = useQuery<IProfileAndConsolidations>({
    queryKey: [QueryKey.PROFILE, handleOrWallet],
    queryFn: async () =>
      await commonApiFetch<IProfileAndConsolidations>({
        endpoint: `profiles/${handleOrWallet}`,
      }),
    enabled: !!handleOrWallet,
    initialData: initialProfile,
  });

  const { data } = useQuery<ProfileProxy>({
    queryKey: [QueryKey.PROFILE_PROXY, { id: profileProxyId }],
    queryFn: async () =>
      await commonApiFetch<ProfileProxy>({
        endpoint: `proxies/${profileProxyId}`,
      }),
    enabled: !!profileProxyId,
    initialData: initialProfileProxy,
  });
  const getIsSelf = () =>
    connectedProfile?.profile?.external_id === profile.profile?.external_id;

  const [isSelf, setIsSelf] = useState(getIsSelf());

  const getProfileProxy = () => {
    if (isSelf) {
      return data;
    }
    const now = Time.currentMillis();
    return {
      ...data,
      actions: data.actions.filter((a) => {
        if (a.start_time && a.start_time > now) {
          return false;
        }
        if (a.end_time && a.end_time < now) {
          return false;
        }
        return a.is_active;
      }),
    };
  };
  const [profileProxy, setProfileProxy] = useState(getProfileProxy());
  useEffect(() => setProfileProxy(getProfileProxy()), [data, isSelf]);

  const [viewType, setViewType] = useState(VIEW_TYPE.LIST);

  const getIsGrantor = () =>
    connectedProfile?.profile?.external_id === profileProxy?.created_by?.id;

  const [isGrantor, setIsGrantor] = useState(getIsGrantor());
  useEffect(() => setIsSelf(getIsSelf()), [connectedProfile, profile]);
  useEffect(
    () => setIsGrantor(getIsGrantor()),
    [connectedProfile, profileProxy]
  );

  const getCanAddNewAction = () =>
    isGrantor && isSelf && viewType === VIEW_TYPE.LIST;
  const [canAddNewAction, setCanAddNewAction] = useState(getCanAddNewAction());
  useEffect(
    () => setCanAddNewAction(getCanAddNewAction()),
    [isGrantor, isSelf, viewType]
  );

  const components: Record<VIEW_TYPE, JSX.Element> = {
    [VIEW_TYPE.LIST]: <ProxyActions profileProxy={profileProxy} />,
    [VIEW_TYPE.CREATE_NEW]: <ProxyCreateAction profileProxy={profileProxy} />,
  };

  const backHref = `/${handleOrWallet}/proxy`;

  return (
    <div>
      <Link href={backHref}>Back</Link>
      <ProxyHeader profileProxy={profileProxy} />
      {canAddNewAction && (
        <button onClick={() => setViewType(VIEW_TYPE.CREATE_NEW)}>
          Create new action
        </button>
      )}
      <CommonChangeAnimation>{components[viewType]}</CommonChangeAnimation>
    </div>
  );
}
