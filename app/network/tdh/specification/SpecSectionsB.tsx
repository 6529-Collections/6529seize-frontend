import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import TdhArrowLink from "../shared/TdhArrowLink";
import TdhCopyButton from "../shared/TdhCopyButton";
import TdhSource from "../shared/TdhSource";
import {
  REGISTRY_HASH,
  RULE_BASE,
  RULE_BOOST,
  RULE_DAILY_RATE,
  RULE_FINAL,
  RULE_OUTPUT,
  RULE_RANGE,
  RULE_RATE_SPEC,
  RULE_REGISTRY,
  RULE_REGISTRY_CONSTRAINTS_CONDENSED,
  RULE_TOTALS_CONDENSED,
} from "../shared/tdhRules";
import {
  TDH_CARD,
  TDH_TABLE,
  TDH_TABLE_FRAME,
  TDH_TD_STACK_MD,
  TDH_TH,
} from "../shared/tdhStyles";
import { middleTruncate } from "../verification/components/verificationFormat";
import DeviationsTable from "./DeviationsTable";
import { Plain, Rule, SpecSection, SpecSub } from "./SpecParts";
import { BUG_IDS, DECISION_IDS, PARAMETERS } from "./specData";

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

const EVIDENCE = [
  { id: "evidence-replay", key: "replay" },
  { id: "evidence-clean-room", key: "cleanRoom" },
  { id: "evidence-comparison", key: "comparison" },
  { id: "evidence-difftest", key: "difftest" },
] as const;

export default function SpecSectionsB({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <>
      <SpecSection
        id="s8"
        title={t(locale, "network.tdh.spec.s8.title")}
        locale={locale}
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
            <Plain locale={locale} refs={part.refs}>
              {t(locale, `network.tdh.spec.${part.key}.body` as MessageKey)}
            </Plain>
            <Rule
              locale={locale}
              code={part.rule}
              source={part.refs[0]}
              condensed={part.id === "s8-5" || part.id === "s8-7"}
            />
          </SpecSub>
        ))}
      </SpecSection>

      <SpecSection
        id="s9"
        title={t(locale, "network.tdh.spec.s9.title")}
        locale={locale}
      >
        <Plain locale={locale} refs={["P26 §9"]}>
          {t(locale, "network.tdh.spec.s9.body")}
        </Plain>
        <Rule locale={locale} code={RULE_OUTPUT} source="P26 §9" />
      </SpecSection>

      <SpecSection
        id="s10"
        title={t(locale, "network.tdh.spec.s10.title")}
        locale={locale}
      >
        <Plain locale={locale} refs={["P26 §10"]}>
          {t(locale, "network.tdh.spec.s10.body")}
        </Plain>
        <Plain locale={locale} refs={["P26 §10"]}>
          {t(locale, "network.tdh.spec.s10.read")}
        </Plain>
        <Rule
          locale={locale}
          code={RULE_REGISTRY_CONSTRAINTS_CONDENSED}
          source="P26 §10"
          condensed
        />
        <div className={TDH_TABLE_FRAME}>
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
        </div>
        <div className={`${TDH_CARD} tw-max-w-3xl tw-p-4`}>
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
          <p className="tw-m-0 tw-mt-1 tw-text-xs tw-text-iron-500">
            {t(locale, "network.tdh.spec.s10.hashNote")}
            <TdhSource refs={["P26 §10"]} locale={locale} />
          </p>
        </div>
        <Rule locale={locale} code={RULE_REGISTRY} source="P26 §10" />
      </SpecSection>

      <SpecSection
        id="s11"
        title={t(locale, "network.tdh.spec.s11.title")}
        locale={locale}
      >
        <Plain locale={locale} refs={["P26 §11", "D121"]}>
          {t(locale, "network.tdh.spec.s11.body")}
        </Plain>
        <DeviationsTable locale={locale} />
      </SpecSection>

      <SpecSection
        id="s12"
        title={t(locale, "network.tdh.spec.s12.title")}
        locale={locale}
      >
        <Plain locale={locale} refs={["P26 §12"]}>
          {t(locale, "network.tdh.spec.s12.body")}
        </Plain>
        <div className={TDH_TABLE_FRAME}>
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
              {BUG_IDS.map((id) => (
                <tr
                  key={id}
                  id={`bug-${id}`}
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
                      className="tw-mr-1 tw-text-xs tw-text-iron-500 md:tw-hidden"
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
        </div>
      </SpecSection>

      <SpecSection
        id="s13"
        title={t(locale, "network.tdh.spec.s13.title")}
        locale={locale}
      >
        <Plain locale={locale} refs={["P26 §13", "Clean room 2026-10-11"]}>
          {t(locale, "network.tdh.spec.s13.body")}
        </Plain>
        <TdhArrowLink href="/network/tdh/implementations">
          {t(locale, "network.tdh.spec.s13.link")}
        </TdhArrowLink>
      </SpecSection>

      <SpecSection
        id="decisions"
        title={t(locale, "network.tdh.spec.decisions.title")}
        locale={locale}
      >
        <p className="tw-m-0 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, "network.tdh.spec.decisions.intro")}
        </p>
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
      </SpecSection>

      <SpecSection
        id="evidence"
        title={t(locale, "network.tdh.spec.evidence.title")}
        locale={locale}
      >
        <div className="tw-grid tw-max-w-4xl tw-gap-4">
          {EVIDENCE.map((item) => (
            <article
              key={item.id}
              id={item.id}
              className={`${TDH_CARD} tw-scroll-mt-28 tw-p-5 target:tw-ring-1 target:tw-ring-primary-400/60`}
            >
              <h3 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
                {t(locale, `network.tdh.spec.evidence.${item.key}.title`)}
              </h3>
              <p className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
                {t(locale, `network.tdh.spec.evidence.${item.key}.body`)}
              </p>
              {item.key === "comparison" && (
                <TdhArrowLink
                  href="/network/tdh/verification"
                  className="tw-mt-2"
                >
                  {t(locale, "network.tdh.spec.evidence.dashboard")}
                </TdhArrowLink>
              )}
            </article>
          ))}
        </div>
      </SpecSection>
    </>
  );
}
