"use client";

import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import CommonInfoBox from "@/components/utils/CommonInfoBox";
import { RateMatter } from "@/enums";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileProxyActionType } from "@/generated/models/ApiProfileProxyActionType";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import { amIUser } from "@/helpers/Helpers";
import { useContext, useEffect, useState } from "react";

const SUB_TITLE: Record<RateMatter, string> = {
  [RateMatter.NIC]: "NIC rate",
  [RateMatter.REP]: "give Rep for",
  [RateMatter.DROP_REP]: "give Drop Rep for",
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
  readonly profile: ApiIdentity;
  readonly type: RateMatter;
  readonly children: React.ReactNode;
}) {
  const { address } = useSeizeConnectContext();
  const { activeProfileProxy, connectedProfile } = useContext(AuthContext);

  const getIsProxyAndHaveAllowance = (): boolean => {
    switch (type) {
      case RateMatter.NIC:
        return !!activeProfileProxy?.actions.find(
          (action) =>
            action.action_type === ApiProfileProxyActionType.AllocateCic
        );
      case RateMatter.REP:
        return !!activeProfileProxy?.actions.find(
          (action) =>
            action.action_type === ApiProfileProxyActionType.AllocateRep
        );
      case RateMatter.DROP_REP:
        return false;
      default:
        assertUnreachable(type);
        return false;
    }
  };

  const getRaterContext = (): RaterContext => {
    if (!connectedProfile) {
      return RaterContext.NOT_CONNECTED;
    }
    if (!activeProfileProxy && amIUser({ profile, address })) {
      return RaterContext.MY_PROFILE;
    }
    if (!connectedProfile.handle) {
      return RaterContext.DONT_HAVE_PROFILE;
    }
    if (!!activeProfileProxy && !getIsProxyAndHaveAllowance()) {
      return RaterContext.PROXY_NO_ALLOWANCE;
    }
    if (
      !!activeProfileProxy &&
      activeProfileProxy.created_by.handle === profile.handle
    ) {
      return RaterContext.PROXY_GRANTOR_PROFILE;
    }

    return RaterContext.CAN_RATE;
  };

  const getRaterContextMessage = (context: RaterContext): string | null => {
    switch (context) {
      case RaterContext.NOT_CONNECTED:
        return `Please connect to ${SUB_TITLE[type]} ${profile.query}`;
      case RaterContext.DONT_HAVE_PROFILE:
        return `Please make profile to ${SUB_TITLE[type]} ${profile.query}`;
      case RaterContext.PROXY_NO_ALLOWANCE:
        return `You are acting as proxy and don't have allowance to ${SUB_TITLE[type]} ${profile.query}`;
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
    return <CommonInfoBox message={raterContextMessage} />;
  }

  return <>{children}</>;
}
