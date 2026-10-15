import { ArrowDownIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import TdhSource from "../../shared/TdhSource";
import { TDH_SERIES } from "../../shared/tdhStyles";

type Series = keyof typeof TDH_SERIES | "neutral";

function Node({
  label,
  series,
}: {
  readonly label: string;
  readonly series: Series;
}) {
  return (
    <span className="tw-inline-flex tw-min-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-text-iron-100">
      <span
        aria-hidden="true"
        className={`tw-size-2 tw-shrink-0 tw-rounded-full ${
          series === "neutral" ? "tw-bg-iron-600" : TDH_SERIES[series].bg
        }`}
      />
      {label}
    </span>
  );
}

function Next() {
  return (
    <ArrowRightIcon
      aria-hidden="true"
      className="tw-size-4 tw-shrink-0 tw-text-iron-400"
    />
  );
}

function Lane({
  title,
  nodes,
}: {
  readonly title: string;
  readonly nodes: ReadonlyArray<{
    readonly label: string;
    readonly series: Series;
  }>;
}) {
  return (
    <div className="tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950 tw-p-3">
      <p className="tw-m-0 tw-mb-2 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
        {title}
      </p>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-1.5">
        {nodes.map((node, index) => (
          <span
            key={node.label}
            className="tw-inline-flex tw-items-center tw-gap-1.5"
          >
            {index > 0 && <Next />}
            <Node label={node.label} series={node.series} />
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * The daily comparison as two lanes that meet: our own computation (Ethereum
 * to the Rust core, the Python reference on the same input) and the object
 * under test (6529.io's backend and its upload).
 */
export function DailyFlow({ locale }: { readonly locale: SupportedLocale }) {
  const label = (key: string) =>
    t(locale, `network.tdh.verify.flow.${key}` as MessageKey);
  return (
    <figure className="tw-m-0">
      <figcaption className="tw-mb-3 tw-text-sm tw-font-medium tw-text-iron-200">
        {label("title")}
      </figcaption>
      <p className="tw-sr-only">{label("text")}</p>
      <div
        aria-hidden="true"
        className="tw-grid tw-gap-2 md:tw-grid-cols-[minmax(0,1fr)_auto_minmax(0,11rem)] md:tw-items-center"
      >
        <div className="tw-space-y-2">
          <div className="tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950 tw-p-3">
            <p className="tw-m-0 tw-mb-2 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
              {label("ours")}
            </p>
            <div className="tw-grid tw-grid-cols-[auto_auto_minmax(0,1fr)] tw-items-center tw-gap-x-1.5 tw-gap-y-1">
              <Node label={label("ethereum")} series="neutral" />
              <Next />
              <span>
                <Node label={label("rust")} series="rust" />
              </span>
              <span className="tw-col-start-3 tw-flex tw-flex-wrap tw-items-center tw-gap-1.5 tw-pl-3">
                <span className="tw-h-5 tw-w-3 tw-shrink-0 -tw-translate-y-2 tw-rounded-bl-md tw-border-0 tw-border-b-2 tw-border-l-2 tw-border-solid tw-border-iron-600" />
                <span className="tw-text-xs tw-text-iron-400">
                  {label("handoff")}
                </span>
                <Next />
                <Node label={label("python")} series="python" />
              </span>
            </div>
          </div>
          <Lane
            title={label("theirs")}
            nodes={[
              { label: label("backend"), series: "live" },
              { label: label("arweave"), series: "live" },
            ]}
          />
        </div>
        <div className="tw-flex tw-justify-center tw-text-iron-400">
          <ArrowDownIcon className="tw-size-5 md:tw-hidden" />
          <ArrowRightIcon className="tw-hidden tw-size-5 md:tw-block" />
        </div>
        <div className="tw-flex tw-flex-col tw-items-start tw-gap-1.5">
          <Node label={label("compare")} series="neutral" />
          <ArrowDownIcon className="tw-ml-4 tw-size-4 tw-text-iron-400" />
          <Node label={label("published")} series="neutral" />
          <ArrowDownIcon className="tw-ml-4 tw-size-4 tw-text-iron-400" />
          <Node label={label("page")} series="neutral" />
        </div>
      </div>
      <p className="tw-m-0 tw-mt-3 tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-dashed tw-border-primary-400/50 tw-px-3 tw-py-1 tw-text-xs tw-text-primary-300">
        {label("sameCode")}
      </p>
    </figure>
  );
}

const STEPS = [
  { key: "snapshot", refs: ["P26 §4.2"] },
  { key: "inputs", refs: ["P53 §12", "D132"] },
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
        className="tw-m-0 tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-iron-50"
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
