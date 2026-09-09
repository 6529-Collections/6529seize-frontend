import Link from "next/link";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import TDHSection, { TDH_FOCUS, TDH_TEXT } from "./TDHSection";

const FAQ_KEYS = ["sale", "transfer", "new", "set", "rate", "xtdh"] as const;
const DETAIL_KEYS = ["days", "weights", "rounding", "boost"] as const;
const DISCLOSURE =
  "tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 last:tw-border-b-0";
const SUMMARY = `tw-cursor-pointer tw-py-4 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-100 ${TDH_FOCUS}`;

export default function TDHCalculationDetails({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <>
      <TDHSection
        id="tdh-changes"
        title={t(locale, "network.tdh.explainer.faq")}
      >
        {FAQ_KEYS.map((key) => (
          <details key={key} className={DISCLOSURE}>
            <summary className={SUMMARY}>
              {t(locale, `network.tdh.explainer.faq.${key}.title`)}
            </summary>
            <p className={`${TDH_TEXT} tw-pb-5`}>
              {t(locale, `network.tdh.explainer.faq.${key}.body`)}
            </p>
          </details>
        ))}
      </TDHSection>
      <TDHSection
        id="tdh-exact"
        title={t(locale, "network.tdh.explainer.exact")}
        description={t(locale, "network.tdh.explainer.exact.intro")}
      >
        {DETAIL_KEYS.map((key) => (
          <details key={key} className={DISCLOSURE}>
            <summary className={SUMMARY}>
              {t(locale, `network.tdh.explainer.exact.${key}.title`)}
            </summary>
            <div className="tw-space-y-3 tw-pb-5">
              <p className={TDH_TEXT}>
                {t(locale, `network.tdh.explainer.exact.${key}.body`)}
              </p>
              {key === "weights" && (
                <>
                  <p className={TDH_TEXT}>
                    {t(locale, "network.tdh.explainer.exact.weights.floor", {
                      minted: formatInteger(locale, 200),
                      floor: formatInteger(locale, 310),
                    })}
                  </p>
                  <p className={TDH_TEXT}>
                    {t(
                      locale,
                      "network.tdh.explainer.exact.weights.floorPolicy",
                      {
                        floor: formatInteger(locale, 310),
                      }
                    )}
                  </p>
                  <p className={TDH_TEXT}>
                    {t(locale, "network.tdh.explainer.exact.weights.burns", {
                      adjustment: formatInteger(locale, 2_588),
                      minted: formatInteger(locale, 6_529),
                      adjusted: formatInteger(locale, 3_941),
                    })}
                  </p>
                  <p className={TDH_TEXT}>
                    {t(locale, "network.tdh.explainer.exact.weights.rates")}
                  </p>
                </>
              )}
              {key === "rounding" && (
                <p className="tw-m-0 tw-rounded-lg tw-bg-iron-900 tw-p-4 tw-font-mono tw-text-sm tw-leading-6 tw-text-iron-100">
                  {t(locale, "network.tdh.explainer.exact.rounding.formula")}
                </p>
              )}
              {(key === "rounding" || key === "boost") && (
                <p className={TDH_TEXT}>
                  {t(locale, `network.tdh.explainer.exact.${key}.warning`)}
                </p>
              )}
            </div>
          </details>
        ))}
        <div className="tw-mt-5 tw-flex tw-flex-wrap tw-gap-x-6 tw-gap-y-3 tw-text-sm">
          <Link
            className={`tw-text-primary-300 ${TDH_FOCUS}`}
            href="https://github.com/6529-Collections/6529seize-backend/blob/main/src/tdhLoop/tdh.ts"
          >
            {t(locale, "network.tdh.explainer.exact.source")}
          </Link>
          <Link
            className={`tw-text-primary-300 ${TDH_FOCUS}`}
            href="https://github.com/6529-Collections/6529seize-backend/blob/main/src/tdhLoop/tdh_consolidation.ts"
          >
            {t(locale, "network.tdh.explainer.exact.sourceConsolidation")}
          </Link>
        </div>
      </TDHSection>
    </>
  );
}
