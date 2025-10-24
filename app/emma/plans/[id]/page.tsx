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
          <div className="tw-flex-1 tw-min-w-0 tw-pt-8 tw-space-y-8 tw-pb-12 tw-px-2 lg:tw-px-4 xl:tw-px-8">
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
