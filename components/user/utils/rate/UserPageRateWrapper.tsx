import { useAccount } from "wagmi";
import {
  IProfileAndConsolidations,
  RateMatter,
} from "../../../../entities/IProfile";
import { useContext, useEffect, useState } from "react";
import { amIUser } from "../../../../helpers/Helpers";
import { AuthContext } from "../../../auth/Auth";
import { ProfileProxyActionType } from "../../../../generated/models/ProfileProxyActionType";
import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";

const SUB_TITLE: Record<RateMatter, string> = {
  [RateMatter.CIC]: "CIC rate",
  [RateMatter.REP]: "give Rep for",
};

enum RaterContext {
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
  const { activeProfileProxy, connectedProfile } = useContext(AuthContext);

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

  const getRaterContext = (): RaterContext => {
    if (!connectedProfile) {
      return RaterContext.NOT_CONNECTED;
    }
    if (!connectedProfile.profile?.handle) {
      return RaterContext.DONT_HAVE_PROFILE;
    }
    if (!!activeProfileProxy && !getIsProxyAndHaveAllowance()) {
      return RaterContext.PROXY_NO_ALLOWANCE;
    }
    if (
      !!activeProfileProxy &&
      activeProfileProxy.created_by.handle === profile.profile?.handle
    ) {
      return RaterContext.PROXY_GRANTOR_PROFILE;
    }
    if (!activeProfileProxy && amIUser({ profile, address })) {
      return RaterContext.MY_PROFILE;
    }
    return RaterContext.CAN_RATE;
  };

  const getRaterContextMessage = (context: RaterContext): string | null => {
    switch (context) {
      case RaterContext.NOT_CONNECTED:
        return `Please connect to ${SUB_TITLE[type]} ${profile.profile?.handle}`;
      case RaterContext.DONT_HAVE_PROFILE:
        return `Please make profile to ${SUB_TITLE[type]} ${profile.profile?.handle}`;
      case RaterContext.PROXY_NO_ALLOWANCE:
        return `You are acting as proxy and don't have allowance to ${SUB_TITLE[type]} ${profile.profile?.handle}`;
      case RaterContext.PROXY_GRANTOR_PROFILE:
        return `You are acting as proxy and can't ${SUB_TITLE[type]} proxy grantor profile`;
      case RaterContext.MY_PROFILE:
        return `You can't ${SUB_TITLE[type]} your own profile`;
      case RaterContext.CAN_RATE:
        return null;
    }
  };

  const [raterContext, setRaterContext] = useState<RaterContext>(
    getRaterContext()
  );

  const [raterContextMessage, setRaterContextMessage] = useState<string | null>(
    getRaterContextMessage(raterContext)
  );

  useEffect(() => {
    const context = getRaterContext();
    setRaterContext(context);
    setRaterContextMessage(getRaterContextMessage(context));
  }, [connectedProfile, activeProfileProxy, address, profile, type]);

  if (raterContextMessage) {
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
              {raterContextMessage}
            </h3>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
