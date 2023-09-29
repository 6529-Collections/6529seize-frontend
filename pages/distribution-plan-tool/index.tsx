import DistributionPlanToolWrapper from "../../components/distribution-plan-tool/wrapper/DistributionPlanToolWrapper";
import DistributionPlanToolConnect from "../../components/distribution-plan-tool/connect/distributipn-plan-tool-connect";

export default function DistributionPlanTool() {
  return (
    <DistributionPlanToolWrapper>
      <div className="tw-flex tw-h-full tw-min-h-screen tw-bg-neutral-900">
        <div className="tw-pt-16 tw-space-y-8 tw-pb-12 tw-max-w-[65.625rem] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1150px] tw-min-[1300px]:max-w-[1250px] tw-min-[1400px]:max-w-[1350px] tw-mx-auto tw-px-14">
          <div className="tw-max-w-lg">
            <div className="tw-flex tw-flex-col">
              <p className="tw-text-white tw-font-semibold tw-mb-0">Allowlist Builder Tool</p>
              <p className="tw-text-justify tw-mb-0 tw-mt-4 tw-block tw-font-light tw-text-base tw-text-neutral-400">
                The Memes and the Allowlist Research Institute have built
                probably the worlds deepest expertise in allowlist management
                across 150 NFT drops and counting.
              </p>
              <p className="tw-text-justify tw-mb-0 tw-mt-4 tw-block tw-font-light tw-text-base tw-text-neutral-400">
                This tool was built for The Memes team to manage the memes drops
                and we are making it available for use for any member of the
                memes community.
              </p>
              <p className="tw-text-justify tw-mb-0 tw-mt-4 tw-block tw-font-light tw-text-base tw-text-neutral-400">
                As the tool can use computational resources, we have some mild
                anti-spam measures in place to protect system performance. We
                will reevaulate them over time.
              </p>
              <p className="tw-text-justify tw-mb-0 tw-mt-4 tw-block tw-font-light tw-text-base tw-text-neutral-400">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Lorem
                ipsum dolor sit.
              </p>
            </div>
          </div>
        </div>
        <div className="tw-w-1/2 tw-border-l tw-border-solid tw-border-r-0 tw-border-t-0 tw-border-b-0 tw-border-neutral-600">
          <DistributionPlanToolConnect />
        </div>
      </div>
    </DistributionPlanToolWrapper>
  );
}
