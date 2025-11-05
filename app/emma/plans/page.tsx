import DistributionPlanToolCreatePlan from "@/components/distribution-plan-tool/create-plan/DistributionPlanToolCreatePlan";
import DistributionPlanToolPlans from "@/components/distribution-plan-tool/plans/DistributionPlanToolPlans";
import DistributionPlanToolWrapper from "@/components/distribution-plan-tool/wrapper/DistributionPlanToolWrapper";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export default function DistributionPlanToolPlansPage() {
  return (
    <DistributionPlanToolWrapper>
      <div className="tw-flex tw-h-full tw-min-h-screen">
        <div className="tw-flex-1 tw-pt-8 tw-space-y-8 tw-pb-12 tw-px-2 lg:tw-px-6 xl:tw-px-8 tw-mx-auto">
          <div className="tw-w-full">
            <div className="tw-w-full tw-flex tw-justify-between tw-items-start">
              <div className="tw-max-w-2xl">
                <div className="tw-flex tw-flex-col">
                  <h1 className="text-xl text-white">EMMA</h1>
                  <p className="tw-mb-0 tw-block tw-font-light tw-text-base tw-text-iron-400">
                    The Seize distribution plan tool allows you to build a distribution plan for your mint that includes airdrops, allowlists and public minting in one or more phases.
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

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "EMMA | Plans", description: "Tools" });
}
