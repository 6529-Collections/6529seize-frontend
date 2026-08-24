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
        <div className="tw-flex tw-h-full tw-min-h-screen tw-flex-col xl:tw-flex-row-reverse">
          <DistributionPlanToolSidebar />
          <div className="tw-min-w-0 tw-w-full tw-flex-1 tw-space-y-8 tw-px-4 tw-pb-12 tw-pt-6 sm:tw-px-6 sm:tw-pt-8 xl:tw-px-8">
            <DistributionPlanWarnings />
            <DistributionPlanToolPage id={id} />
          </div>
        </div>
      </DistributionPlanToolContextWrapper>
    </DistributionPlanToolWrapper>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "EMMA | Plans", description: "Tools" });
}
