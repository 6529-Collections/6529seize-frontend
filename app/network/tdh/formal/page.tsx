import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { getAppMetadata } from "@/components/providers/metadata";
import { formatInteger, formatUtcDate } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import {
  loadFormalManifest,
  type FormalManifestLoad,
} from "@/lib/tdh/formal/loadFormalManifest.server";
import TdhPageShell from "../shared/TdhPageShell";
import TdhPager from "../shared/TdhPager";
import TdhRuleBlock from "../shared/TdhRuleBlock";
import TdhSection from "../shared/TdhSection";
import TdhSource from "../shared/TdhSource";
import TdhStatusPill from "../shared/TdhStatusPill";
import {
  TDH_CAPTION,
  TDH_CARD,
  TDH_LINK,
  TDH_TABLE,
  TDH_TABLE_FRAME,
  TDH_TD_NUM,
  TDH_TD_STACK_MD,
  TDH_TH,
  TDH_TH_NUM,
} from "../shared/tdhStyles";
import AssuranceLayers from "./AssuranceLayers";
import {
  checkStatements,
  leanRound,
  manifestFigures,
  type ManifestFigures,
  type StatementCheck,
} from "./formalStatus";
import {
  FIRST_RULE_CASES,
  LEAN_ROUND_4,
  LEAN_RUNS,
  modulesFor,
  NETTING_DEFINITIONS,
  statementsFor,
  type LeanRound,
  type LeanRuns,
  type LeanStatement,
} from "./leanResults";
import NettingFigure from "./NettingFigure";
import { P26 } from "../shared/tdhFacts";
import StatementsTable from "./StatementsTable";

// The proof manifest is rechecked hourly (it changes only with a new build
// of the model); a failed fetch falls back to the bundled copy until then.
export const revalidate = 3600;

const PROSE =
  "tw-m-0 tw-max-w-3xl tw-text-[15px] tw-leading-7 tw-text-iron-200";
const NOT_KEYS = ["english", "programs", "inputs", "rule", "lean"] as const;
const LONG_DATE = { day: "numeric", month: "long", year: "numeric" } as const;

/** A message key, with its round-4 variant (`<key>Raw`) for that round. */
function byRound(round: LeanRound, key: string): MessageKey {
  return (round === 4 ? `${key}Raw` : key) as MessageKey;
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

function SummaryBand({
  locale,
  figures,
  checks,
  statements,
  round,
}: {
  readonly locale: SupportedLocale;
  readonly figures: ManifestFigures;
  readonly checks: Readonly<Record<string, StatementCheck>>;
  readonly statements: readonly LeanStatement[];
  readonly round: LeanRound;
}) {
  const runs = LEAN_RUNS[round];
  const count = (group: "p26" | "p53", status: StatementCheck["status"]) =>
    statements.filter(
      (row) => row.group === group && checks[row.id]?.status === status
    ).length;
  const shownFalse = count("p26", "shownFalse") + count("p53", "shownFalse");
  const items = [
    {
      key: "proved",
      value: formatInteger(locale, count("p26", "proved")),
      body: t(locale, byRound(round, "network.tdh.formal.summary.provedBody"), {
        p53: formatInteger(locale, count("p53", "proved")),
      }),
    },
    {
      key: "false",
      value: formatInteger(locale, shownFalse),
      body: t(locale, "network.tdh.formal.summary.falseBody"),
    },
    {
      key: "vectors",
      value: `${figure(locale, figures.vectorsPassed)} / ${figure(locale, figures.vectorsTotal)}`,
      body: `${t(locale, "network.tdh.formal.summary.vectorsBody", {
        checks: figure(locale, figures.vectorChecks),
        spec: specShort(figures),
      })}${
        (figures.vectorsTotal ?? 0) < P26.vectorCount
          ? t(locale, "network.tdh.formal.summary.vectorsBehind", {
              latest: formatInteger(locale, P26.vectorCount),
              latestCommit: P26.commit,
            })
          : ""
      }`,
    },
    {
      key: "day",
      value: formatInteger(locale, runs.fullDayRecords),
      body: t(locale, "network.tdh.formal.summary.dayBody", {
        total: formatInteger(locale, runs.fullDayTotal),
      }),
    },
  ] as const;
  return (
    <div className="tw-mt-6">
      <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] tw-gap-3 tw-p-0">
        {items.map((item) => (
          <li
            key={item.key}
            className={`${TDH_CARD} tw-flex tw-min-w-0 tw-flex-col tw-p-4`}
          >
            <p className="tw-m-0 tw-text-2xl tw-font-semibold tw-tabular-nums tw-tracking-tight tw-text-iron-50 sm:tw-text-3xl">
              {item.value}
            </p>
            <p className="tw-m-0 tw-mt-1 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-100">
              {t(
                locale,
                `network.tdh.formal.summary.${item.key}` as MessageKey
              )}
            </p>
            <p className="tw-m-0 tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-400">
              {item.body}
            </p>
          </li>
        ))}
      </ul>
      <p className="tw-m-0 tw-mt-3 tw-max-w-4xl tw-text-xs tw-leading-5 tw-text-iron-400">
        {t(locale, "network.tdh.formal.summary.theorems", {
          tdh: formatInteger(locale, figures.theoremsTdh),
          p53: formatInteger(locale, figures.theoremsP53),
        })}
      </p>
    </div>
  );
}

/**
 * Where the statuses come from: the manifest published with the daily feed,
 * or the copy bundled with the page, with the build it records.
 */
function ManifestSource({
  locale,
  load,
  figures,
}: {
  readonly locale: SupportedLocale;
  readonly load: FormalManifestLoad;
  readonly figures: ManifestFigures;
}) {
  const build = t(locale, "network.tdh.formal.manifest.build", {
    commit: figures.commit.slice(0, 7),
    date: formatUtcDate(locale, figures.commitDate, LONG_DATE),
    version: figures.leanVersion,
  });
  const spec =
    figures.specCommit === null
      ? null
      : t(locale, "network.tdh.formal.manifest.spec", {
          spec: figures.specCommit.slice(0, 7),
        });
  return (
    <div className="tw-mt-4 tw-flex tw-max-w-4xl tw-flex-col tw-items-start tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-950/60 tw-px-4 tw-py-3 sm:tw-flex-row sm:tw-flex-wrap sm:tw-items-center sm:tw-gap-x-3">
      <TdhStatusPill
        pill={load.status === "published" ? "checkedBuild" : "bundled"}
        locale={locale}
        size="sm"
      />
      <p
        className="tw-m-0 tw-min-w-0 tw-flex-1 tw-text-xs tw-leading-5 tw-text-iron-300"
        data-tdh-manifest={load.status}
      >
        {load.status === "published"
          ? t(locale, "network.tdh.formal.manifest.published")
          : t(
              locale,
              `network.tdh.formal.manifest.bundled.${load.reason}`
            )}{" "}
        {build}
        {spec && ` ${spec}`}
      </p>
      {load.status === "published" && (
        <a
          href={load.url}
          className={`${TDH_LINK} tw-inline-flex tw-min-h-11 tw-items-center tw-gap-1.5 tw-text-xs`}
        >
          <ArrowDownTrayIcon aria-hidden="true" className="tw-size-4" />
          {t(locale, "network.tdh.formal.manifest.json")}
        </a>
      )}
    </div>
  );
}

/**
 * Shown while the manifest records an earlier round of the model than the
 * design repository has: what round 4 adds, by its PROOFS.md.
 */
function RoundFourNote({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <p
      className="tw-m-0 tw-mt-3 tw-max-w-4xl tw-text-xs tw-leading-5 tw-text-iron-400"
      data-tdh-round-note
    >
      {t(locale, "network.tdh.formal.manifest.round4", {
        commit: LEAN_ROUND_4.commit,
        date: formatUtcDate(
          locale,
          `${LEAN_ROUND_4.date}T00:00:00Z`,
          LONG_DATE
        ),
      })}
    </p>
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
                <span className="tw-mr-1 tw-text-xs tw-text-iron-400 md:tw-hidden">
                  {t(locale, "network.tdh.formal.cases.first")}:
                </span>
                {pair(row.first)}
              </td>
              <td
                className={`${TDH_TD_NUM} tw-border-0 tw-p-0 tw-text-success md:tw-border-b md:tw-border-solid md:tw-px-4 md:tw-py-3`}
              >
                <span className="tw-mr-1 tw-text-xs tw-text-iron-400 md:tw-hidden">
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
      lede={
        <>
          <p className="tw-m-0">{t(locale, "network.tdh.formal.lede")}</p>
          <p className="tw-m-0 tw-text-base tw-leading-7 tw-text-iron-300">
            {t(locale, "network.tdh.formal.status")}
            <TdhSource refs={["P26 header"]} locale={locale} />
          </p>
        </>
      }
      headerExtra={
        <>
          <SummaryBand
            locale={locale}
            figures={figures}
            checks={checks}
            statements={statements}
            round={round}
          />
          <ManifestSource locale={locale} load={load} figures={figures} />
          {round < 4 && <RoundFourNote locale={locale} />}
        </>
      }
    >
      <TdhSection
        id="why"
        title={t(locale, "network.tdh.formal.why.title")}
        locale={locale}
        wide
      >
        <div className="tw-space-y-4">
          <p className={PROSE}>
            {t(locale, "network.tdh.formal.why.body")}
            <TdhSource refs={["Clean room 2026-10-11"]} locale={locale} />
          </p>
          <p className={PROSE}>
            {t(locale, "network.tdh.formal.why.body2")}
            <TdhSource refs={["P26 §7.1", "D131"]} locale={locale} />
          </p>
        </div>
      </TdhSection>

      {featured?.lean && (
        <TdhSection
          id="featured"
          title={t(locale, "network.tdh.formal.featured.title")}
          locale={locale}
          wide
        >
          <div className="tw-grid tw-gap-8 lg:tw-grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="tw-space-y-4">
              <p className={PROSE}>
                {t(locale, "network.tdh.formal.featured.plain")}
                <TdhSource refs={["P26 §7.1"]} locale={locale} />
              </p>
              <p className={`${PROSE} tw-font-medium tw-text-iron-50`}>
                {t(locale, "network.tdh.formal.featured.means")}
              </p>
              <p className="tw-m-0 tw-max-w-3xl tw-rounded-lg tw-border-0 tw-border-l-2 tw-border-solid tw-border-amber-400/70 tw-bg-amber-400/[0.05] tw-py-2 tw-pl-4 tw-pr-3 tw-text-sm tw-leading-6 tw-text-iron-200">
                {t(locale, "network.tdh.formal.featured.limit")}
                <TdhSource refs={["P26 §5"]} locale={locale} />
              </p>
            </div>
            <NettingFigure locale={locale} />
          </div>
          <div className="tw-mt-6 tw-grid tw-max-w-4xl tw-gap-4">
            <div className="tw-min-w-0">
              <TdhRuleBlock
                code={featured.lean}
                locale={locale}
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
        wide
      >
        <div className="tw-space-y-6">
          <p className={PROSE}>
            {t(locale, "network.tdh.formal.statements.intro")}
          </p>
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
                    className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400"
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
        </div>
      </TdhSection>

      <TdhSection
        id="contains"
        title={t(locale, "network.tdh.formal.contains.title")}
        locale={locale}
        wide
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
              rawLogs: formatInteger(locale, runs.rawLogs),
              duration: dayDuration(locale, runs),
              total: formatInteger(locale, runs.fullDayTotal),
              records: formatInteger(locale, runs.fullDayRecords),
              randomInputs: formatInteger(locale, runs.randomInputs),
              randomChecks: formatInteger(locale, runs.randomChecks),
              readme: runs.readmeCommit,
            })}
            <TdhSource refs={["P26 §13"]} locale={locale} />
          </p>
          <p className="tw-m-0 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(locale, byRound(round, "network.tdh.formal.contains.outside"))}
          </p>
          <div className={TDH_TABLE_FRAME}>
            <table className={`${TDH_TABLE} tw-block md:tw-table`}>
              <caption
                className={`${TDH_CAPTION} tw-block md:tw-table-caption`}
              >
                {t(locale, "network.tdh.formal.module.caption")}
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
                      className={`${TDH_TD_STACK_MD} tw-whitespace-nowrap tw-font-mono tw-text-xs tw-text-iron-400`}
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
        wide
      >
        <ul className="tw-m-0 tw-max-w-3xl tw-list-none tw-space-y-4 tw-p-0">
          {NOT_KEYS.map((key) => (
            <li
              key={key}
              className="tw-grid tw-grid-cols-[1.25rem_minmax(0,1fr)] tw-gap-3"
            >
              <span
                aria-hidden="true"
                className="tw-mt-2.5 tw-size-2 tw-rounded-full tw-bg-amber-400"
              />
              <p className="tw-m-0 tw-text-[15px] tw-leading-7 tw-text-iron-300">
                <strong className="tw-font-semibold tw-text-iron-50">
                  {t(locale, `network.tdh.formal.not.${key}.title`)}
                </strong>{" "}
                {t(
                  locale,
                  key === "inputs"
                    ? byRound(round, "network.tdh.formal.not.inputs.body")
                    : `network.tdh.formal.not.${key}.body`,
                  {
                    vectors: figure(locale, figures.vectorsTotal),
                    facts: formatInteger(locale, figures.facts),
                  }
                )}
                {key === "inputs" && (
                  <TdhSource refs={["D118", "D119"]} locale={locale} />
                )}
              </p>
            </li>
          ))}
        </ul>
      </TdhSection>

      <TdhSection
        id="layers"
        title={t(locale, "network.tdh.formal.layers.title")}
        locale={locale}
        wide
      >
        <AssuranceLayers locale={locale} />
      </TdhSection>

      <TdhSection
        id="check"
        title={t(locale, "network.tdh.formal.check.title")}
        locale={locale}
        wide
      >
        <div className="tw-flex tw-max-w-3xl tw-flex-col tw-items-start tw-gap-3">
          <p className={PROSE}>{t(locale, "network.tdh.formal.check.body")}</p>
          <div className="tw-w-full">
            <TdhRuleBlock
              code={t(locale, "network.tdh.formal.check.commands", {
                passed: figure(locale, figures.vectorsPassed),
                total: figure(locale, figures.vectorsTotal),
                checks: figure(locale, figures.vectorChecks),
                nettingPassed: figure(locale, figures.nettingPassed),
                nettingTotal: figure(locale, figures.nettingTotal),
              })}
              locale={locale}
              title={t(locale, "network.tdh.formal.check.title")}
              label={t(locale, "network.tdh.formal.check.title")}
            />
          </div>
          <span className="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-dashed tw-border-iron-600 tw-px-3 tw-py-1 tw-text-xs tw-text-iron-300">
            {t(locale, "network.tdh.shared.sourceToBePublished")}
          </span>
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
