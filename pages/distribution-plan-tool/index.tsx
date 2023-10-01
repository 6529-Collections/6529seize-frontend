import DistributionPlanToolWrapper from "../../components/distribution-plan-tool/wrapper/DistributionPlanToolWrapper";
import DistributionPlanToolConnect from "../../components/distribution-plan-tool/connect/distributipn-plan-tool-connect";

export default function DistributionPlanTool() {
  return (
    <DistributionPlanToolWrapper>
      <div className="tw-flex tw-h-full tw-min-h-screen tw-overflow-x-hidden tw-bg-neutral-900">
        <div className="tw-flex tw-flex-wrap tw-h-full tw-w-full lg:tw-min-h-screen tw-px-8 xl:tw-px-14 tw-space-y-8 lg:tw-space-y-0">
          <div className="lg:tw-w-1/2 xl:tw-w-[40%] 2xl:tw-w-1/2 tw-pt-8 md:tw-pt-14">
            <div className="2xl:tw-max-w-xl tw-mx-auto xl:tw-pr-16 2xl:tw-pr-0">
              <div className="tw-flex tw-flex-col">
                <p className="tw-text-white tw-font-semibold tw-mb-0 tw-text-base md:tw-text-lg">
                  Allowlist Builder Tool
                </p>
                <p className="tw-text-justify tw-mb-0 tw-mt-2 md:tw-mt-4 tw-block tw-font-light tw-text-base tw-leading-[1.6] tw-text-neutral-400">
                  The Memes and the Allowlist Research Institute have built
                  probably the worlds deepest expertise in allowlist management
                  across 150 NFT drops and counting.
                </p>
                <p className="tw-text-justify tw-mb-0 tw-mt-2 md:tw-mt-4 tw-block tw-font-light tw-text-base tw-leading-[1.6] tw-text-neutral-400">
                  This tool was built for The Memes team to manage the memes
                  drops and we are making it available for use for any member of
                  the memes community.
                </p>
                <p className="tw-text-justify tw-mb-0 tw-mt-2 md:tw-mt-4 tw-block tw-font-light tw-text-base tw-leading-[1.6] tw-text-neutral-400">
                  As the tool can use computational resources, we have some mild
                  anti-spam measures in place to protect system performance. We
                  will reevaulate them over time.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:tw-w-1/2 xl:tw-w-[60%] 2xl:tw-w-1/2 tw-pt-8 lg:tw-pt-12 tw-pb-12 md:tw-pb-0 tw-border-l-0 lg:tw-border-l tw-border-solid tw-border-r-0 tw-border-t-1 lg:tw-border-t-0 tw-border-b-0 tw-border-neutral-700">
            <DistributionPlanToolConnect />
          </div>
        </div>
      </div>
    </DistributionPlanToolWrapper>
  );
}
