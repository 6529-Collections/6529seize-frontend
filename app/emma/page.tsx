import DistributionPlanToolConnect from "@/components/distribution-plan-tool/connect/distribution-plan-tool-connect";
import DistributionPlanToolWrapper from "@/components/distribution-plan-tool/wrapper/DistributionPlanToolWrapper";
import { getEmmaReturnPath } from "@/components/distribution-plan-tool/emma-route";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { Metadata } from "next";

export default async function DistributionPlanTool({
  searchParams,
}: {
  readonly searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const { returnTo } = await searchParams;
  return (
    <DistributionPlanToolWrapper>
      <div className="tw-px-4 tw-py-8 sm:tw-px-6 lg:tw-px-8">
        <DistributionPlanToolConnect returnTo={getEmmaReturnPath(returnTo)} />
      </div>
    </DistributionPlanToolWrapper>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: t(DEFAULT_LOCALE, "emma.entryTitle"),
    description: t(DEFAULT_LOCALE, "emma.tools"),
  });
}
