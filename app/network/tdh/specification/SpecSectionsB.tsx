import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import TdhDisclosure from "../shared/TdhDisclosure";
import TdhTableFrame from "../shared/TdhTableFrame";
import TdhRowsPreview from "../shared/TdhRowsPreview";
import { t, type MessageKey } from "@/i18n/messages";
import TdhArrowLink from "../shared/TdhArrowLink";
import TdhCopyButton from "../shared/TdhCopyButton";
import {
  REGISTRY_HASH,
  RULE_BASE,
  RULE_BOOST,
  RULE_DAILY_RATE,
  RULE_FINAL,
  RULE_OUTPUT,
  RULE_RANGE,
  RULE_RATE_SPEC,
  RULE_CYCLE_ROOT,
  RULE_EXPORT_TREES,
  RULE_REGISTRY,
  RULE_REGISTRY_CONSTRAINTS_CONDENSED,
  RULE_REGISTRY_HASH,
  RULE_TOTALS_CONDENSED,
} from "../shared/tdhRules";
import {
  TDH_CARD,
  TDH_TABLE,
  TDH_TD_STACK_MD,
  TDH_TH,
} from "../shared/tdhStyles";
import {
  formatCycleDate,
  middleTruncate,
} from "../verification/components/verificationFormat";
import DeviationsTable from "./DeviationsTable";
import { Plain, Rule, SpecSection, SpecSub } from "./SpecParts";
import {
  BUG_IDS,
  DECISION_IDS,
  FORMULA_PARAMETERS,
  PARAMETER_NAME_COUNT,
  PARAMETERS,
} from "./specData";

/** Rows of a long reference table shown before its "Show all" button. */
const PREVIEW_ROWS = 3;

/**
 * SHA-256 of the two documents section 13 names, at 6529chain f840096, their
 * latest change: P28 is design/canonical-encodings.md, P53
 * design/validator-v1.md.
 */
const DOCUMENT_HASHES = [
  {
    key: "p28",
    sha256: "524c5c9b8458ff08f9f082f667ba1fba936b407b8e477a214c3c93b4d78ea14c",
  },
  {
    key: "p53",
    sha256: "139c608ee2bcbc3986ba3240c056b50fe84036048aec5c26137143e828f1bfe3",
  },
] as const;

const CAPTION =
  "tw-px-4 tw-py-2.5 tw-text-left tw-text-sm tw-font-medium tw-text-iron-200";

/** A parameter value; a long hash or address is shortened in the middle. */
function ParameterValue({
  locale,
  value,
}: {
  readonly locale: SupportedLocale;
  readonly value: string;
}) {
  const match = /0x[0-9a-f]{40,64}/.exec(value);
  if (!match) {
    return <span>{value}</span>;
  }
  const hash = match[0];
  const before = value.slice(0, match.index).replace(/,\s*$/, "");
  const after = value.slice(match.index + hash.length).replace(/^,\s*/, "");
  return (
    <span className="tw-inline-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-0.5">
      {before && <span className="tw-whitespace-nowrap">{before},</span>}
      <span className="tw-inline-flex tw-items-center tw-gap-1 tw-whitespace-nowrap">
        <span title={hash}>
          <span aria-hidden="true">{middleTruncate(hash, 6)}</span>
          <span className="tw-sr-only">{hash}</span>
        </span>
        <TdhCopyButton
          value={hash}
          label={t(locale, "network.tdh.shared.copyNamed", { name: hash })}
          copiedLabel={t(locale, "network.tdh.shared.copied")}
          failedLabel={t(locale, "network.tdh.shared.copyFailed")}
        />
      </span>
      {after && <span className="tw-whitespace-nowrap">{after}</span>}
    </span>
  );
}

const ARITHMETIC = [
  { id: "s8-1", key: "s8-1", rule: RULE_RATE_SPEC, refs: ["P26 §8.1"] },
  { id: "s8-2", key: "s8-2", rule: RULE_BASE, refs: ["P26 §8.2"] },
  { id: "s8-3", key: "s8-3", rule: RULE_BOOST, refs: ["P26 §8.3"] },
  { id: "s8-4", key: "s8-4", rule: RULE_FINAL, refs: ["P26 §8.4"] },
  {
    id: "s8-5",
    key: "s8-5",
    rule: RULE_TOTALS_CONDENSED,
    refs: ["P26 §8.5", "DEV-13"],
  },
  { id: "s8-6", key: "s8-6", rule: RULE_DAILY_RATE, refs: ["P26 §8.6"] },
  { id: "s8-7", key: "s8-7", rule: RULE_RANGE, refs: ["P26 §8.7"] },
] as const;

const CHANGES = ["floors", "netting", "inputs", "vectors"] as const;

const EVIDENCE = [
  { id: "evidence-replay", key: "replay" },
  { id: "evidence-clean-room", key: "cleanRoom" },
  { id: "evidence-comparison", key: "comparison" },
  { id: "evidence-difftest", key: "difftest" },
] as const;

export default function SpecSectionsB({
  locale,
  record = null,
}: {
  readonly locale: SupportedLocale;
  /**
   * The daily comparison's track record, from the feed: the evidence says
   * how it stands as of the latest day, not only the first two.
   */
  readonly record?: {
    readonly latestDate: string;
    readonly days: number;
    readonly allEqual: number;
  } | null;
}) {
  return (
    <>
      <SpecSection
        id="s8"
        title={t(locale, "network.tdh.spec.s8.title")}
        locale={locale}
        sources={["DEV-13", "DEV-14", "DEV-15"]}
      >
        {ARITHMETIC.map((part) => (
          <SpecSub
            key={part.id}
            id={part.id}
            title={t(
              locale,
              `network.tdh.spec.${part.key}.title` as MessageKey
            )}
            locale={locale}
          >
            <Plain>
              {t(locale, `network.tdh.spec.${part.key}.body` as MessageKey)}
            </Plain>
            <Rule
              locale={locale}
              code={part.rule}
              source={part.refs[0]}
              condensed={part.id === "s8-5" || part.id === "s8-7"}
              aligned={part.id === "s8-7"}
            />
          </SpecSub>
        ))}
      </SpecSection>

      <SpecSection
        id="s9"
        title={t(locale, "network.tdh.spec.s9.title")}
        locale={locale}
        sources={[
          "P53 §4.2",
          "P53 §3.1",
          "P28 §3.3",
          "P28 §4.3",
          "P28 §4.4",
          "P28 §4.12",
        ]}
      >
        <Plain>{t(locale, "network.tdh.spec.s9.body")}</Plain>
        <Rule locale={locale} code={RULE_OUTPUT} source="P26 §9" />
        <p className="tw-m-0 tw-max-w-[34rem] tw-text-base tw-leading-7 tw-text-iron-200">
          {t(locale, "network.tdh.spec.s9.root")}
        </p>
        <TdhDisclosure
          tone="strong"
          summary={t(locale, "network.tdh.spec.s9.rootSummary")}
        >
          <div className="tw-space-y-4 tw-pt-1">
            <Rule
              locale={locale}
              code={RULE_CYCLE_ROOT}
              source="P53 §4.2"
              title={t(locale, "network.tdh.spec.s9.rootTitle")}
            />
            <p className="tw-m-0 tw-max-w-[34rem] tw-text-sm tw-leading-6 tw-text-iron-300">
              {t(locale, "network.tdh.spec.s9.leaves")}
            </p>
            <Rule
              locale={locale}
              code={RULE_EXPORT_TREES}
              source="P28 §4.4"
              title={t(locale, "network.tdh.spec.s9.leavesTitle")}
            />
          </div>
        </TdhDisclosure>
      </SpecSection>

      <SpecSection
        id="s10"
        title={t(locale, "network.tdh.spec.s10.title")}
        locale={locale}
        sources={["P28 §1", "P28 §2.6", "P28 §2.7", "P28 §3.1"]}
      >
        <Plain>{t(locale, "network.tdh.spec.s10.body")}</Plain>
        <Rule
          locale={locale}
          code={RULE_REGISTRY_CONSTRAINTS_CONDENSED}
          source="P26 §10"
          condensed
        />
        <TdhDisclosure
          tone="strong"
          summary={t(locale, "network.tdh.spec.s10.tableSummary", {
            count: formatInteger(locale, PARAMETER_NAME_COUNT),
            rows: formatInteger(locale, PARAMETERS.length),
          })}
        >
          <TdhTableFrame label={t(locale, "network.tdh.spec.s10.tableCaption")}>
            <table
              className={`${TDH_TABLE} tw-block md:tw-table md:tw-table-fixed`}
            >
              <caption className={`${CAPTION} tw-block md:tw-table-caption`}>
                {t(locale, "network.tdh.spec.s10.tableCaption")}
              </caption>
              <colgroup className="tw-hidden md:tw-table-column-group">
                <col className="md:tw-w-[34%]" />
                <col className="md:tw-w-[28%]" />
                <col />
              </colgroup>
              <thead className="tw-hidden md:tw-table-header-group">
                <tr>
                  <th scope="col" className={TDH_TH}>
                    {t(locale, "network.tdh.spec.s10.name")}
                  </th>
                  <th scope="col" className={TDH_TH}>
                    {t(locale, "network.tdh.spec.s10.value")}
                  </th>
                  <th scope="col" className={TDH_TH}>
                    {t(locale, "network.tdh.spec.s10.what")}
                  </th>
                </tr>
              </thead>
              <tbody className="tw-block md:tw-table-row-group">
                {PARAMETERS.map((row) => (
                  <tr
                    key={row.name}
                    className="tw-grid tw-gap-1 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-px-4 tw-py-3 first:tw-border-t-0 md:tw-table-row md:tw-p-0"
                  >
                    <th
                      scope="row"
                      className={`${TDH_TD_STACK_MD} tw-font-mono tw-text-xs tw-font-normal tw-text-iron-50 [overflow-wrap:anywhere]`}
                    >
                      {row.name}
                      {FORMULA_PARAMETERS.has(row.name) && (
                        <span
                          title={t(locale, "network.tdh.spec.s10.formulaTitle")}
                          className="tw-ml-2 tw-inline-block tw-whitespace-nowrap tw-rounded-full tw-border tw-border-dashed tw-border-iron-600 tw-px-1.5 tw-font-sans tw-text-xs tw-text-iron-300"
                        >
                          {t(locale, "network.tdh.spec.s10.formulaTag")}
                          <span className="tw-sr-only">
                            {": "}
                            {t(locale, "network.tdh.spec.s10.formulaTitle")}
                          </span>
                        </span>
                      )}
                    </th>
                    <td
                      className={`${TDH_TD_STACK_MD} tw-font-mono tw-text-xs tw-text-iron-200`}
                    >
                      <ParameterValue locale={locale} value={row.value} />
                    </td>
                    <td
                      className={`${TDH_TD_STACK_MD} tw-text-[13px] tw-text-iron-300`}
                    >
                      {t(
                        locale,
                        `network.tdh.spec.param.${row.key}` as MessageKey
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TdhTableFrame>
        </TdhDisclosure>
        <div className={`${TDH_CARD} tw-max-w-[34rem] tw-p-4`}>
          <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100">
            {t(locale, "network.tdh.spec.s10.hash")}
          </p>
          <p className="tw-m-0 tw-mt-1 tw-flex tw-items-center tw-gap-1">
            <code className="tw-min-w-0 tw-break-all tw-font-mono tw-text-xs tw-text-iron-200">
              {REGISTRY_HASH}
            </code>
            <TdhCopyButton
              value={REGISTRY_HASH}
              label={t(locale, "network.tdh.shared.copyNamed", {
                name: t(locale, "network.tdh.spec.s10.hash"),
              })}
              copiedLabel={t(locale, "network.tdh.shared.copied")}
              failedLabel={t(locale, "network.tdh.shared.copyFailed")}
            />
          </p>
          <p className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-300">
            {t(locale, "network.tdh.spec.s10.hashNote")}
          </p>
        </div>
        <TdhDisclosure
          tone="strong"
          summary={t(locale, "network.tdh.spec.s10.hashSummary")}
        >
          <div className="tw-space-y-4 tw-pt-1">
            <Rule locale={locale} code={RULE_REGISTRY} source="P26 §10" />
            <Rule
              locale={locale}
              code={RULE_REGISTRY_HASH}
              source="P28 §1"
              moreSources={["P28 §2.6", "P28 §2.7", "P28 §3.1"]}
              title={t(locale, "network.tdh.spec.s10.hashRuleTitle")}
              aligned
            />
          </div>
        </TdhDisclosure>
      </SpecSection>

      <SpecSection
        id="s11"
        title={t(locale, "network.tdh.spec.s11.title")}
        locale={locale}
        sources={["D121", "D131"]}
      >
        <Plain>{t(locale, "network.tdh.spec.s11.body")}</Plain>
        {/* The first rows inline, the rest one click away. */}
        <DeviationsTable locale={locale} />
      </SpecSection>

      <SpecSection
        id="s12"
        title={t(locale, "network.tdh.spec.s12.title")}
        locale={locale}
      >
        <Plain>{t(locale, "network.tdh.spec.s12.body")}</Plain>
        <TdhRowsPreview
          more={t(locale, "network.tdh.spec.s12.showAll", {
            count: formatInteger(locale, BUG_IDS.length),
          })}
          less={t(locale, "network.tdh.spec.s12.showFewer")}
          ids={BUG_IDS.map((id) => `bug-${id}`)}
        >
          <TdhTableFrame label={t(locale, "network.tdh.spec.s12.tableCaption")}>
            <table className={`${TDH_TABLE} tw-block md:tw-table`}>
              <caption className={`${CAPTION} tw-block md:tw-table-caption`}>
                {t(locale, "network.tdh.spec.s12.tableCaption")}
              </caption>
              <thead className="tw-hidden md:tw-table-header-group">
                <tr>
                  <th scope="col" className={TDH_TH}>
                    {t(locale, "network.tdh.spec.s12.id")}
                  </th>
                  <th scope="col" className={TDH_TH}>
                    {t(locale, "network.tdh.spec.s12.issue")}
                  </th>
                  <th scope="col" className={TDH_TH}>
                    {t(locale, "network.tdh.spec.s12.fixed")}
                  </th>
                </tr>
              </thead>
              <tbody className="tw-block md:tw-table-row-group">
                {BUG_IDS.map((id, index) => (
                  <tr
                    key={id}
                    id={`bug-${id}`}
                    data-tdh-more-row={index >= PREVIEW_ROWS ? "" : undefined}
                    className="tw-grid tw-scroll-mt-28 tw-gap-1 tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.06] tw-px-4 tw-py-3 first:tw-border-t-0 target:tw-bg-primary-500/10 md:tw-table-row md:tw-p-0"
                  >
                    <th
                      scope="row"
                      className={`${TDH_TD_STACK_MD} tw-whitespace-nowrap tw-font-mono tw-text-[13px] tw-font-medium tw-text-iron-50`}
                    >
                      {`BUG-${id}`}
                    </th>
                    <td className={TDH_TD_STACK_MD}>
                      {t(
                        locale,
                        `network.tdh.spec.bug.${id}.issue` as MessageKey
                      )}
                    </td>
                    <td className={`${TDH_TD_STACK_MD} tw-text-iron-300`}>
                      <span
                        aria-hidden="true"
                        className="tw-mr-1 tw-text-sm tw-text-iron-500 md:tw-hidden"
                      >
                        {t(locale, "network.tdh.spec.s12.fixed")}:
                      </span>
                      {t(
                        locale,
                        `network.tdh.spec.bug.${id}.fixed` as MessageKey
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TdhTableFrame>
        </TdhRowsPreview>
      </SpecSection>

      <SpecSection
        id="s13"
        title={t(locale, "network.tdh.spec.s13.title")}
        locale={locale}
        sources={["Clean room 2026-10-11", "D116", "D125"]}
      >
        <Plain>{t(locale, "network.tdh.spec.s13.body")}</Plain>
        <aside
          aria-labelledby="spec-implementers"
          className="tw-max-w-[34rem] tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-px-4 tw-py-3"
        >
          <h3
            id="spec-implementers"
            className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-50"
          >
            {t(locale, "network.tdh.spec.implementers.title")}
          </h3>
          <p className="tw-m-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-200">
            {t(locale, "network.tdh.spec.implementers.body")}
          </p>
          <TdhDisclosure
            className="tw-mt-1"
            summary={t(locale, "network.tdh.spec.implementers.hashesSummary")}
          >
            <dl className="tw-m-0 tw-grid tw-gap-1 tw-pb-1 tw-pl-6 tw-text-sm tw-leading-6">
              {DOCUMENT_HASHES.map((document) => (
                <div key={document.key} className="tw-min-w-0">
                  <dt className="tw-text-iron-200">
                    {t(
                      locale,
                      `network.tdh.spec.implementers.${document.key}` as MessageKey
                    )}
                  </dt>
                  <dd className="tw-m-0 tw-break-all tw-font-mono tw-text-[13px] tw-text-iron-100">
                    {document.sha256}
                  </dd>
                </div>
              ))}
            </dl>
          </TdhDisclosure>
        </aside>
        <TdhArrowLink href="/network/tdh/implementations">
          {t(locale, "network.tdh.spec.s13.link")}
        </TdhArrowLink>
      </SpecSection>

      <SpecSection
        id="decisions"
        title={t(locale, "network.tdh.spec.decisions.title")}
        locale={locale}
      >
        <p className="tw-m-0 tw-max-w-[34rem] tw-text-base tw-leading-7 tw-text-iron-200">
          {t(locale, "network.tdh.spec.decisions.intro")}
        </p>
        <TdhDisclosure
          tone="strong"
          summary={t(locale, "network.tdh.spec.decisions.summary", {
            count: formatInteger(locale, DECISION_IDS.length),
          })}
        >
          <dl className="tw-m-0 tw-max-w-3xl tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07]">
            {DECISION_IDS.map((id) => (
              <div
                key={id}
                id={id.toLowerCase()}
                className="tw-grid tw-scroll-mt-28 tw-gap-1 tw-px-4 tw-py-3 target:tw-bg-primary-500/10 sm:tw-grid-cols-[4.5rem_minmax(0,1fr)] sm:tw-gap-4"
              >
                <dt className="tw-font-mono tw-text-sm tw-font-semibold tw-text-iron-50">
                  {id}
                </dt>
                <dd className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
                  {t(locale, `network.tdh.spec.decision.${id}` as MessageKey)}
                </dd>
              </div>
            ))}
          </dl>
        </TdhDisclosure>
      </SpecSection>

      <SpecSection
        id="evidence"
        title={t(locale, "network.tdh.spec.evidence.title")}
        locale={locale}
      >
        <p className="tw-m-0 tw-max-w-[34rem] tw-text-base tw-leading-7 tw-text-iron-200">
          {t(locale, "network.tdh.spec.evidence.intro")}
        </p>
        <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800 tw-border-0 tw-border-y tw-border-solid tw-border-iron-800">
          {EVIDENCE.map((item) => (
            <div
              key={item.id}
              id={item.id}
              className="tw-scroll-mt-28 target:tw-bg-primary-500/[0.06]"
            >
              <TdhDisclosure
                tone="strong"
                summary={t(
                  locale,
                  `network.tdh.spec.evidence.${item.key}.title`
                )}
              >
                <div className="tw-pb-3 tw-pl-6">
                  <p className="tw-m-0 tw-max-w-[34rem] tw-text-sm tw-leading-6 tw-text-iron-300">
                    {t(locale, `network.tdh.spec.evidence.${item.key}.body`)}
                  </p>
                  {item.key === "comparison" && record !== null && (
                    <p className="tw-m-0 tw-mt-2 tw-max-w-[34rem] tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-100">
                      {t(locale, "network.tdh.spec.evidence.comparisonAsOf", {
                        date: formatCycleDate(locale, record.latestDate),
                        allEqual: formatInteger(locale, record.allEqual),
                        days: formatInteger(locale, record.days),
                      })}
                    </p>
                  )}
                  {item.key === "comparison" && (
                    <TdhArrowLink href="/network/tdh/verification">
                      {t(locale, "network.tdh.spec.evidence.dashboard")}
                    </TdhArrowLink>
                  )}
                  {item.key === "difftest" && (
                    <TdhArrowLink href="/network/tdh/implementations#difftest-rounds">
                      {t(locale, "network.tdh.shared.difftest.link")}
                    </TdhArrowLink>
                  )}
                </div>
              </TdhDisclosure>
            </div>
          ))}
        </div>
      </SpecSection>

      <SpecSection
        id="changes"
        title={t(locale, "network.tdh.spec.changes.title")}
        locale={locale}
        sources={["D131", "P26 §13"]}
      >
        <p className="tw-m-0 tw-max-w-[34rem] tw-text-base tw-leading-7 tw-text-iron-200">
          {t(locale, "network.tdh.spec.changes.intro")}
        </p>
        <TdhDisclosure
          tone="strong"
          summary={t(locale, "network.tdh.spec.changes.summary")}
        >
          <ul className="tw-m-0 tw-max-w-[34rem] tw-list-disc tw-space-y-2 tw-pl-5 tw-text-sm tw-leading-6 tw-text-iron-300 marker:tw-text-iron-500">
            {CHANGES.map((key) => (
              <li key={key}>
                {t(locale, `network.tdh.spec.changes.${key}` as MessageKey)}
              </li>
            ))}
          </ul>
        </TdhDisclosure>
      </SpecSection>
    </>
  );
}
