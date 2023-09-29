import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { removeDistributionPlanCookie } from "../../../services/distribution-plan-api";
import {
  assertUnreachable,
  isEthereumAddress,
} from "../../../helpers/AllowlistToolHelpers";
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
    <div className="tw-pt-8 tw-pb-12 tw-max-w-[65.625rem] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1150px] tw-min-[1300px]:max-w-[1250px] tw-min-[1400px]:max-w-[1350px] tw-mx-auto tw-px-14">
      <div className="tw-hidden">
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
      <div className="tw-mt-6 tw-max-w-lg">
        <h1 className="tw-uppercase tw-text-white">
          Sign in With Your Seize Account
        </h1>
        <div className="tw-mt-8">
          <p className="tw-text-justify tw-mb-0 tw-mt-2 tw-text-base tw-font-light tw-text-neutral-300">
            You can sign in to use tool with your Seize (eth) account using
            Metamask or any other wallet.
          </p>
          <p className="tw-text-justify tw-mb-0 tw-mt-2 tw-text-base tw-font-light tw-text-neutral-300">
            There is no cost or gas to sign in.
          </p>
          <p className="tw-text-justify tw-mb-0 tw-mt-2 tw-text-base tw-font-light tw-text-neutral-300">
            You can use your any address in your consolidated account - we
            recommeng connecting to Seize with the hot address in your
            consolidated account.
          </p>
        </div>
        <div className="tw-mt-8">
          <button
            type="submit"
            className="tw-group tw-flex tw-gap-x-3 tw-items-center tw-justify-center tw-bg-primary-500 tw-px-6 tw-py-3.5 tw-font-medium tw-text-sm tw-text-white tw-border tw-border-primary-500 tw-rounded-lg hover:tw-bg-primary-600 hover:tw-border-primary-600 tw-transition tw-duration-300 tw-ease-out"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
