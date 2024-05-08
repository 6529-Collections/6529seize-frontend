import { ProxyMode } from "../UserPageProxy";
import { useState } from "react";
import ProxyListReceived from "./ProxyListReceived";
import ProxyListGranted from "./ProxyListGranted";
import CommonChangeAnimation from "../../../utils/animation/CommonChangeAnimation";
import dynamic from "next/dynamic";
import CommonAnimationOpacity from "../../../utils/animation/CommonAnimationOpacity";
import { ProfileProxy } from "../../../../generated/models/ProfileProxy";

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
}: {
  readonly onModeChange: (mode: ProxyMode) => void;
  readonly receivedProfileProxies: ProfileProxy[];
  readonly grantedProfileProxies: ProfileProxy[];
  readonly isSelf: boolean;
}) {
  const [proxyType, setProxyType] = useState<ProfileProxyListType>(
    ProfileProxyListType.RECEIVED
  );

  const components: Record<ProfileProxyListType, JSX.Element> = {
    [ProfileProxyListType.RECEIVED]: (
      <ProxyListReceived profileProxies={receivedProfileProxies} />
    ),
    [ProfileProxyListType.GRANTED]: (
      <ProxyListGranted profileProxies={grantedProfileProxies} />
    ),
  };

  return (
    <div className="tailwind-scope">
      <div className="tw-flex tw-items-center tw-justify-between">
        <ProxyListFilters selected={proxyType} setSelected={setProxyType} />
        <div>
          {isSelf && (
            <CommonAnimationOpacity>
              <button
                type="button"
                onClick={() => onModeChange(ProxyMode.CREATE)}
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
                <span>Create new</span>
              </button>
            </CommonAnimationOpacity>
          )}
        </div>
      </div>
      <CommonChangeAnimation>{components[proxyType]}</CommonChangeAnimation>
    </div>
  );
}
