"use client";

import { useEffect, useState } from "react";
import {
  assertUnreachable,
  isEthereumAddress,
} from "@/helpers/AllowlistToolHelpers";
import DistributionPlanToolNotConnected from "./distribution-plan-tool-not-connected";
import DistributionPlanToolConnected from "./distribution-plan-tool-connected";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";

enum DistributionPlanAuth {
  NOT_CONNECTED = "NOT_CONNECTED",
  CONNECTED = "CONNECTED",
}
export default function DistributionPlanToolConnect() {
  const { address } = useSeizeConnectContext();
  const [authStatus, setAuthStatus] = useState<DistributionPlanAuth>(
    DistributionPlanAuth.NOT_CONNECTED
  );

  useEffect(() => {
    if (address && isEthereumAddress(address)) {
      setAuthStatus(DistributionPlanAuth.CONNECTED);
      return;
    }
    setAuthStatus(DistributionPlanAuth.NOT_CONNECTED);
  }, [address]);

  return (
    <div className="tw-mx-auto tw-w-full tw-min-w-0 2xl:tw-max-w-xl">
      <div>
        {(() => {
          switch (authStatus) {
            case DistributionPlanAuth.NOT_CONNECTED:
              return <DistributionPlanToolNotConnected />;
            case DistributionPlanAuth.CONNECTED:
              return <DistributionPlanToolConnected />;
            default:
              assertUnreachable(authStatus);
              return null;
          }
        })()}
      </div>
    </div>
  );
}
