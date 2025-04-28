import { useContext, useEffect, useState } from "react";
import { ApiProfileProxy } from "../../../../generated/models/ApiProfileProxy";
import ProxyActions from "../proxy/list/ProxyActions";
import { AuthContext } from "../../../auth/Auth";
import { ApiIdentity } from "../../../../generated/models/ApiIdentity";
import ProxyCreateAction from "../proxy/create-action/ProxyCreateAction";
import CommonChangeAnimation from "../../../utils/animation/CommonChangeAnimation";
import { PROFILE_PROXY_AVAILABLE_ACTIONS } from "../../../../entities/IProxy";
import Link from "next/link";

enum VIEW_TYPE {
  LIST = "LIST",
  CREATE_NEW = "CREATE_NEW",
}

export default function ProxyListItem({
  isSelf,
  profileProxy,
  profile,
}: {
  readonly isSelf: boolean;
  readonly profileProxy: ApiProfileProxy;
  readonly profile: ApiIdentity;
}) {
  const { connectedProfile } = useContext(AuthContext);
  const getIsGrantor = () =>
    connectedProfile?.id === profileProxy?.created_by?.id;

  const [isGrantor, setIsGrantor] = useState(getIsGrantor());

  const [viewType, setViewType] = useState(VIEW_TYPE.LIST);
  const getCanAddNewAction = () => {
    const haveActionsLeftToAdd =
      PROFILE_PROXY_AVAILABLE_ACTIONS.filter(
        (action) =>
          profileProxy.actions.filter((a) => a.action_type === action)
            .length === 0
      ).length > 0;

    return (
      haveActionsLeftToAdd && isGrantor && isSelf && viewType === VIEW_TYPE.LIST
    );
  };

  const [canAddNewAction, setCanAddNewAction] = useState(getCanAddNewAction());

  useEffect(() => {
    setIsGrantor(getIsGrantor());
  }, [profileProxy, connectedProfile]);

  useEffect(() => {
    setCanAddNewAction(getCanAddNewAction());
  }, [isGrantor, isSelf, viewType, profileProxy]);

  const components: Record<VIEW_TYPE, JSX.Element> = {
    [VIEW_TYPE.LIST]: (
      <ProxyActions
        profileProxy={profileProxy}
        profile={profile}
        isSelf={isSelf}
      />
    ),
    [VIEW_TYPE.CREATE_NEW]: (
      <div className="tw-mt-4">
        <ProxyCreateAction
          profileProxy={profileProxy}
          onActionCreated={() => setViewType(VIEW_TYPE.LIST)}
          onCancel={() => setViewType(VIEW_TYPE.LIST)}
        />
      </div>
    ),
  };
  return (
    <div>
      <div className="tw-h-9 tw-mt-3 tw-flex tw-items-center tw-gap-x-3 tw-py-1">
        <Link href={`/${profileProxy.created_by.handle}/proxy`}>
          <div className="tw-flex tw-items-center tw-gap-x-3">
            {profileProxy.created_by.pfp ? (
              <img
                src={profileProxy.created_by.pfp}
                alt="Profile picture"
                className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-white/30"
              />
            ) : (
              <div className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-white/30"></div>
            )}
            <p className="tw-mb-0 tw-flex-auto tw-font-semibold tw-text-iron-50 hover:tw-text-iron-400 tw-text-base tw-transition tw-duration-300 tw-ease-out">
              {profileProxy.created_by.handle}
            </p>
          </div>
        </Link>
        <svg
          className="tw-flex-shrink-0 tw-h-5 tw-w-5 tw-text-iron-300"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 12H20M20 12L14 6M20 12L14 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="tw-flex tw-w-full tw-gap-x-4">
          <Link
            href={`/${profileProxy.granted_to.handle}/proxy`}
            className="tw-group"
          >
            <div className="tw-flex tw-items-center tw-gap-x-3">
              {profileProxy.granted_to.pfp ? (
                <img
                  src={profileProxy.granted_to.pfp}
                  alt="Profile picture"
                  className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-white/30"
                />
              ) : (
                <div className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-white/30"></div>
              )}
              <p className="tw-mb-0 tw-flex-auto tw-font-semibold tw-text-iron-50 tw-text-base hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out">
                {profileProxy.granted_to.handle}
              </p>
            </div>
          </Link>
        </div>
        <div>
          {canAddNewAction && (
            <button
              type="button"
              onClick={() => setViewType(VIEW_TYPE.CREATE_NEW)}
              className="tw-flex tw-items-center tw-justify-center tw-relative tw-bg-iron-50 tw-px-3 tw-py-2 tw-text-sm tw-leading-5 tw-font-semibold tw-text-iron-700 tw-border tw-border-solid tw-border-iron-50 tw-rounded-lg hover:tw-bg-iron-300 hover:tw-border-iron-300 tw-transition tw-duration-300 tw-ease-out tw-text-nowrap"
            >
              <svg
                className="tw-w-5 tw-h-5 tw-mr-1.5 -tw-ml-1"
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
              <span>Add A Proxy</span>
            </button>
          )}
        </div>
      </div>
      <div>
        <CommonChangeAnimation>{components[viewType]}</CommonChangeAnimation>
      </div>
    </div>
  );
}
