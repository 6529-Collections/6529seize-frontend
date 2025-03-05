import { useEffect, useState } from "react";
import {
  assertUnreachable,
  isEthereumAddress,
} from "../../../helpers/AllowlistToolHelpers";
import DistributionPlanToolNotConnected from "./distribution-plan-tool-not-connected";
import DistributionPlanToolConnected from "./distribution-plan-tool-connected";
import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";

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
    <div className="xl:tw-max-w-2xl xl:tw-mx-auto lg:tw-px-8 xl:tw-px-0">
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
