import { useAccount } from "wagmi";
import {
  IProfileAndConsolidations,
  RateMatter,
} from "../../../../entities/IProfile";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";
import { useContext, useEffect, useState } from "react";
import { amIUser } from "../../../../helpers/Helpers";
import { AuthContext } from "../../../auth/Auth";
import { ProfileProxyActionType } from "../../../../generated/models/ProfileProxyActionType";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";

const SUB_TITLE: Record<RateMatter, string> = {
  [RateMatter.CIC]: "CIC rate",
  [RateMatter.REP]: "give Rep for",
};

enum RateContext {
  NOT_CONNECTED = "NOT_CONNECTED",
  DONT_HAVE_PROFILE = "DONT_HAVE_PROFILE",
  PROXY_NO_ALLOWANCE = "PROXY_NO_ALLOWANCE",
  PROXY_GRANTOR_PROFILE = "PROXY_GRANTOR_PROFILE",
  MY_PROFILE = "MY_PROFILE",
  CAN_RATE = "CAN_RATE",
}

export default function UserPageRateWrapper({
  profile,
  type,
  children,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly type: RateMatter;
  readonly children: React.ReactNode;
}) {
  const { address } = useAccount();
  const { activeProfileProxy } = useContext(AuthContext);
  const { data: connectedProfile } = useQuery<IProfileAndConsolidations>({
    queryKey: [QueryKey.PROFILE, address?.toLowerCase()],
    queryFn: async () =>
      await commonApiFetch<IProfileAndConsolidations>({
        endpoint: `profiles/${address}`,
      }),
    enabled: !!address,
  });

  const [rateContext, setRateContext] = useState<RateContext>(
    RateContext.MY_PROFILE
  );

  const [isMyProfile, setIsMyProfile] = useState<boolean>(true);
  const [iHaveProfile, setIHaveProfile] = useState<boolean>(false);
  const [iAmConnected, setIAmConnected] = useState<boolean>(false);

  useEffect(
    () => setIsMyProfile(amIUser({ profile, address })),
    [profile, address]
  );

  useEffect(
    () => setIHaveProfile(!!connectedProfile?.profile?.handle),
    [connectedProfile]
  );

  useEffect(() => setIAmConnected(!!address), [address]);

  const getIsProxyAndHaveAllowance = (): boolean => {
    switch (type) {
      case RateMatter.CIC:
        return !!activeProfileProxy?.actions.find(
          (action) => action.action_type === ProfileProxyActionType.AllocateCic
        );
      case RateMatter.REP:
        return !!activeProfileProxy?.actions.find(
          (action) => action.action_type === ProfileProxyActionType.AllocateRep
        );
      default:
        assertUnreachable(type);
        return false;
    }
  };

  const [isProxyAndHaveAllowance, setIsProxyAndHaveAllowance] =
    useState<boolean>(getIsProxyAndHaveAllowance());

  useEffect(
    () => setIsProxyAndHaveAllowance(getIsProxyAndHaveAllowance()),
    [activeProfileProxy]
  );

  if (!iAmConnected) {
    return (
      <div className="tw-w-full sm:tw-w-auto tw-inline-flex tw-items-center tw-rounded-lg tw-bg-primary-400/5 tw-border tw-border-solid tw-border-primary-400/30 tw-px-4 tw-py-3">
        <div className="tw-flex tw-items-center">
          <svg
            className="tw-flex-shrink-0 tw-self-center tw-w-5 tw-h-5 tw-text-primary-300"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="tw-ml-3 tw-self-center">
            <h3 className="tw-text-sm sm:tw-text-md tw-mb-0 tw-font-semibold tw-text-primary-300">
              Please connect to {SUB_TITLE[type]} {profile.profile?.handle}
            </h3>
          </div>
        </div>
      </div>
    );
  }

  if (!iHaveProfile) {
    return (
      <div className="tw-w-full sm:tw-w-auto tw-inline-flex tw-items-center tw-rounded-lg tw-bg-primary-400/5 tw-border tw-border-solid tw-border-primary-400/30 tw-px-4 tw-py-3">
        <div className="tw-flex tw-items-center">
          <svg
            className="tw-flex-shrink-0 tw-self-center tw-w-5 tw-h-5 tw-text-primary-300"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="tw-ml-3 tw-self-center">
            <h3 className="tw-text-sm tw-mb-0 tw-font-semibold tw-text-primary-300">
              Please make profile to {SUB_TITLE[type]} {profile.profile?.handle}
            </h3>
          </div>
        </div>
      </div>
    );
  }

  if (!!activeProfileProxy && !isProxyAndHaveAllowance) {
    return (
      <div className="tw-w-full sm:tw-w-auto tw-inline-flex tw-items-center tw-rounded-lg tw-bg-primary-400/5 tw-border tw-border-solid tw-border-primary-400/30 tw-px-4 tw-py-3">
        <div className="tw-flex tw-items-center">
          <svg
            className="tw-flex-shrink-0 tw-self-center tw-w-5 tw-h-5 tw-text-primary-300"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="tw-ml-3 tw-self-center">
            <h3 className="tw-text-sm tw-mb-0 tw-font-semibold tw-text-primary-300">
              You are acting as proxy and don&apos;t have allowance to{" "}
              {SUB_TITLE[type]} {profile.profile?.handle}
            </h3>
          </div>
        </div>
      </div>
    );
  }

  if (isMyProfile) {
    return null;
  }

  return <>{children}</>;
}
