import DistributionPlanToolWrapper from "../../../components/distribution-plan-tool/wrapper/DistributionPlanToolWrapper";
import DistributionPlanToolPlans from "../../../components/distribution-plan-tool/plans/DistributionPlanToolPlans";
import DistributionPlanToolCreatePlan from "../../../components/distribution-plan-tool/create-plan/DistributionPlanToolCreatePlan";

export default function DistributionPlanToolPlansPage() {
  return (
    <DistributionPlanToolWrapper>
      <div className="tw-flex tw-h-full tw-min-h-screen">
        <div className="tw-flex-1 tw-pt-8 tw-space-y-8 tw-pb-12 tw-mx-auto tw-px-14">
          <div className="tw-w-full">
            <div className="tw-w-full tw-flex tw-justify-between tw-items-start">
              <div className="tw-max-w-2xl">
                <div className="tw-flex tw-flex-col">
                  <h1 className="tw-uppercase tw-text-white">
                    Distribution Plan Tool
                  </h1>
                  <p className="tw-mb-0 tw-block tw-font-light tw-text-base tw-text-neutral-400">
                    The Seize distribution plan tool allows you to build a
                    distribution plan for your mint that includes airdrops,
                    allowlists and public minting in one or more phases.
                  </p>
                </div>
              </div>
              <div className="tw-ml-auto">
              <DistributionPlanToolCreatePlan />
              </div>
            </div>
            <DistributionPlanToolPlans />
          </div>
        </div>
      </div>
    </DistributionPlanToolWrapper>
  );
}
