import { getAppMetadata } from "@/components/providers/metadata";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import TdhPageShell from "../shared/TdhPageShell";
import TdhPager from "../shared/TdhPager";
import TdhRuleBlock from "../shared/TdhRuleBlock";
import TdhSection from "../shared/TdhSection";
import TdhSource from "../shared/TdhSource";
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
import { formatCycleDate } from "../verification/components/verificationFormat";
import AssuranceLayers from "./AssuranceLayers";
import {
  FIRST_RULE_CASES,
  LEAN_BUILD,
  LEAN_STATEMENTS,
  MODEL_MODULES,
  NETTING_DEFINITIONS,
} from "./leanResults";
import NettingFigure from "./NettingFigure";
import StatementsTable from "./StatementsTable";

const PROSE =
  "tw-m-0 tw-max-w-3xl tw-text-[15px] tw-leading-7 tw-text-iron-200";
const NOT_KEYS = ["english", "programs", "inputs", "rule", "lean"] as const;
const FEATURED = LEAN_STATEMENTS.find((row) => row.id === "netting");

function SummaryBand({ locale }: { readonly locale: SupportedLocale }) {
  const proved = LEAN_STATEMENTS.filter(
    (row) => row.status === "proved" && row.group === "p26"
  );
  const provedP53 = LEAN_STATEMENTS.filter(
    (row) => row.status === "proved" && row.group === "p53"
  );
  const shownFalse = LEAN_STATEMENTS.filter(
    (row) => row.status === "shownFalse"
  );
  const items = [
    {
      key: "proved",
      value: formatInteger(locale, proved.length),
      body: t(locale, "network.tdh.formal.summary.provedBody", {
        p53: formatInteger(locale, provedP53.length),
      }),
    },
    {
      key: "false",
      value: formatInteger(locale, shownFalse.length),
      body: t(locale, "network.tdh.formal.summary.falseBody"),
    },
    {
      key: "vectors",
      value: `${formatInteger(locale, LEAN_BUILD.vectorsPassed)} / ${formatInteger(locale, LEAN_BUILD.vectorsTotal)}`,
      body: t(locale, "network.tdh.formal.summary.vectorsBody", {
        checks: formatInteger(locale, LEAN_BUILD.vectorChecks),
      }),
    },
    {
      key: "day",
      value: formatInteger(locale, LEAN_BUILD.fullDayRecords),
      body: t(locale, "network.tdh.formal.summary.dayBody", {
        total: formatInteger(locale, LEAN_BUILD.fullDayTotal),
      }),
    },
  ] as const;
  return (
    <div className="tw-mt-6">
      <ul className="tw-m-0 tw-grid tw-list-none tw-gap-3 tw-p-0 sm:tw-grid-cols-2 lg:tw-grid-cols-4">
        {items.map((item) => (
          <li
            key={item.key}
            className={`${TDH_CARD} tw-flex tw-flex-col tw-border-l-2 tw-p-4 ${
              item.key === "false"
                ? "tw-border-l-amber-400/70"
                : "tw-border-l-success/70"
            }`}
          >
            <p className="tw-m-0 tw-text-3xl tw-font-semibold tw-tabular-nums tw-tracking-tight tw-text-iron-50">
              {item.value}
            </p>
            <p className="tw-m-0 tw-mt-1 tw-min-h-10 tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-100">
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
          tdh: formatInteger(locale, LEAN_BUILD.theoremsTdh),
          p53: formatInteger(locale, LEAN_BUILD.theoremsP53),
        })}{" "}
        {t(locale, "network.tdh.formal.build", {
          date: formatCycleDate(locale, LEAN_BUILD.date),
          version: LEAN_BUILD.leanVersion,
          commit: LEAN_BUILD.commit,
          spec: LEAN_BUILD.specCommit,
        })}
      </p>
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
        <caption className={TDH_CAPTION}>
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

export default function TdhFormalPage() {
  const locale = DEFAULT_LOCALE;
  const p26 = LEAN_STATEMENTS.filter((row) => row.group === "p26");
  const p53 = LEAN_STATEMENTS.filter((row) => row.group === "p53");

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
      headerExtra={<SummaryBand locale={locale} />}
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

      {FEATURED?.lean && (
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
                code={FEATURED.lean}
                locale={locale}
                title={t(locale, "network.tdh.formal.featured.lean")}
                label={FEATURED.file}
              />
              <p className="tw-m-0 tw-mt-2 tw-font-mono tw-text-xs tw-text-iron-400">
                {t(locale, "network.tdh.formal.featured.file", {
                  file: FEATURED.file,
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
              caption={t(locale, "network.tdh.formal.statements.p26")}
              extra={{ firstRule: <FirstRuleCases locale={locale} /> }}
            />
          </div>
          <div className="tw-space-y-3">
            <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
              {t(locale, "network.tdh.formal.statements.p53")}
            </h3>
            <StatementsTable
              locale={locale}
              rows={p53}
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
            {t(locale, "network.tdh.formal.contains.body")}
          </p>
          <p className={PROSE}>
            {t(locale, "network.tdh.formal.contains.runs", {
              checks: formatInteger(locale, LEAN_BUILD.vectorChecks),
              seconds: formatInteger(locale, LEAN_BUILD.fullDaySeconds),
              total: formatInteger(locale, LEAN_BUILD.fullDayTotal),
              randomChecks: formatInteger(locale, LEAN_BUILD.randomChecks),
            })}
            <TdhSource refs={["P26 §13"]} locale={locale} />
          </p>
          <p className="tw-m-0 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(locale, "network.tdh.formal.contains.outside")}
          </p>
          <div className={TDH_TABLE_FRAME}>
            <table className={`${TDH_TABLE} tw-block md:tw-table`}>
              <caption className={TDH_CAPTION}>
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
                {MODEL_MODULES.map((row) => (
                  <tr
                    key={row.module}
                    className="tw-grid tw-gap-1 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-px-4 tw-py-3 first:tw-border-t-0 md:tw-table-row md:tw-p-0"
                  >
                    <th
                      scope="row"
                      className={`${TDH_TD_STACK_MD} tw-font-mono tw-text-xs tw-font-normal tw-text-iron-100`}
                    >
                      {row.module}
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
                {t(locale, `network.tdh.formal.not.${key}.body`)}
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
              code={t(locale, "network.tdh.formal.check.commands")}
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
