import { useContext } from "react";
import AllowlistToolBuilderAlert from "./AllowlistToolBuilderAlert";
import AllowlistToolBuilderCustomTokenPools from "./custom-token-pools/AllowlistToolBuilderCustomTokenPools";
import AllowlistToolBuilderOperations from "./operations/AllowlistToolBuilderOperations";
import AllowlistToolBuilderPhasesAndResults from "./phases-and-results/AllowlistToolBuilderPhasesAndWinners";
import AllowlistToolBuilderTokenPools from "./token-pools/AllowlistToolBuilderTokenPools";
import AllowlistToolBuilderTransferPools from "./transfer-pools/AllowlistToolBuilderTransferPools";
import AllowlistToolBuilderWalletPools from "./wallet-pools/AllowlistToolBuilderWalletPools";
import { Poppins } from "next/font/google";
import { AllowlistToolBuilderContext } from "./AllowlistToolBuilderContextWrapper";
import AllowlistToolBuilderEntityOperations from "./operations/AllowlistToolBuilderEntityOperations";
import AllowlistToolAnimationWrapper from "../common/animation/AllowlistToolAnimationWrapper";
import AllowlistToolAnimationWidth from "../common/animation/AllowlistToolAnimationWidth";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

export default function AllowlistToolBuilderPage() {
  const { allowlist, refreshKey, activeHistory } = useContext(
    AllowlistToolBuilderContext
  );
  return (
    <div
      id="allowlist-tool"
      className={`tw-min-h-screen tw-overflow-y-auto tw-relative tw-bg-neutral-950 ${poppins.className}`}
    >
      <div
        className="tw-overflow-y-auto tw-px-12 tw-mx-auto tw-pt-6 tw-pb-12"
      >
        <AllowlistToolBuilderOperations key={`operations-${refreshKey}`} />
        <div className="tw-space-y-6 tw-ml-80">
          <AllowlistToolBuilderAlert />

          <h1 className="tw-uppercase tw-mb-0 tw-float-none">
            {allowlist?.name}
          </h1>
          <AllowlistToolBuilderTransferPools
            key={`transfer-pools-${refreshKey}`}
          />
          <AllowlistToolBuilderTokenPools key={`token-pools-${refreshKey}`} />
          <AllowlistToolBuilderCustomTokenPools
            key={`custom-token-pools-${refreshKey}`}
          />
          <AllowlistToolBuilderWalletPools key={`wallet-pools-${refreshKey}`} />
          <AllowlistToolBuilderPhasesAndResults
            key={`phases-and-results-${refreshKey}`}
          />
        </div>
        <AllowlistToolAnimationWrapper mode="sync" initial={true}>
          {activeHistory && (
            <AllowlistToolAnimationWidth elementClasses="tw-fixed tw-right-0 tw-z-0 tw-inset-y-0 tw-top-[150px] tw-overflow-y-auto tw-w-80 tw-bg-neutral-900 tw-ring-1 tw-ring-white/5">
              <AllowlistToolBuilderEntityOperations
                activeHistory={activeHistory}
                key={`entity-operations-${refreshKey}`}
              />
            </AllowlistToolAnimationWidth>
          )}
        </AllowlistToolAnimationWrapper>
      </div>
    </div>
  );
}
