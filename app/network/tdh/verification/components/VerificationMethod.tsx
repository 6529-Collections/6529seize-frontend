import { ArrowDownIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import TdhSource from "../../shared/TdhSource";
import { TDH_SERIES } from "../../shared/tdhStyles";

type Series = keyof typeof TDH_SERIES | "neutral";

interface FlowNode {
  readonly key: string;
  readonly series: Series;
}

const STAGES: ReadonlyArray<readonly FlowNode[]> = [
  [
    { key: "ethereum", series: "neutral" },
    { key: "backend", series: "live" },
  ],
  [
    { key: "rust", series: "rust" },
    { key: "python", series: "python" },
    { key: "arweave", series: "live" },
  ],
  [{ key: "compare", series: "neutral" }],
  [
    { key: "published", series: "neutral" },
    { key: "page", series: "neutral" },
  ],
];

function Arrow() {
  return (
    <div
      aria-hidden="true"
      className="tw-flex tw-items-center tw-justify-center tw-text-iron-500"
    >
      <ArrowDownIcon className="tw-size-5 md:tw-hidden" />
      <ArrowRightIcon className="tw-hidden tw-size-5 md:tw-block" />
    </div>
  );
}

/** The daily comparison as a four-stage flow, horizontal from `md`. */
export function DailyFlow({ locale }: { readonly locale: SupportedLocale }) {
  const label = (key: string) =>
    t(locale, `network.tdh.verify.flow.${key}` as MessageKey);
  return (
    <figure className="tw-m-0">
      <figcaption className="tw-mb-3 tw-text-sm tw-font-medium tw-text-iron-200">
        {t(locale, "network.tdh.verify.flow.title")}
      </figcaption>
      <div className="tw-grid tw-gap-2 md:tw-grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,0.8fr)_auto_minmax(0,1fr)] md:tw-items-center">
        {STAGES.map((stage, stageIndex) => (
          <div
            key={stage.map((node) => node.key).join("-")}
            className="tw-contents"
          >
            {stageIndex > 0 && <Arrow />}
            <ul className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-2 tw-p-0">
              {stage.map((node) => (
                <li
                  key={node.key}
                  className="tw-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-100"
                >
                  <span
                    aria-hidden="true"
                    className={`tw-size-2 tw-shrink-0 tw-rounded-full ${
                      node.series === "neutral"
                        ? "tw-bg-iron-600"
                        : TDH_SERIES[node.series].bg
                    }`}
                  />
                  {label(node.key)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="tw-m-0 tw-mt-3 tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-dashed tw-border-primary-400/50 tw-px-3 tw-py-1 tw-text-xs tw-text-primary-300">
        {t(locale, "network.tdh.verify.flow.sameCode")}
      </p>
      <p className="tw-sr-only">{t(locale, "network.tdh.verify.flow.text")}</p>
    </figure>
  );
}

const STEPS = [
  { key: "snapshot", refs: ["P26 §4.2"] },
  { key: "inputs", refs: ["P53 §12"] },
  { key: "exact", refs: ["P53 §12"] },
  { key: "classes", refs: ["P38 §3.3"] },
  { key: "after", refs: ["P53 §4.5", "D132"] },
] as const;

export default function VerificationMethod({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <section aria-labelledby="tdh-verify-method-heading" className="tw-mt-12">
      <h2
        id="tdh-verify-method-heading"
        className="tw-m-0 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-50"
      >
        {t(locale, "network.tdh.verify.method.heading")}
      </h2>
      <div className="tw-mt-4 tw-grid tw-gap-8 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <ol className="tw-m-0 tw-list-none tw-space-y-4 tw-p-0">
          {STEPS.map((step, index) => (
            <li
              key={step.key}
              className="tw-grid tw-grid-cols-[1.75rem_minmax(0,1fr)] tw-gap-3"
            >
              <span className="tw-flex tw-size-7 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-text-xs tw-font-medium tw-tabular-nums tw-text-iron-200">
                {index + 1}
              </span>
              <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
                <strong className="tw-font-semibold tw-text-iron-100">
                  {t(
                    locale,
                    `network.tdh.verify.method.${step.key}.title` as MessageKey
                  )}
                </strong>{" "}
                {t(
                  locale,
                  `network.tdh.verify.method.${step.key}.body` as MessageKey
                )}
                <TdhSource refs={step.refs} locale={locale} />
              </p>
            </li>
          ))}
          <li className="tw-border-0 tw-border-l-2 tw-border-solid tw-border-iron-700 tw-pl-4 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(locale, "network.tdh.verify.method.validators")}
            <TdhSource refs={["P53 §12"]} locale={locale} />
          </li>
        </ol>
        <DailyFlow locale={locale} />
      </div>
    </section>
  );
}
