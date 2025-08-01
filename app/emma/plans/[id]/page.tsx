import DistributionPlanToolContextWrapper from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import DistributionPlanToolPage from "@/components/distribution-plan-tool/DistributionPlanToolPage";
import DistributionPlanWarnings from "@/components/distribution-plan-tool/common/DistributionPlanWarnings";
import DistributionPlanToolSidebar from "@/components/distribution-plan-tool/distribution-plan-tool-sidebar/DistributionPlanToolSidebar";
import DistributionPlanToolWrapper from "@/components/distribution-plan-tool/wrapper/DistributionPlanToolWrapper";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export default async function DistributionPlanToolPlan({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <DistributionPlanToolWrapper>
      <DistributionPlanToolContextWrapper>
        <div className="tw-flex tw-h-full tw-min-h-screen">
          <div className="tw-flex-1 tw-pt-8 tw-space-y-8 tw-pb-12 tw-max-w-[65.625rem] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1150px] tw-min-[1300px]:max-w-[1250px] tw-min-[1400px]:max-w-[1350px] tw-mx-auto tw-px-14">
            <DistributionPlanWarnings />
            <DistributionPlanToolPage id={id} />
          </div>
          <DistributionPlanToolSidebar />
        </div>
      </DistributionPlanToolContextWrapper>
    </DistributionPlanToolWrapper>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "EMMA | Plans", description: "Tools" });
}
