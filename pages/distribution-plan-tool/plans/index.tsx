import DistributionPlanToolWrapper from "../../../components/distribution-plan-tool/wrapper/DistributionPlanToolWrapper";
import DistributionPlanToolPlans from "../../../components/distribution-plan-tool/plans/DistributionPlanToolPlans";
import DistributionPlanToolCreatePlan from "../../../components/distribution-plan-tool/create-plan/DistributionPlanToolCreatePlan";

export default function DistributionPlanToolPlansPage() {
  return (
    <DistributionPlanToolWrapper>
      <div className="tw-flex tw-w-full tw-h-full tw-min-h-screen">
        <div className="tw-text-center tw-pt-8 tw-space-y-8 tw-pb-12 tw-max-w-[65.625rem] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1150px] tw-min-[1300px]:max-w-[1250px] tw-min-[1400px]:max-w-[1350px] tw-mx-auto tw-px-14">
          <div className="tw-w-full">
            <div className="tw-w-full tw-flex tw-justify-between tw-items-center">
              <div>
                <h1 className="tw-uppercase tw-w-full">
                  Distribution Plan Tool
                </h1>
                <p className="tw-mb-0 tw-block tw-font-light tw-text-base tw-text-neutral-400">
                  The Seize distribution plan tool allows you to build a
                  distribution plan for your mint that includes airdrops,
                  allowlists and public minting in one or more phases.
                </p>
              </div>
              <DistributionPlanToolCreatePlan />
            </div>
            <DistributionPlanToolPlans />
          </div>
        </div>
      </div>
    </DistributionPlanToolWrapper>
  );
}
