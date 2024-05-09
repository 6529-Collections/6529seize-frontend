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
    <div className="tailwind-scope">
      <div className="tw-flex tw-items-center tw-justify-between">
        <Link
          className="tw-py-2 tw-px-2 -tw-ml-2 tw-flex tw-items-center tw-gap-x-2 tw-text-sm tw-font-semibold tw-border-0 tw-rounded-lg tw-transition tw-duration-300 tw-ease-out tw-cursor-pointer tw-no-underline tw-text-iron-400 tw-bg-transparent hover:tw-text-iron-50"
          href={backHref}
        >
          <svg
            className="tw-flex-shrink-0 tw-w-5 tw-h-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 12H4M4 12L10 18M4 12L10 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
          <span>Back</span>
        </Link>
        <div>
          {canAddNewAction && (
            <button
              type="button"
              onClick={() => setViewType(VIEW_TYPE.CREATE_NEW)}
              className="tw-flex tw-items-center tw-justify-center tw-relative tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
            >
              <svg
                className="tw-w-5 tw-h-5 tw-mr-1 -tw-ml-1"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 5V19M5 12H19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Create new action</span>
            </button>
          )}
        </div>
      </div>
      <div className="tw-mt-4 sm:tw-mt-6">
        <div className="tw-relative tw-gap-x-4">
          <ProxyHeader profileProxy={profileProxy} />
          <div className="tw-mt-2 sm:tw-mt-4">
            <CommonChangeAnimation>
              {components[viewType]}
            </CommonChangeAnimation>
          </div>
        </div>
      </div>
    </div>
  );
}
