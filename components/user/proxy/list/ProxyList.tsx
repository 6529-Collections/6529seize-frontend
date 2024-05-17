import { ProxyMode } from "../UserPageProxy";
import { useState } from "react";
import dynamic from "next/dynamic";
import CommonAnimationOpacity from "../../../utils/animation/CommonAnimationOpacity";
import { ProfileProxy } from "../../../../generated/models/ProfileProxy";
import ProxyListItem from "./ProxyListItem";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";

export enum ProfileProxyListType {
  ALL = "ALL",
  RECEIVED = "RECEIVED",
  GRANTED = "GRANTED",
}

const ProxyListFilters = dynamic(() => import("./filters/ProxyListFilters"), {
  ssr: false,
});

export default function ProxyList({
  onModeChange,
  receivedProfileProxies,
  grantedProfileProxies,
  isSelf,
  profile,
  loading,
}: {
  readonly onModeChange: (mode: ProxyMode) => void;
  readonly receivedProfileProxies: ProfileProxy[];
  readonly grantedProfileProxies: ProfileProxy[];
  readonly isSelf: boolean;
  readonly profile: IProfileAndConsolidations;
  readonly loading: boolean;
}) {
  const [proxyType, setProxyType] = useState<ProfileProxyListType>(
    ProfileProxyListType.ALL
  );

  return (
    <div className="tailwind-scope tw-space-y-6">
      <div className="tw-mt-4 sm:tw-mt-6 tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-x-4">
        <ProxyListFilters selected={proxyType} setSelected={setProxyType} />
        {isSelf && (
          <CommonAnimationOpacity>
            <button
              type="button"
              onClick={() => onModeChange(ProxyMode.CREATE)}
              className="tw-whitespace-nowrap w-flex tw-items-center tw-justify-center tw-relative tw-bg-primary-500 tw-px-3 tw-py-2 tw-text-sm tw-leading-5 tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
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
              <span>Assign Proxy</span>
            </button>
          </CommonAnimationOpacity>
        )}
      </div>
      {[ProfileProxyListType.ALL, ProfileProxyListType.RECEIVED].includes(
        proxyType
      ) && (
        <div>
          <p className="tw-mb-0 tw-flex-auto tw-font-semibold tw-text-iron-50 tw-text-lg">
            Received proxies
          </p>
          <div className="tw-space-y-8">
            {receivedProfileProxies.length ? (
              receivedProfileProxies.map((profileProxy) => (
                <ProxyListItem
                  key={profileProxy.id}
                  profileProxy={profileProxy}
                  isSelf={isSelf}
                  profile={profile}
                />
              ))
            ) : (
              <div className="tw-py-4 tw-text-sm tw-italic tw-text-iron-500">
                {loading ? "Loading proxies..." : "No received proxies"}
              </div>
            )}
          </div>
        </div>
      )}
      {[ProfileProxyListType.ALL, ProfileProxyListType.GRANTED].includes(
        proxyType
      ) && (
        <div>
          <p className="tw-mb-0 tw-flex-auto tw-font-semibold tw-text-iron-50 tw-text-lg">
            Granted proxies
          </p>
          <div className="tw-space-y-8">
            {grantedProfileProxies.length ? (
              grantedProfileProxies.map((profileProxy) => (
                <ProxyListItem
                  key={profileProxy.id}
                  profileProxy={profileProxy}
                  isSelf={isSelf}
                  profile={profile}
                />
              ))
            ) : (
              <div className="tw-py-4 tw-text-sm tw-italic tw-text-iron-500">
                {loading ? "Loading proxies..." : "No granted proxies"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
