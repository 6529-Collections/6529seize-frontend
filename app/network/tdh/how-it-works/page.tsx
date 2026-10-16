import { getAppMetadata } from "@/components/providers/metadata";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { loadVerificationSummary } from "@/lib/tdh/verification/summary.server";
import TdhDisclosure from "../shared/TdhDisclosure";
import TdhPageShell from "../shared/TdhPageShell";
import TdhPager from "../shared/TdhPager";
import TdhScrollSpyNav from "../shared/TdhScrollSpyNav";
import TdhSource from "../shared/TdhSource";
import { TDH_LINK } from "../shared/tdhStyles";
import { PipelineDiagram } from "./PipelineDiagram";
import HowItWorksStepsA from "./HowItWorksStepsA";
import HowItWorksStepsB from "./HowItWorksStepsB";

const STEP_COUNT = 14;
/**
 * The port's tests, pinned to the commit that last changed them, so the link
 * keeps pointing at the tests this page was checked against.
 */
const PORT_TESTS =
  "https://github.com/6529-Collections/6529seize-frontend/blob/76cf8af8a92e1ff378bfbcd67f000430f7724133/__tests__/lib/tdh/tdhV1Arithmetic.test.ts";

// Step 14 counts the days compared so far, from the daily feed.
export const revalidate = 600;

export default async function TdhHowItWorksPage() {
  const locale = DEFAULT_LOCALE;
  const summary = await loadVerificationSummary();
  const comparedDays = summary?.kind === "data" ? summary.record.days : null;
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
          <TdhDisclosure
            summary={t(locale, "network.tdh.how.basisSummary")}
            summaryClassName="tw-text-[15px]"
          >
            <p className="tw-m-0 tw-max-w-prose tw-pl-6 tw-text-sm tw-leading-6 tw-text-iron-300">
              {t(locale, "network.tdh.how.basis")}{" "}
              <a
                href={PORT_TESTS}
                className={TDH_LINK}
                rel="noopener noreferrer"
              >
                {t(locale, "network.tdh.how.basisTests")}
              </a>
              <TdhSource
                refs={["P26 §5.2", "Replay 2026-10-11"]}
                locale={locale}
              />
            </p>
          </TdhDisclosure>
        </>
      }
      headerExtra={
        // The rail is the steps' map on tablets; from lg the sticky list of
        // steps beside them takes its place, so they are never shown twice.
        <div className="tw-mt-6 tw-hidden md:tw-block lg:tw-hidden">
          <p className="tw-m-0 tw-mb-3 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400">
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
          <HowItWorksStepsB locale={locale} comparedDays={comparedDays} />
          <TdhPager current="/network/tdh/how-it-works" locale={locale} />
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
