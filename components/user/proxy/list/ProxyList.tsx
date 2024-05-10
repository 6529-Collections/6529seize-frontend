import { ProxyMode } from "../UserPageProxy";
import { useState } from "react";
import CommonChangeAnimation from "../../../utils/animation/CommonChangeAnimation";
import dynamic from "next/dynamic";
import CommonAnimationOpacity from "../../../utils/animation/CommonAnimationOpacity";
import { ProfileProxy } from "../../../../generated/models/ProfileProxy";
import ProxyListItem from "./ProxyListItem";
import { IProfileAndConsolidations } from "../../../../entities/IProfile";

export enum ProfileProxyListType {
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
}: {
  readonly onModeChange: (mode: ProxyMode) => void;
  readonly receivedProfileProxies: ProfileProxy[];
  readonly grantedProfileProxies: ProfileProxy[];
  readonly isSelf: boolean;
  readonly profile: IProfileAndConsolidations;
}) {
  const [proxyType, setProxyType] = useState<ProfileProxyListType>(
    ProfileProxyListType.RECEIVED
  );

  const components: Record<ProfileProxyListType, JSX.Element> = {
    [ProfileProxyListType.RECEIVED]: (
      <div className="tw-space-y-8">
        {receivedProfileProxies.map((profileProxy) => (
          <ProxyListItem
            key={profileProxy.id}
            profileProxy={profileProxy}
            isSelf={isSelf}
            profile={profile}
          />
        ))}
      </div>
    ),
    [ProfileProxyListType.GRANTED]: (
      <div className="tw-space-y-8">
        {grantedProfileProxies.map((profileProxy) => (
          <ProxyListItem
            key={profileProxy.id}
            profileProxy={profileProxy}
            isSelf={isSelf}
            profile={profile}
          />
        ))}
      </div>
    ),
  };

  return (
    <div className="tailwind-scope">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-3">
        <ProxyListFilters selected={proxyType} setSelected={setProxyType} />
        <div>
          {isSelf && (
            <CommonAnimationOpacity>
              <button
                type="button"
                onClick={() => onModeChange(ProxyMode.CREATE)}
                className="tw-whitespace-nowrap w-flex tw-items-center tw-justify-center tw-relative tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-leading-5 tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
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
                <span>Create new</span>
              </button>
            </CommonAnimationOpacity>
          )}
        </div>
      </div>
      <div className="tw-mt-2 sm:tw-mt-4">
        <CommonChangeAnimation>{components[proxyType]}</CommonChangeAnimation>
      </div>
    </div>
  );
}
