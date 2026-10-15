import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { getAppMetadata } from "@/components/providers/metadata";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import {
  loadVerificationSummary,
  type VerificationSummary,
} from "@/lib/tdh/verification/summary.server";
import TdhPageShell from "../shared/TdhPageShell";
import TdhSection from "../shared/TdhSection";
import TdhSource from "../shared/TdhSource";
import TdhStatusPill from "../shared/TdhStatusPill";
import {
  TDH_CAPTION,
  TDH_CARD,
  TDH_FOCUS_RING,
  TDH_LINK,
  TDH_LINK_STANDALONE,
  TDH_SERIES,
  TDH_TABLE,
  TDH_TABLE_FRAME,
  TDH_TABLE_WRAP,
  TDH_TD,
  TDH_TH,
} from "../shared/tdhStyles";
import { formatCycleDate } from "../verification/components/verificationFormat";
import { CheckWebDiagram, LineageDiagram } from "./ImplementationDiagrams";
import VectorBrowser from "./VectorBrowser";

// The agreement card reads the latest daily verification files.
export const revalidate = 600;

const PROGRAMS = [
  { key: "rust", series: "rust" },
  { key: "programB", series: "programB" },
  { key: "python", series: "python" },
  { key: "backend", series: "live" },
] as const;
const ROWS = [
  "language",
  "writtenFrom",
  "runsIn",
  "conformance",
  "speed",
  "source",
] as const;
const ROW_SOURCES: Partial<Record<(typeof ROWS)[number], readonly string[]>> = {
  runsIn: ["D112", "D119", "D125", "D132"],
  conformance: ["P26 §13"],
  speed: ["P52 §3.4"],
  source: ["D116"],
};
const WHERE = [
  {
    key: "rust",
    series: "rust",
    cells: ["yes", "yes", "fromCutover", "programA"],
  },
  {
    key: "programB",
    series: "programB",
    cells: ["secondCheck", "no", "no", "programB"],
  },
  { key: "python", series: "python", cells: ["optional", "yes", "no", "no"] },
  {
    key: "backend",
    series: "live",
    cells: ["no", "underTest", "untilCutover", "no"],
  },
] as const;
const CHECKS = [
  { key: "vectors", refs: ["P26 §13"] },
  { key: "replays", refs: ["Replay 2026-10-11"] },
  { key: "dual", refs: ["D125", "P53 §4.5"] },
  { key: "daily", refs: ["D132"] },
  { key: "proofs", refs: ["D119", "D128"] },
] as const;
const PROSE =
  "tw-m-0 tw-max-w-3xl tw-text-[15px] tw-leading-7 tw-text-iron-200";

function programCell(
  locale: SupportedLocale,
  program: string,
  row: string
): string {
  if (row === "source") {
    return program === "backend"
      ? t(locale, "network.tdh.impl.notApplicable")
      : t(locale, "network.tdh.shared.sourceToBePublished");
  }
  if (program === "backend" && row === "speed") {
    return t(locale, "network.tdh.impl.notApplicable");
  }
  return t(locale, `network.tdh.impl.${program}.${row}` as MessageKey);
}

function Dot({ series }: { readonly series: keyof typeof TDH_SERIES }) {
  return (
    <span
      aria-hidden="true"
      className={`tw-size-2 tw-shrink-0 tw-rounded-full ${TDH_SERIES[series].bg}`}
    />
  );
}

function ProgramsComparison({ locale }: { readonly locale: SupportedLocale }) {
  const name = (key: string) =>
    t(locale, `network.tdh.impl.name.${key}` as MessageKey);
  const rowLabel = (row: string) =>
    t(locale, `network.tdh.impl.row.${row}` as MessageKey);
  return (
    <>
      <div className={`${TDH_TABLE_FRAME} tw-hidden lg:tw-block`}>
        <table className={TDH_TABLE}>
          <caption className={TDH_CAPTION}>
            {t(locale, "network.tdh.impl.programs.caption")}
          </caption>
          <thead>
            <tr>
              <th scope="col" className={TDH_TH}>
                {t(locale, "network.tdh.impl.programs.attribute")}
              </th>
              {PROGRAMS.map((program) => (
                <th key={program.key} scope="col" className={TDH_TH}>
                  <span className="tw-inline-flex tw-items-center tw-gap-2">
                    <Dot series={program.series} />
                    {name(program.key)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row}>
                <th
                  scope="row"
                  className={`${TDH_TD} tw-whitespace-nowrap tw-font-medium tw-text-iron-300`}
                >
                  {rowLabel(row)}
                  {ROW_SOURCES[row] && (
                    <TdhSource
                      refs={ROW_SOURCES[row] ?? []}
                      locale={locale}
                      className="tw-mt-1 tw-flex"
                    />
                  )}
                </th>
                {PROGRAMS.map((program) => (
                  <td
                    key={program.key}
                    className={`${TDH_TD} tw-text-[13px] tw-leading-5`}
                  >
                    {programCell(locale, program.key, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="tw-m-0 tw-grid tw-list-none tw-gap-3 tw-p-0 sm:tw-grid-cols-2 lg:tw-hidden">
        {PROGRAMS.map((program) => (
          <li key={program.key} className={`${TDH_CARD} tw-p-4`}>
            <h3 className="tw-m-0 tw-flex tw-items-center tw-gap-2 tw-text-base tw-font-semibold tw-text-iron-50">
              <Dot series={program.series} />
              {name(program.key)}
            </h3>
            <dl className="tw-m-0 tw-mt-3 tw-space-y-2">
              {ROWS.map((row) => (
                <div key={row}>
                  <dt className="tw-text-xs tw-text-iron-500">
                    {rowLabel(row)}
                  </dt>
                  <dd className="tw-m-0 tw-text-sm tw-leading-5 tw-text-iron-200">
                    {programCell(locale, program.key, row)}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

function WhereItRuns({ locale }: { readonly locale: SupportedLocale }) {
  const columns = ["validator", "dailyJob", "site", "proof"] as const;
  return (
    <>
      <ul className="tw-m-0 tw-grid tw-list-none tw-gap-2 tw-p-0 md:tw-hidden">
        {WHERE.map((row) => (
          <li key={row.key} className={`${TDH_CARD} tw-p-4`}>
            <p className="tw-m-0 tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-iron-50">
              <Dot series={row.series} />
              {t(locale, `network.tdh.impl.name.${row.key}`)}
            </p>
            <dl className="tw-m-0 tw-mt-2 tw-grid tw-grid-cols-2 tw-gap-x-3 tw-gap-y-2">
              {row.cells.map((cell, index) => (
                <div key={columns[index]}>
                  <dt className="tw-text-xs tw-text-iron-500">
                    {t(
                      locale,
                      `network.tdh.impl.where.${columns[index] ?? "validator"}`
                    )}
                  </dt>
                  <dd
                    className={`tw-m-0 tw-text-sm ${cell === "no" ? "tw-text-iron-500" : "tw-text-iron-100"}`}
                  >
                    {t(locale, `network.tdh.impl.where.${cell}`)}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      <div
        className={`${TDH_TABLE_WRAP} tw-hidden md:tw-block`}
        tabIndex={0}
        role="region"
        aria-label={t(locale, "network.tdh.impl.where.caption")}
      >
        <table className={`${TDH_TABLE} tw-min-w-[36rem]`}>
          <caption className={TDH_CAPTION}>
            {t(locale, "network.tdh.impl.where.caption")}
          </caption>
          <thead>
            <tr>
              <th scope="col" className={TDH_TH}>
                {t(locale, "network.tdh.impl.where.implementation")}
              </th>
              {columns.map((column) => (
                <th key={column} scope="col" className={TDH_TH}>
                  {t(locale, `network.tdh.impl.where.${column}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WHERE.map((row) => (
              <tr key={row.key}>
                <th scope="row" className={`${TDH_TD} tw-font-medium`}>
                  <span className="tw-inline-flex tw-items-center tw-gap-2">
                    <Dot series={row.series} />
                    {t(locale, `network.tdh.impl.name.${row.key}`)}
                  </span>
                </th>
                {row.cells.map((cell, index) => (
                  <td
                    key={columns[index]}
                    className={`${TDH_TD} tw-text-[13px] ${cell === "no" ? "tw-text-iron-600" : "tw-text-iron-100"}`}
                  >
                    {cell === "no" ? (
                      <span>
                        <span aria-hidden="true">–</span>
                        <span className="tw-sr-only">
                          {t(locale, "network.tdh.impl.where.no")}
                        </span>
                      </span>
                    ) : (
                      <span className="tw-inline-flex tw-items-center tw-gap-1.5">
                        <span
                          aria-hidden="true"
                          className="tw-size-1.5 tw-rounded-full tw-bg-success"
                        />
                        {t(locale, `network.tdh.impl.where.${cell}`)}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

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
    cycle: formatInteger(locale, summary.cycleDay),
    date: formatCycleDate(locale, summary.date),
    live: formatInteger(locale, summary.liveEqual),
    total: formatInteger(locale, summary.liveTotal),
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
          {summary.kind === "sample" && (
            <TdhStatusPill pill="sample" locale={locale} size="sm" />
          )}
        </span>
        <span className="tw-text-sm tw-tabular-nums tw-leading-6 tw-text-iron-100">
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
  const summary = await loadVerificationSummary();
  return (
    <TdhPageShell
      locale={locale}
      current="/network/tdh/implementations"
      dropdownHref="/network/tdh"
      documentTitle={t(locale, "network.tdh.impl.pageTitle")}
      title={t(locale, "network.tdh.impl.title")}
      lede={<p className="tw-m-0">{t(locale, "network.tdh.impl.lede")}</p>}
    >
      <TdhSection
        id="programs"
        title={t(locale, "network.tdh.impl.programs.title")}
        locale={locale}
        wide
      >
        <div className="tw-space-y-4">
          <ProgramsComparison locale={locale} />
          <p className="tw-m-0 tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-sm tw-text-iron-400">
            <TdhStatusPill pill="inProgress" locale={locale} size="sm" />
            {t(locale, "network.tdh.impl.lean")}
            <Link href="/network/tdh/formal" className={TDH_LINK_STANDALONE}>
              {t(locale, "network.tdh.impl.leanLink")}
            </Link>
          </p>
        </div>
      </TdhSection>

      <TdhSection
        id="written"
        title={t(locale, "network.tdh.impl.written.title")}
        locale={locale}
      >
        <div className="tw-space-y-4">
          <p className={PROSE}>
            {t(locale, "network.tdh.impl.written.body")}
            <TdhSource refs={["Clean room 2026-10-11"]} locale={locale} />
          </p>
          <p className={PROSE}>
            {t(locale, "network.tdh.impl.written.body2")}
            <TdhSource refs={["D119"]} locale={locale} />
          </p>
          <LineageDiagram locale={locale} />
        </div>
      </TdhSection>

      <TdhSection
        id="where"
        title={t(locale, "network.tdh.impl.where.title")}
        locale={locale}
      >
        <WhereItRuns locale={locale} />
      </TdhSection>

      <TdhSection
        id="checked"
        title={t(locale, "network.tdh.impl.checked.title")}
        locale={locale}
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
                <p className="tw-m-0 tw-text-[15px] tw-leading-7 tw-text-iron-300">
                  <strong className="tw-font-semibold tw-text-iron-50">
                    {t(locale, `network.tdh.impl.checked.${check.key}.title`)}
                  </strong>{" "}
                  {t(locale, `network.tdh.impl.checked.${check.key}.body`)}
                  <TdhSource refs={check.refs} locale={locale} />
                  {check.key === "daily" && (
                    <>
                      {" "}
                      <Link
                        href="/network/tdh/verification"
                        className={TDH_LINK}
                      >
                        {t(locale, "network.tdh.impl.checked.daily.link")}
                      </Link>
                    </>
                  )}
                </p>
              </li>
            ))}
          </ol>
          <p className="tw-m-0 tw-max-w-3xl tw-border-0 tw-border-l-2 tw-border-solid tw-border-primary-400/60 tw-pl-4 tw-text-[15px] tw-leading-7 tw-text-iron-200">
            {t(locale, "network.tdh.impl.checked.after")}
            <TdhSource refs={["P53 §4.5"]} locale={locale} />
          </p>
          <CheckWebDiagram locale={locale} />
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
        title={t(locale, "network.tdh.impl.vectors.title")}
        locale={locale}
      >
        <div className="tw-space-y-4">
          <p className={PROSE}>
            {t(locale, "network.tdh.impl.vectors.intro")}
            <TdhSource refs={["P26 §13", "D116"]} locale={locale} />
          </p>
          <VectorBrowser locale={locale} />
        </div>
      </TdhSection>
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
