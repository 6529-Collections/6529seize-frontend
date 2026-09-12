import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { OfferPlanAnalysisView } from "./collect-offer-plan.types";

export default function OfferPlanExplanation({
  analysis,
}: {
  readonly analysis: OfferPlanAnalysisView | null;
}) {
  const locale = useBrowserLocale();
  return (
    <details className="tw-text-xs tw-leading-relaxed tw-text-iron-400">
      <summary className="tw-min-h-6 tw-cursor-pointer tw-rounded-md tw-py-1 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
        {t(locale, "collect.offerPlan.howItWorks")}
      </summary>
      <p>{t(locale, "collect.offerPlan.independent")}</p>
      <p>{t(locale, "collect.offerPlan.observed")}</p>
      <p>{t(locale, "collect.offerPlan.liability")}</p>
      {analysis && (
        <>
          <p>{analysis.policyDescription}</p>
          <p>
            {t(locale, "collect.offerPlan.policy", {
              policy: analysis.policy,
            })}
          </p>
        </>
      )}
    </details>
  );
}
