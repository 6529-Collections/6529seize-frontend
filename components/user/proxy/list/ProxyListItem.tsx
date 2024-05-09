import { useContext, useEffect, useState } from "react";
import { ProfileProxy } from "../../../../generated/models/ProfileProxy";
import ProxyActions from "../proxy/list/ProxyActions";
import { AuthContext } from "../../../auth/Auth";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import ProxyCreateAction from "../proxy/create-action/ProxyCreateAction";
import CommonChangeAnimation from "../../../utils/animation/CommonChangeAnimation";

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
  readonly profileProxy: ProfileProxy;
  readonly profile: IProfileAndConsolidations;
}) {
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);
  const getIsGrantor = () =>
    connectedProfile?.profile?.external_id === profileProxy?.created_by?.id;

  const [isGrantor, setIsGrantor] = useState(getIsGrantor());

  const [viewType, setViewType] = useState(VIEW_TYPE.LIST);
  const getCanAddNewAction = () =>
    isGrantor && isSelf && viewType === VIEW_TYPE.LIST;
  const [canAddNewAction, setCanAddNewAction] = useState(getCanAddNewAction());

  useEffect(() => {
    setIsGrantor(getIsGrantor());
  }, [profileProxy, connectedProfile]);

  useEffect(() => {
    setCanAddNewAction(getCanAddNewAction());
  }, [isGrantor, isSelf, viewType]);

  const components: Record<VIEW_TYPE, JSX.Element> = {
    [VIEW_TYPE.LIST]: (
      <ProxyActions profileProxy={profileProxy} profile={profile} />
    ),
    [VIEW_TYPE.CREATE_NEW]: <ProxyCreateAction profileProxy={profileProxy} />,
  };
  return (
    <div className="tw-py-2 tw-divide-y tw-divide-iron-700 tw-divide-solid tw-divide-x-0 tw-rounded-lg tw-ring-1 tw-ring-iron-600">
      <div className="tw-flex tw-items-center tw-gap-x-3 tw-px-4 tw-py-2">
        <div className="tw-flex tw-items-center tw-gap-x-3">
          <img
            src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt=""
            className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-white/30"
          />
          <p className="tw-mb-0 tw-flex-auto tw-font-medium tw-text-base">
            {profileProxy.created_by.handle}
          </p>
        </div>
        <svg
          className="tw-h-5 tw-w-5 tw-text-iron-400"
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
        <div className="tw-flex tw-items-center tw-gap-x-3">
          <img
            src="https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt=""
            className="tw-flex-shrink-0 tw-h-6 tw-w-6 tw-flex-none tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-white/30"
          />
          <p className="tw-mb-0 tw-flex-auto tw-font-medium tw-text-base">
            {profileProxy.granted_to.handle}
          </p>
        </div>
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
      <div className="tw-mt-2 tw-px-4 tw-divide-y tw-divide-iron-700 tw-divide-solid tw-divide-x-0">
        <CommonChangeAnimation>{components[viewType]}</CommonChangeAnimation>
      </div>
    </div>
  );
}
