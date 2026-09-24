import EmmaTitle from "@/components/distribution-plan-tool/EmmaTitle";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import DistributionPlanToolCreatePlan from "@/components/distribution-plan-tool/create-plan/DistributionPlanToolCreatePlan";
import DistributionPlanToolPlans from "@/components/distribution-plan-tool/plans/DistributionPlanToolPlans";
import DistributionPlanToolWrapper from "@/components/distribution-plan-tool/wrapper/DistributionPlanToolWrapper";
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export default function DistributionPlanToolPlansPage() {
  return (
    <DistributionPlanToolWrapper>
      <div className="tw-flex tw-h-full tw-min-h-screen">
        <div className="tw-mx-auto tw-min-w-0 tw-flex-1 tw-space-y-8 tw-px-2 tw-pb-12 tw-pt-8 lg:tw-px-6 xl:tw-px-8">
          <div className="tw-w-full tw-space-y-4">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-4">
              <EmmaTitle />
              <div className="tw-shrink-0 tw-whitespace-nowrap">
                <DistributionPlanToolCreatePlan />
              </div>
            </div>
            <p className="tw-m-0 tw-max-w-2xl tw-text-base tw-font-light tw-text-iron-400">
              {t(DEFAULT_LOCALE, "emma.plansDescription")}
            </p>
          </div>
          <DistributionPlanToolPlans />
        </div>
      </div>
    </DistributionPlanToolWrapper>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: t(DEFAULT_LOCALE, "emma.plansTitle"),
    description: t(DEFAULT_LOCALE, "emma.tools"),
  });
}
