import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { getAppMetadata } from "@/components/providers/metadata";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { loadFormalManifest } from "@/lib/tdh/formal/loadFormalManifest.server";
import { conformanceRun } from "@/lib/tdh/formal/manifest";
import {
  loadVerificationSummary,
  type VerificationSummary,
} from "@/lib/tdh/verification/summary.server";
import { leanRound } from "../formal/formalStatus";
import { LEAN_LATEST_ROUND, LEAN_ROUND_5 } from "../formal/leanResults";
import DifftestRounds from "../shared/DifftestRounds";
import TdhArrowLink from "../shared/TdhArrowLink";
import TdhPageShell from "../shared/TdhPageShell";
import TdhPager from "../shared/TdhPager";
import TdhSection from "../shared/TdhSection";
import TdhDisclosure from "../shared/TdhDisclosure";
import TdhStatusPill, { TdhStatusLegend } from "../shared/TdhStatusPill";
import { TDH_CARD, TDH_FOCUS_RING } from "../shared/tdhStyles";
import { formatCycleDate } from "../verification/components/verificationFormat";
import { CheckMatrix, LineageDiagram } from "./ImplementationDiagrams";
import ProgramCards, { type DailyBuilds } from "./ProgramCards";
import VectorAnatomy from "./VectorAnatomy";
import VectorBrowser from "./VectorBrowser";
import VectorsByHand from "./VectorsByHand";
import VectorFormat from "./VectorFormat";
import { VECTOR_COUNT } from "./vectors";
import { P26 } from "../shared/tdhFacts";

// The agreement card reads the latest daily verification files.
export const revalidate = 600;

const TABLE_SOURCES = [
  "P26 §13",
  "D112",
  "D119",
  "D125",
  "D132",
  "D116",
  "P52 §3.4",
] as const;
const CHECKS = [
  { key: "vectors", refs: ["P26 §13"] },
  { key: "replays", refs: ["Replay 2026-10-11", "P26 §13"] },
  { key: "difftest", refs: ["P26 §13", "Difftest Oct 15–16"] },
  { key: "dual", refs: ["D125", "P53 §4.5"] },
  { key: "daily", refs: ["D132"] },
  { key: "lean", refs: [] },
  { key: "proofs", refs: ["D119", "D128"] },
] as const;
const PROSE =
  "tw-m-0 tw-max-w-[34rem] tw-text-base tw-leading-7 tw-text-iron-200";

function LatestAgreement({
  locale,
  summary,
}: {
  readonly locale: SupportedLocale;
  readonly summary: VerificationSummary | null;
}) {
  if (summary === null || summary.kind === "awaiting") {
    return null;
  }
  const values = {
    date: formatCycleDate(locale, summary.date),
    live: formatInteger(locale, summary.liveEqual ?? 0),
    total: formatInteger(locale, summary.liveTotal ?? 0),
    python: formatInteger(locale, summary.pythonEqual ?? 0),
  };
  return (
    <Link
      href={`/network/tdh/verification/${summary.cycleDay}`}
      className={`${TDH_CARD} tw-group tw-flex tw-flex-col tw-gap-3 tw-p-5 tw-no-underline tw-transition-colors hover:tw-border-primary-400/50 motion-reduce:tw-transition-none sm:tw-flex-row sm:tw-items-center sm:tw-justify-between ${TDH_FOCUS_RING}`}
    >
      <span className="tw-flex tw-min-w-0 tw-flex-col tw-gap-2">
        <span className="tw-flex tw-flex-wrap tw-gap-2">
          <TdhStatusPill pill={summary.verdict} locale={locale} size="sm" />
        </span>
        <span className="tw-text-sm tw-tabular-nums tw-leading-6 tw-text-iron-100">
          {/* The record on its own line, then the latest day's counts. */}
          <span className="tw-block tw-font-semibold tw-text-iron-50">
            {t(locale, "network.tdh.explainer.verified.record", {
              allEqual: formatInteger(locale, summary.record.allEqual),
              days: formatInteger(locale, summary.record.days),
              first: formatCycleDate(locale, summary.record.firstDate),
            })}
          </span>
          {summary.pythonEqual === null
            ? t(locale, "network.tdh.impl.latest.noPython", values)
            : t(locale, "network.tdh.impl.latest.body", values)}
        </span>
      </span>
      <span className="tw-inline-flex tw-shrink-0 tw-items-center tw-gap-1.5 tw-text-sm tw-font-medium tw-text-primary-300">
        {t(locale, "network.tdh.impl.latest.link")}
        <ArrowRightIcon aria-hidden="true" className="tw-size-4" />
      </span>
    </Link>
  );
}

export default async function TdhImplementationsPage() {
  const locale = DEFAULT_LOCALE;
  const [summary, formal] = await Promise.all([
    loadVerificationSummary(),
    loadFormalManifest(),
  ]);
  const leanRun = conformanceRun(formal.manifest);
  // The builds the daily comparison ran, from its latest day's file.
  const daily: DailyBuilds | null =
    summary?.kind === "data"
      ? {
          rust: summary.rustCommit,
          python: summary.pythonCommit,
          date: summary.date,
        }
      : null;
  const round = leanRound(formal.manifest);
  const lean = {
    passed: leanRun?.passed ?? 0,
    total: leanRun?.total ?? 0,
    checks: leanRun?.checks ?? 0,
    spec: (
      formal.manifest.documents?.specification?.lastChange ??
      formal.manifest.source.commit
    ).slice(0, 7),
    round,
    newer:
      round < LEAN_LATEST_ROUND
        ? {
            passed: LEAN_ROUND_5.vectorsPassed,
            total: LEAN_ROUND_5.vectorsTotal,
            spec: LEAN_ROUND_5.specCommit,
            commit: LEAN_ROUND_5.commit,
          }
        : null,
  };
  return (
    <TdhPageShell
      locale={locale}
      current="/network/tdh/implementations"
      dropdownHref="/network/tdh/implementations"
      documentTitle={t(locale, "network.tdh.impl.pageTitle")}
      title={t(locale, "network.tdh.impl.title")}
      lede={<p className="tw-m-0">{t(locale, "network.tdh.impl.lede")}</p>}
    >
      <TdhSection
        id="programs"
        title={t(locale, "network.tdh.impl.programs.title")}
        locale={locale}
        wide
        sources={TABLE_SOURCES}
      >
        <div className="tw-space-y-4">
          <p className={PROSE}>
            {t(locale, "network.tdh.impl.programs.intro")}
          </p>
          <ProgramCards locale={locale} lean={lean} daily={daily} />
          <TdhStatusLegend
            locale={locale}
            tones={["success", "primary", "warning"]}
          />
          <TdhDisclosure summary={t(locale, "network.tdh.impl.notesSummary")}>
            <div className="tw-max-w-[34rem] tw-space-y-2 tw-pb-2 tw-pl-6 tw-text-sm tw-leading-6 tw-text-iron-300">
              <p className="tw-m-0">{t(locale, "network.tdh.impl.names")}</p>
              <p className="tw-m-0">
                {t(locale, "network.tdh.impl.conformanceNote")}
              </p>
              <p className="tw-m-0">
                {t(locale, "network.tdh.impl.checksNote", {
                  python: formatInteger(locale, P26.pythonChecks),
                  rust: formatInteger(locale, P26.rustReferenceChecks),
                  lean: formatInteger(locale, lean.checks),
                })}
              </p>
              <p className="tw-m-0">
                {t(locale, "network.tdh.impl.speedNote")}
              </p>
              <p className="tw-m-0">
                {t(locale, "network.tdh.impl.illustration")}
              </p>
            </div>
          </TdhDisclosure>
        </div>
      </TdhSection>

      <TdhSection
        id="written"
        title={t(locale, "network.tdh.impl.written.title")}
        locale={locale}
        sources={["Clean room 2026-10-11", "D119", "P53 §11.3"]}
      >
        <div className="tw-space-y-4">
          <p className={PROSE}>{t(locale, "network.tdh.impl.written.body")}</p>
          <p className={PROSE}>{t(locale, "network.tdh.impl.written.body2")}</p>
          <LineageDiagram locale={locale} />
        </div>
      </TdhSection>

      {/* A matrix of seven columns: a full-width figure, like the
          programs table. */}
      <TdhSection
        id="where"
        title={t(locale, "network.tdh.impl.where.title")}
        locale={locale}
        wide
      >
        <CheckMatrix locale={locale} lean={lean} />
      </TdhSection>

      <TdhSection
        id="checked"
        title={t(locale, "network.tdh.impl.checked.title")}
        locale={locale}
        sources={[...CHECKS.flatMap((check) => check.refs), "P53 §4.5"]}
      >
        <div className="tw-space-y-6">
          <ol className="tw-m-0 tw-max-w-3xl tw-list-none tw-space-y-4 tw-p-0">
            {CHECKS.map((check, index) => (
              <li
                key={check.key}
                className="tw-grid tw-grid-cols-[1.75rem_minmax(0,1fr)] tw-gap-3"
              >
                <span className="tw-flex tw-size-7 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-text-xs tw-font-medium tw-tabular-nums tw-text-iron-200">
                  {formatInteger(locale, index + 1)}
                </span>
                <div className="tw-min-w-0">
                  {/* Two lines each; the counts and the detail one click
                      away. */}
                  <p className="tw-m-0 tw-max-w-[34rem] tw-text-base tw-leading-7 tw-text-iron-300">
                    <strong className="tw-font-semibold tw-text-iron-50">
                      {t(locale, `network.tdh.impl.checked.${check.key}.title`)}
                    </strong>{" "}
                    {t(locale, `network.tdh.impl.checked.${check.key}.short`)}
                  </p>
                  <TdhDisclosure
                    summary={t(locale, "network.tdh.impl.checked.more")}
                  >
                    <p className="tw-m-0 tw-max-w-[34rem] tw-pb-2 tw-pl-6 tw-text-sm tw-leading-6 tw-text-iron-300">
                      {t(locale, `network.tdh.impl.checked.${check.key}.body`)}
                    </p>
                  </TdhDisclosure>
                  {check.key === "daily" && (
                    <TdhArrowLink href="/network/tdh/verification">
                      {t(locale, "network.tdh.impl.checked.daily.link")}
                    </TdhArrowLink>
                  )}
                  {check.key === "lean" && (
                    <TdhArrowLink href="/network/tdh/formal">
                      {t(locale, "network.tdh.impl.checked.lean.link")}
                    </TdhArrowLink>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <div id="difftest-rounds" className="tw-scroll-mt-28">
            <DifftestRounds locale={locale} />
          </div>
          <p className="tw-m-0 tw-max-w-[34rem] tw-rounded-lg tw-bg-iron-900 tw-px-4 tw-py-3 tw-text-base tw-leading-7 tw-text-iron-200">
            {t(locale, "network.tdh.impl.checked.after")}
          </p>
        </div>
      </TdhSection>

      {summary !== null && summary.kind !== "awaiting" && (
        <TdhSection
          id="latest"
          title={t(locale, "network.tdh.impl.latest.title")}
          locale={locale}
        >
          <LatestAgreement locale={locale} summary={summary} />
        </TdhSection>
      )}

      <TdhSection
        id="vectors"
        title={t(locale, "network.tdh.impl.vectors.title", {
          count: formatInteger(locale, VECTOR_COUNT),
        })}
        locale={locale}
        wide
        sources={["P26 §13", "D116"]}
      >
        <div className="tw-space-y-4">
          <p className={PROSE}>{t(locale, "network.tdh.impl.vectors.intro")}</p>
          <VectorFormat locale={locale} />
          <VectorAnatomy locale={locale} />
          <VectorsByHand locale={locale} />
          <VectorBrowser locale={locale} />
        </div>
      </TdhSection>
      <TdhPager current="/network/tdh/implementations" locale={locale} />
    </TdhPageShell>
  );
}

export function generateMetadata() {
  return getAppMetadata(
    {
      title: t(DEFAULT_LOCALE, "network.tdh.impl.pageTitle"),
      description: t(DEFAULT_LOCALE, "network.tdh.impl.metadataDescription"),
    },
    { canonicalPath: "/network/tdh/implementations" }
  );
}
