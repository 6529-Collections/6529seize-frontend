import Link from "next/link";
import { getAppMetadata } from "@/components/providers/metadata";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import TdhPageShell from "../shared/TdhPageShell";
import TdhScrollSpyNav from "../shared/TdhScrollSpyNav";
import TdhSource from "../shared/TdhSource";
import { TDH_LINK_STANDALONE } from "../shared/tdhStyles";
import { PipelineDiagram } from "./HowItWorksDiagrams";
import HowItWorksStepsA from "./HowItWorksStepsA";
import HowItWorksStepsB from "./HowItWorksStepsB";

const STEP_COUNT = 14;

export default function TdhHowItWorksPage() {
  const locale = DEFAULT_LOCALE;
  const steps = Array.from({ length: STEP_COUNT }, (_, index) => index + 1);
  const stepTitles = Object.fromEntries(
    steps.map((step) => [
      step,
      t(locale, `network.tdh.how.s${step}.title` as MessageKey),
    ])
  );

  return (
    <TdhPageShell
      locale={locale}
      current="/network/tdh/how-it-works"
      dropdownHref="/network/tdh/how-it-works"
      documentTitle={t(locale, "network.tdh.how.pageTitle")}
      title={t(locale, "network.tdh.how.title")}
      lede={
        <>
          <p className="tw-m-0">
            {t(locale, "network.tdh.how.lede")}
            <TdhSource refs={["D121", "D132"]} locale={locale} />
          </p>
          <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(locale, "network.tdh.how.basis")}
            <TdhSource
              refs={["P26 §5.2", "Replay 2026-10-11"]}
              locale={locale}
            />
          </p>
        </>
      }
      headerExtra={
        <div className="tw-mt-6">
          <p className="tw-m-0 tw-mb-3 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-500">
            {t(locale, "network.tdh.how.pipeline.title")}
          </p>
          <PipelineDiagram locale={locale} stepTitles={stepTitles} />
        </div>
      }
    >
      <div className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8 lg:tw-grid lg:tw-grid-cols-[13.5rem_minmax(0,1fr)] lg:tw-gap-10">
        <TdhScrollSpyNav
          label={t(locale, "network.tdh.how.stepsNav")}
          items={steps.map((step) => ({
            id: `step-${step}`,
            label: stepTitles[step] ?? "",
            prefix: formatInteger(locale, step),
          }))}
        />
        <div className="tw-min-w-0">
          <HowItWorksStepsA locale={locale} />
          <HowItWorksStepsB locale={locale} />
          <p className="tw-m-0 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-6">
            <Link
              href="/network/tdh/specification"
              className={TDH_LINK_STANDALONE}
            >
              {t(locale, "network.tdh.how.next")}
            </Link>
          </p>
        </div>
      </div>
    </TdhPageShell>
  );
}

export function generateMetadata() {
  return getAppMetadata(
    {
      title: t(DEFAULT_LOCALE, "network.tdh.how.pageTitle"),
      description: t(DEFAULT_LOCALE, "network.tdh.how.metadataDescription"),
    },
    { canonicalPath: "/network/tdh/how-it-works" }
  );
}
