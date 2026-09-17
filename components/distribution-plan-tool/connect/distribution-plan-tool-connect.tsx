"use client";

import { isEthereumAddress } from "@/helpers/AllowlistToolHelpers";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { isAuthResolving } from "@/components/auth/authResolution";
import AuthLoadingPlaceholder from "@/components/auth/AuthLoadingPlaceholder";
import DistributionPlanToolNotConnected from "./distribution-plan-tool-not-connected";
import DistributionPlanToolConnected from "./distribution-plan-tool-connected";

export default function DistributionPlanToolConnect() {
  const { address, connectionState } = useSeizeConnectContext();
  let content;
  if (isAuthResolving(connectionState)) content = <AuthLoadingPlaceholder />;
  else if (address && isEthereumAddress(address))
    content = <DistributionPlanToolConnected />;
  else content = <DistributionPlanToolNotConnected />;
  return (
    <div className="tw-mx-auto tw-w-full tw-min-w-0 2xl:tw-max-w-xl">
      {content}
    </div>
  );
}
