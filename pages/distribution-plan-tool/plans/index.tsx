import DistributionPlanToolWrapper from "../../../components/distribution-plan-tool/wrapper/DistributionPlanToolWrapper";
import DistributionPlanToolPlans from "../../../components/distribution-plan-tool/plans/DistributionPlanToolPlans";
import DistributionPlanToolCreatePlan from "../../../components/distribution-plan-tool/create-plan/DistributionPlanToolCreatePlan";

export default function DistributionPlanToolPlansPage() {
  return (
    <DistributionPlanToolWrapper>
      <div className="tw-flex tw-h-full tw-min-h-screen">
        <div className="tw-flex-1 tw-pt-8 tw-space-y-8 tw-pb-12 tw-px-4 min-[992px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1150px] min-[1300px]:tw-max-w-[1250px] min-[1400px]:tw-max-w-[1350px] min-[1500px]:tw-max-w-[1450px] min-[1600px]:tw-max-w-[1550px] tw-mx-auto">
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
