import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { removeDistributionPlanCookie } from "../../../services/distribution-plan-api";
import { assertUnreachable, isEthereumAddress } from "../../../helpers/AllowlistToolHelpers";
import DistributionPlanToolNotConnected from "./distribution-plan-tool-not-connected";
import DistributionPlanToolConnected from "./distribution-plan-tool-connected";

enum DistributionPlanAuth {
  NOT_CONNECTED = "NOT_CONNECTED",
  CONNECTED = "CONNECTED",
}
export default function DistributionPlanToolConnect() {
  const { address } = useAccount();
  const [authStatus, setAuthStatus] = useState<DistributionPlanAuth>(
    DistributionPlanAuth.NOT_CONNECTED
  );

  useEffect(() => {
    removeDistributionPlanCookie();
    if (address && isEthereumAddress(address)) {
      setAuthStatus(DistributionPlanAuth.CONNECTED);
      return;
    }
    setAuthStatus(DistributionPlanAuth.NOT_CONNECTED);
  }, [address]);

  return (
    <div className="tw-text-center tw-pt-8 tw-space-y-8 tw-pb-12 tw-max-w-[65.625rem] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1150px] tw-min-[1300px]:max-w-[1250px] tw-min-[1400px]:max-w-[1350px] tw-mx-auto tw-px-14">
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
  );
}
