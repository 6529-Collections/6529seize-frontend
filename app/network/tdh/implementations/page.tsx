import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { getAppMetadata } from "@/components/providers/metadata";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { loadFormalManifest } from "@/lib/tdh/formal/loadFormalManifest.server";
import { conformanceRun } from "@/lib/tdh/formal/manifest";
import {
  loadVerificationSummary,
  type VerificationSummary,
} from "@/lib/tdh/verification/summary.server";
import { leanRound } from "../formal/formalStatus";
import TdhPageShell from "../shared/TdhPageShell";
import TdhPager from "../shared/TdhPager";
import TdhSection from "../shared/TdhSection";
import TdhSource from "../shared/TdhSource";
import TdhStatusPill from "../shared/TdhStatusPill";
import {
  TDH_CAPTION,
  TDH_CARD,
  TDH_FOCUS_RING,
  TDH_LINK,
  TDH_SERIES,
  TDH_TABLE,
  TDH_TABLE_FRAME,
  TDH_TD,
  TDH_TH,
} from "../shared/tdhStyles";
import { formatCycleDate } from "../verification/components/verificationFormat";
import {
  CheckMatrix,
  LineageDiagram,
  MatrixCell,
  MatrixLegend,
  type MatrixTone,
} from "./ImplementationDiagrams";
import ProgramCards from "./ProgramCards";
import VectorAnatomy from "./VectorAnatomy";
import VectorBrowser from "./VectorBrowser";
import VectorFormat from "./VectorFormat";
import { VECTOR_COUNT } from "./vectors";

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
const WHERE: ReadonlyArray<{
  readonly key: "rust" | "programB" | "python" | "backend";
  readonly series: keyof typeof TDH_SERIES;
  readonly cells: ReadonlyArray<readonly [MatrixTone, string]>;
}> = [
  {
    key: "rust",
    series: "rust",
    cells: [
      ["later", "firstCheck"],
      ["now", "yes"],
      ["later", "fromCutover"],
      ["later", "programA"],
    ],
  },
  {
    key: "programB",
    series: "programB",
    cells: [
      ["later", "secondCheck"],
      ["no", "no"],
      ["no", "no"],
      ["later", "programB"],
    ],
  },
  {
    key: "python",
    series: "python",
    cells: [
      ["later", "optional"],
      ["now", "yes"],
      ["no", "no"],
      ["no", "no"],
    ],
  },
  {
    key: "backend",
    series: "live",
    cells: [
      ["no", "no"],
      ["test", "underTest"],
      ["now", "untilCutover"],
      ["no", "no"],
    ],
  },
];

function Dot({ series }: { readonly series: keyof typeof TDH_SERIES }) {
  return (
    <span
      aria-hidden="true"
      className={`tw-size-2 tw-shrink-0 tw-rounded-full ${TDH_SERIES[series].bg}`}
    />
  );
}
const CHECKS = [
  { key: "vectors", refs: ["P26 §13"] },
  { key: "replays", refs: ["Replay 2026-10-11", "P26 §13"] },
  { key: "difftest", refs: ["P26 §13"] },
  { key: "dual", refs: ["D125", "P53 §4.5"] },
  { key: "daily", refs: ["D132"] },
  { key: "lean", refs: [] },
  { key: "proofs", refs: ["D119", "D128"] },
] as const;
const PROSE =
  "tw-m-0 tw-max-w-3xl tw-text-[15px] tw-leading-7 tw-text-iron-200";

function WhereItRuns({ locale }: { readonly locale: SupportedLocale }) {
  const columns = ["validator", "dailyJob", "site", "proof"] as const;
  return (
    <>
      <ul className="tw-m-0 tw-grid tw-list-none tw-gap-2 tw-p-0 sm:tw-grid-cols-2 xl:tw-hidden">
        {WHERE.map((row) => (
          <li key={row.key} className={`${TDH_CARD} tw-p-4`}>
            <p className="tw-m-0 tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-semibold tw-text-iron-50">
              <Dot series={row.series} />
              {t(locale, `network.tdh.impl.name.${row.key}`)}
            </p>
            <dl className="tw-m-0 tw-mt-2 tw-grid tw-grid-cols-2 tw-gap-x-3 tw-gap-y-2">
              {row.cells.map(([tone, cell], index) => (
                <div key={columns[index]}>
                  <dt className="tw-text-xs tw-text-iron-400">
                    {t(
                      locale,
                      `network.tdh.impl.where.${columns[index] ?? "validator"}`
                    )}
                    <span className="tw-block tw-text-xs tw-text-iron-400">
                      {t(
                        locale,
                        `network.tdh.impl.where.${columns[index] ?? "validator"}When` as MessageKey
                      )}
                    </span>
                  </dt>
                  <dd className="tw-m-0 tw-mt-0.5 tw-text-sm">
                    {tone === "no" ? (
                      <span className="tw-text-iron-500">–</span>
                    ) : (
                      <MatrixCell
                        tone={tone}
                        label={t(
                          locale,
                          `network.tdh.impl.where.${cell}` as MessageKey
                        )}
                      />
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      <div className={`${TDH_TABLE_FRAME} tw-hidden xl:tw-block`}>
        <table className={TDH_TABLE}>
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
                  <span className="tw-block tw-text-xs tw-font-normal tw-text-iron-400">
                    {t(
                      locale,
                      `network.tdh.impl.where.${column}When` as MessageKey
                    )}
                  </span>
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
                {row.cells.map(([tone, cell], index) => (
                  <td
                    key={columns[index]}
                    className={`${TDH_TD} tw-text-[13px] ${columns[index] === "proof" ? "tw-whitespace-nowrap" : ""}`}
                  >
                    <MatrixCell
                      tone={tone}
                      label={t(
                        locale,
                        `network.tdh.impl.where.${cell}` as MessageKey
                      )}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <MatrixLegend locale={locale} />
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
  const lean = {
    passed: leanRun?.passed ?? 0,
    total: leanRun?.total ?? 0,
    checks: leanRun?.checks ?? 0,
    spec: (
      formal.manifest.documents?.specification?.lastChange ??
      formal.manifest.source.commit
    ).slice(0, 7),
    fromRawLogs: leanRound(formal.manifest) === 4,
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
        pills={<TdhStatusPill pill="toBePublished" locale={locale} size="sm" />}
      >
        <div className="tw-space-y-4">
          <ProgramCards locale={locale} lean={lean} />
          <div className="tw-max-w-4xl tw-space-y-2 tw-text-sm tw-leading-6 tw-text-iron-300">
            <p className="tw-m-0">
              {t(locale, "network.tdh.impl.conformanceNote")}
              <TdhSource refs={["P26 §13"]} locale={locale} />
            </p>
            <p className="tw-m-0">{t(locale, "network.tdh.impl.speedNote")}</p>
            <p className="tw-m-0">
              {t(locale, "network.tdh.impl.illustration")}
            </p>
          </div>
          <p className="tw-m-0 tw-flex tw-flex-wrap tw-items-center tw-gap-x-1 tw-text-sm tw-text-iron-400">
            <span className="tw-font-medium tw-text-iron-300">
              {t(locale, "network.tdh.explainer.sources.label")}
            </span>
            <TdhSource refs={TABLE_SOURCES} locale={locale} />
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
        wide
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
                  {check.key === "lean" && (
                    <>
                      {" "}
                      <Link href="/network/tdh/formal" className={TDH_LINK}>
                        {t(locale, "network.tdh.impl.checked.lean.link")}
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
          <CheckMatrix locale={locale} lean={lean} />
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
      >
        <div className="tw-space-y-4">
          <p className={PROSE}>
            {t(locale, "network.tdh.impl.vectors.intro")}
            <TdhSource refs={["P26 §13", "D116"]} locale={locale} />
          </p>
          <VectorFormat locale={locale} />
          <VectorAnatomy locale={locale} />
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
