import { getAppMetadata } from "@/components/providers/metadata";
import { formatInteger, formatUtcDate } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { loadFormalManifest } from "@/lib/tdh/formal/loadFormalManifest.server";
import TdhPageShell from "../shared/TdhPageShell";
import TdhPager from "../shared/TdhPager";
import TdhRuleBlock from "../shared/TdhRuleBlock";
import CaseSafe from "../shared/CaseSafe";
import TdhSection from "../shared/TdhSection";
import TdhStatusPill from "../shared/TdhStatusPill";
import {
  TDH_CAPTION,
  TDH_CARD,
  TDH_TABLE,
  TDH_TABLE_FRAME,
  TDH_TD_NUM,
  TDH_TD_STACK_MD,
  TDH_TH,
  TDH_TH_NUM,
} from "../shared/tdhStyles";
import TdhArrowLink from "../shared/TdhArrowLink";
import TdhDisclosure from "../shared/TdhDisclosure";
import AssuranceLayers from "./AssuranceLayers";
import {
  checkStatements,
  leanRound,
  manifestFigures,
  type ManifestFigures,
} from "./formalStatus";
import {
  FIRST_RULE_CASES,
  LEAN_LATEST_ROUND,
  LEAN_RUNS,
  modulesFor,
  NETTING_DEFINITIONS,
  statementsFor,
  type LeanRound,
  type LeanRuns,
} from "./leanResults";
import NettingFigure from "./NettingFigure";
import StatementsTable from "./StatementsTable";
import {
  AllManifestEntries,
  BuildsPanel,
  FoundByModel,
  ProofLegend,
} from "./FormalPanels";

// The proof manifest is rechecked hourly (it changes only with a new build
// of the model); a failed fetch falls back to the bundled copy until then.
export const revalidate = 3600;

const PROSE =
  "tw-m-0 tw-max-w-[34rem] tw-text-base tw-leading-7 tw-text-iron-200";
const NOT_KEYS = ["english", "programs", "inputs", "rule", "lean"] as const;

/** A message key, with its variant from round 4 on (`<key>Raw`). */
function byRound(round: LeanRound, key: string): MessageKey {
  return (round >= 4 ? `${key}Raw` : key) as MessageKey;
}

/** How long the model takes for the whole day from raw logs. */
function dayDuration(locale: SupportedLocale, runs: LeanRuns): string {
  const [min, max] = runs.fullDaySeconds;
  return min === max
    ? t(locale, "network.tdh.formal.contains.duration.about", {
        seconds: formatInteger(locale, min),
      })
    : t(locale, "network.tdh.formal.contains.duration.range", {
        min: formatInteger(locale, min),
        max: formatInteger(locale, max),
      });
}

/** The P26 commit the manifest's build follows, short. */
function specShort(figures: ManifestFigures): string {
  return (figures.specCommit ?? figures.commit).slice(0, 7);
}

/** A number from the manifest, or a dash where it has none. */
function figure(locale: SupportedLocale, value: number | null): string {
  return value === null ? "–" : formatInteger(locale, value);
}

/**
 * The model's status in one row of figures, every one read from the proof
 * manifest the page loads: theorems proved, claims shown false, claims not
 * proved here, and the conformance vectors. A new build of the model
 * changes them by itself; nothing here is fixed in the page.
 */
function SummaryBand({
  locale,
  figures,
}: {
  readonly locale: SupportedLocale;
  readonly figures: ManifestFigures;
}) {
  const items = [
    {
      key: "proved",
      value: formatInteger(locale, figures.proved),
      sub: null,
      body: t(locale, "network.tdh.formal.summary.provedBody", {
        entries: formatInteger(locale, figures.entries),
        proved: formatInteger(locale, figures.proved),
        cexTheorems: formatInteger(locale, figures.counterexampleTheorems),
        audited: formatInteger(locale, figures.audited),
        tdh: formatInteger(locale, figures.theoremsTdh),
        p53: formatInteger(locale, figures.theoremsP53),
      }),
    },
    {
      key: "false",
      value: formatInteger(locale, figures.counterexamples),
      // How the counterexamples are checked, under the figure: a kernel
      // theorem and an evaluation are not the same strength.
      sub: t(locale, "network.tdh.formal.summary.falseSub", {
        kernel: formatInteger(locale, figures.counterexampleTheorems),
        evaluated: formatInteger(locale, figures.counterexampleEvaluations),
      }),
      body: t(locale, "network.tdh.formal.summary.falseBody", {
        kernel: formatInteger(locale, figures.counterexampleTheorems),
        evaluated: formatInteger(locale, figures.counterexampleEvaluations),
      }),
    },
    {
      key: "deferred",
      value: formatInteger(locale, figures.deferred),
      sub: null,
      body: t(locale, "network.tdh.formal.summary.deferredBody", {
        tdh: formatInteger(locale, figures.deferredTdh),
        p53: formatInteger(locale, figures.deferredP53),
      }),
    },
    {
      key: "vectors",
      value: `${figure(locale, figures.vectorsPassed)} / ${figure(locale, figures.vectorsTotal)}`,
      sub: null,
      body: t(locale, "network.tdh.formal.summary.vectorsBody", {
        checks: figure(locale, figures.vectorChecks),
        spec: specShort(figures),
      }),
    },
  ] as const;
  return (
    <div className="tw-mt-4 tw-@container">
      {/* One figure a row in a narrow window, two from 20rem, four from
          52rem of the column: never three and one. */}
      <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-3 tw-p-0 @[20rem]:tw-grid-cols-2 @[52rem]:tw-grid-cols-4">
        {items.map((item) => (
          <li
            key={item.key}
            className={`${TDH_CARD} tw-min-w-0 tw-px-4 tw-py-3`}
          >
            <p className="tw-m-0 tw-text-2xl tw-font-semibold tw-tabular-nums tw-tracking-tight tw-text-iron-50 sm:tw-text-3xl">
              {item.value}
            </p>
            <p className="tw-m-0 tw-mt-1 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-200">
              <CaseSafe
                text={t(
                  locale,
                  `network.tdh.formal.summary.${item.key}` as MessageKey
                )}
              />
            </p>
            {item.sub !== null && (
              <p className="tw-m-0 tw-mt-0.5 tw-text-sm tw-leading-5 tw-text-iron-400">
                {item.sub}
              </p>
            )}
          </li>
        ))}
      </ul>
      <TdhDisclosure
        className="tw-mt-2"
        summary={t(locale, "network.tdh.formal.summary.details")}
      >
        <dl className="tw-m-0 tw-grid tw-max-w-[34rem] tw-gap-y-2 tw-pb-2 tw-pl-6 tw-text-sm tw-leading-6">
          {items.map((item) => (
            <div key={item.key}>
              <dt className="tw-inline tw-font-medium tw-text-iron-100">
                {item.value}{" "}
                <CaseSafe
                  text={t(
                    locale,
                    `network.tdh.formal.summary.${item.key}` as MessageKey
                  )}
                />
                :{" "}
              </dt>
              <dd className="tw-m-0 tw-inline tw-text-iron-300">{item.body}</dd>
            </div>
          ))}
          <div>
            <dd className="tw-m-0 tw-text-iron-400">
              <CaseSafe
                text={t(locale, "network.tdh.formal.summary.asOf", {
                  commit: figures.commit.slice(0, 7),
                  generated: formatUtcDate(locale, figures.generatedAt, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZoneName: "short",
                  }),
                })}
              />
            </dd>
          </div>
        </dl>
      </TdhDisclosure>
    </div>
  );
}

function FirstRuleCases({ locale }: { readonly locale: SupportedLocale }) {
  const pair = (values: readonly [number, number]) =>
    t(locale, "network.tdh.formal.cases.pair", {
      a: formatInteger(locale, values[0]),
      b: formatInteger(locale, values[1]),
    });
  return (
    <div className={TDH_TABLE_FRAME}>
      <table className={`${TDH_TABLE} tw-block md:tw-table`}>
        <caption className={`${TDH_CAPTION} tw-block md:tw-table-caption`}>
          {t(locale, "network.tdh.formal.cases.caption")}
        </caption>
        <thead className="tw-hidden md:tw-table-header-group">
          <tr>
            <th scope="col" className={TDH_TH}>
              {t(locale, "network.tdh.formal.cases.case")}
            </th>
            <th scope="col" className={TDH_TH_NUM}>
              {t(locale, "network.tdh.formal.cases.first")}
            </th>
            <th scope="col" className={TDH_TH_NUM}>
              {t(locale, "network.tdh.formal.cases.current")}
            </th>
          </tr>
        </thead>
        <tbody className="tw-block md:tw-table-row-group">
          {FIRST_RULE_CASES.map((row) => (
            <tr
              key={row.id}
              className="tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-1 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-px-4 tw-py-3 first:tw-border-t-0 md:tw-table-row md:tw-p-0"
            >
              <th
                scope="row"
                className={`${TDH_TD_STACK_MD} tw-col-span-2 tw-font-normal`}
              >
                <span className="tw-mr-2 tw-font-mono tw-font-semibold tw-text-iron-50">
                  {row.id}
                </span>
                {t(
                  locale,
                  `network.tdh.formal.cases.desc.${row.id}` as MessageKey
                )}
              </th>
              <td
                className={`${TDH_TD_NUM} tw-border-0 tw-p-0 tw-text-amber-200 md:tw-border-b md:tw-border-solid md:tw-px-4 md:tw-py-3`}
              >
                <span className="tw-mr-1 tw-text-sm tw-text-iron-400 md:tw-hidden">
                  {t(locale, "network.tdh.formal.cases.first")}:
                </span>
                {pair(row.first)}
              </td>
              <td
                className={`${TDH_TD_NUM} tw-border-0 tw-p-0 tw-text-success md:tw-border-b md:tw-border-solid md:tw-px-4 md:tw-py-3`}
              >
                <span className="tw-mr-1 tw-text-sm tw-text-iron-400 md:tw-hidden">
                  {t(locale, "network.tdh.formal.cases.current")}:
                </span>
                {pair(row.current)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function TdhFormalPage() {
  const locale = DEFAULT_LOCALE;
  const load = await loadFormalManifest();
  const round = leanRound(load.manifest);
  const statements = statementsFor(round);
  const runs = LEAN_RUNS[round];
  const checks = checkStatements(statements, load.manifest);
  const figures = manifestFigures(load.manifest);
  const featured = statements.find((row) => row.id === "netting");
  const p26 = statements.filter((row) => row.group === "p26");
  const p53 = statements.filter((row) => row.group === "p53");

  return (
    <TdhPageShell
      locale={locale}
      current="/network/tdh/formal"
      dropdownHref="/network/tdh/formal"
      documentTitle={t(locale, "network.tdh.formal.pageTitle")}
      title={t(locale, "network.tdh.formal.title")}
      pills={<TdhStatusPill pill="proposal" locale={locale} />}
      lede={<p className="tw-m-0">{t(locale, "network.tdh.formal.lede")}</p>}
      headerExtra={
        <>
          <SummaryBand locale={locale} figures={figures} />
          <BuildsPanel
            locale={locale}
            published={figures}
            source={
              load.status === "published"
                ? { kind: "published", url: load.url, sha256: load.sha256 }
                : { kind: "bundled", reason: load.reason }
            }
            showNext={round < LEAN_LATEST_ROUND}
          />
        </>
      }
    >
      <TdhSection
        id="why"
        title={t(locale, "network.tdh.formal.why.title")}
        locale={locale}
        sources={["Clean room 2026-10-11", "P26 header", "P26 §7.1", "D131"]}
      >
        <div className="tw-space-y-4">
          <p className={PROSE}>{t(locale, "network.tdh.formal.why.body")}</p>
          <p className={PROSE}>{t(locale, "network.tdh.formal.why.body2")}</p>
          <FoundByModel locale={locale} />
        </div>
      </TdhSection>

      {featured?.lean && (
        <TdhSection
          id="featured"
          title={t(locale, "network.tdh.formal.featured.title")}
          locale={locale}
          sources={["P26 §3.3", "P26 §5", "P26 §7.1", "P26 §7.2"]}
        >
          {/* The text at its measure, then the figure across the column,
              so neither leaves a hole beside the other. */}
          <div className="tw-space-y-6">
            <div className="tw-space-y-4">
              <p className={PROSE}>
                {t(locale, "network.tdh.formal.featured.plain")}
              </p>
              <p className={PROSE}>
                {t(locale, "network.tdh.formal.featured.scope")}
              </p>
              <p className={`${PROSE} tw-font-medium tw-text-iron-50`}>
                {t(locale, "network.tdh.formal.featured.means")}
              </p>
              <p className="tw-m-0 tw-max-w-[34rem] tw-rounded-lg tw-border-0 tw-border-l-2 tw-border-solid tw-border-amber-400/70 tw-bg-amber-400/[0.05] tw-py-2 tw-pl-4 tw-pr-3 tw-text-sm tw-leading-6 tw-text-iron-200">
                {t(locale, "network.tdh.formal.featured.limit")}
              </p>
            </div>
            <NettingFigure locale={locale} />
          </div>
          <div className="tw-mt-6 tw-grid tw-gap-4">
            <div className="tw-min-w-0">
              <TdhRuleBlock
                code={featured.lean}
                locale={locale}
                language="lean"
                title={t(locale, "network.tdh.formal.featured.lean")}
                label={featured.file}
              />
              <p className="tw-m-0 tw-mt-2 tw-font-mono tw-text-xs tw-text-iron-400">
                {t(locale, "network.tdh.formal.featured.file", {
                  file: featured.file,
                })}
              </p>
            </div>
            <div className="tw-min-w-0">
              <TdhRuleBlock
                code={NETTING_DEFINITIONS}
                locale={locale}
                language="lean"
                title={t(locale, "network.tdh.formal.featured.definitions")}
                label={t(locale, "network.tdh.formal.featured.definitions")}
              />
            </div>
          </div>
        </TdhSection>
      )}

      <TdhSection
        id="statements"
        title={t(locale, "network.tdh.formal.statements.title")}
        locale={locale}
      >
        <div className="tw-space-y-6">
          <p className={PROSE}>
            {t(locale, "network.tdh.formal.statements.intro")}
          </p>
          <ProofLegend locale={locale} />
          <div className="tw-space-y-3">
            <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
              {t(locale, "network.tdh.formal.statements.p26")}
            </h3>
            <StatementsTable
              locale={locale}
              rows={p26}
              checks={checks}
              caption={t(locale, "network.tdh.formal.statements.p26")}
              extra={{
                firstRule: <FirstRuleCases key="firstRule" locale={locale} />,
                facts: (
                  <p
                    key="facts"
                    className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300"
                  >
                    {t(locale, "network.tdh.formal.st.facts.count", {
                      checks: formatInteger(locale, figures.facts),
                    })}
                  </p>
                ),
              }}
            />
          </div>
          <div className="tw-space-y-3">
            <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
              {t(locale, "network.tdh.formal.statements.p53")}
            </h3>
            <StatementsTable
              locale={locale}
              rows={p53}
              checks={checks}
              caption={t(locale, "network.tdh.formal.statements.p53")}
            />
          </div>
          <AllManifestEntries locale={locale} manifest={load.manifest} />
        </div>
      </TdhSection>

      <TdhSection
        id="contains"
        title={t(locale, "network.tdh.formal.contains.title")}
        locale={locale}
      >
        <div className="tw-space-y-5">
          <p className={PROSE}>
            {t(locale, byRound(round, "network.tdh.formal.contains.body"))}
          </p>
          <p className={PROSE}>
            {t(locale, byRound(round, "network.tdh.formal.contains.runs"), {
              vectors: figure(locale, figures.vectorsTotal),
              checks: figure(locale, figures.vectorChecks),
              spec: specShort(figures),
              read: formatInteger(locale, runs.logsRead),
              throughB: formatInteger(locale, runs.logsThroughB),
              duration: dayDuration(locale, runs),
              total: formatInteger(locale, runs.fullDayTotal),
              records: formatInteger(locale, runs.fullDayRecords),
              randomInputs: formatInteger(locale, runs.randomInputs),
              randomChecks: formatInteger(locale, runs.randomChecks),
              readme: runs.readmeCommit,
            })}
          </p>
          <p className="tw-m-0 tw-max-w-[34rem] tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(locale, byRound(round, "network.tdh.formal.contains.outside"))}
          </p>
          <div className={TDH_TABLE_FRAME}>
            <table className={`${TDH_TABLE} tw-block md:tw-table`}>
              <caption
                className={`${TDH_CAPTION} tw-block md:tw-table-caption`}
              >
                <CaseSafe
                  text={t(locale, "network.tdh.formal.module.captionAt", {
                    commit: figures.commit.slice(0, 7),
                  })}
                />
              </caption>
              <thead className="tw-hidden md:tw-table-header-group">
                <tr>
                  <th scope="col" className={TDH_TH}>
                    {t(locale, "network.tdh.formal.module.module")}
                  </th>
                  <th scope="col" className={TDH_TH}>
                    {t(locale, "network.tdh.formal.module.covers")}
                  </th>
                  <th scope="col" className={TDH_TH}>
                    {t(locale, "network.tdh.formal.module.section")}
                  </th>
                </tr>
              </thead>
              <tbody className="tw-block md:tw-table-row-group">
                {modulesFor(round).map((row) => (
                  <tr
                    key={row.key}
                    className="tw-grid tw-gap-1 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-px-4 tw-py-3 first:tw-border-t-0 md:tw-table-row md:tw-p-0"
                  >
                    <th
                      scope="row"
                      className={`${TDH_TD_STACK_MD} tw-font-mono tw-text-xs tw-font-normal tw-text-iron-100`}
                    >
                      {row.module.split(", ").map((name) => (
                        <span key={name} className="tw-block">
                          {name}
                        </span>
                      ))}
                    </th>
                    <td className={TDH_TD_STACK_MD}>
                      {t(
                        locale,
                        `network.tdh.formal.module.${row.key}` as MessageKey
                      )}
                    </td>
                    <td
                      className={`${TDH_TD_STACK_MD} tw-font-mono tw-text-[0.8125rem] tw-text-iron-300 md:tw-whitespace-nowrap`}
                    >
                      P26 {row.section}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </TdhSection>

      <TdhSection
        id="not"
        title={t(locale, "network.tdh.formal.not.title")}
        locale={locale}
        sources={["D118", "D119", "Difftest Oct 15"]}
      >
        <ul className="tw-m-0 tw-max-w-[34rem] tw-list-none tw-space-y-4 tw-p-0">
          {NOT_KEYS.map((key) => (
            <li
              key={key}
              className="tw-grid tw-grid-cols-[1.25rem_minmax(0,1fr)] tw-gap-3"
            >
              <span
                aria-hidden="true"
                className="tw-mt-2.5 tw-size-2 tw-rounded-full tw-bg-amber-400"
              />
              <div className="tw-min-w-0">
                <p className="tw-m-0 tw-text-base tw-leading-7 tw-text-iron-300">
                  <strong className="tw-font-semibold tw-text-iron-50">
                    {t(locale, `network.tdh.formal.not.${key}.title`)}
                  </strong>{" "}
                  {t(locale, `network.tdh.formal.not.${key}.short`)}
                </p>
                {key !== "rule" && (
                  <TdhDisclosure
                    summary={t(locale, "network.tdh.formal.not.more")}
                  >
                    <p className="tw-m-0 tw-pb-2 tw-pl-6 tw-text-sm tw-leading-6 tw-text-iron-300">
                      {t(
                        locale,
                        key === "inputs"
                          ? byRound(round, "network.tdh.formal.not.inputs.body")
                          : `network.tdh.formal.not.${key}.body`,
                        { vectors: figure(locale, figures.vectorsTotal) }
                      )}
                    </p>
                  </TdhDisclosure>
                )}
              </div>
            </li>
          ))}
        </ul>
        <TdhArrowLink
          href="/network/tdh/implementations#difftest-rounds"
          className="tw-mt-4"
        >
          {t(locale, "network.tdh.shared.difftest.link")}
        </TdhArrowLink>
      </TdhSection>

      <TdhSection
        id="layers"
        title={t(locale, "network.tdh.formal.layers.title")}
        locale={locale}
      >
        <div className="tw-max-w-[34rem]">
          <AssuranceLayers locale={locale} />
        </div>
      </TdhSection>

      <TdhSection
        id="check"
        title={t(locale, "network.tdh.formal.check.title")}
        locale={locale}
        pills={<TdhStatusPill pill="toBePublished" locale={locale} />}
        sources={["D116"]}
      >
        <div className="tw-flex tw-flex-col tw-items-start tw-gap-3">
          <p className={PROSE}>{t(locale, "network.tdh.formal.check.body")}</p>
          <div className="tw-w-full">
            <TdhRuleBlock
              code={t(locale, "network.tdh.formal.check.commands")}
              locale={locale}
              title={t(locale, "network.tdh.formal.check.title")}
              label={t(locale, "network.tdh.formal.check.title")}
              wrap="none"
              language="shell"
            />
          </div>
          <p className={PROSE}>
            {t(locale, "network.tdh.formal.check.figures", {
              commit: figures.commit.slice(0, 7),
              passed: figure(locale, figures.vectorsPassed),
              total: figure(locale, figures.vectorsTotal),
              checks: figure(locale, figures.vectorChecks),
              nettingPassed: figure(locale, figures.nettingPassed),
              nettingTotal: figure(locale, figures.nettingTotal),
            })}
          </p>
        </div>
      </TdhSection>
      <TdhPager current="/network/tdh/formal" locale={locale} />
    </TdhPageShell>
  );
}

export function generateMetadata() {
  return getAppMetadata(
    {
      title: t(DEFAULT_LOCALE, "network.tdh.formal.pageTitle"),
      description: t(DEFAULT_LOCALE, "network.tdh.formal.metadataDescription"),
    },
    { canonicalPath: "/network/tdh/formal" }
  );
}
