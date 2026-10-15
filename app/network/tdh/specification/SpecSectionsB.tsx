import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
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
  RULE_RATE,
  RULE_REGISTRY,
} from "../shared/tdhRules";
import {
  TDH_CARD,
  TDH_LINK_STANDALONE,
  TDH_TABLE,
  TDH_TABLE_FRAME,
  TDH_TABLE_WRAP,
  TDH_TD,
  TDH_TH,
} from "../shared/tdhStyles";
import DeviationsTable from "./DeviationsTable";
import { Plain, Rule, SpecSection, SpecSub } from "./SpecParts";
import { BUG_IDS, DECISION_IDS, PARAMETERS } from "./specData";

const CAPTION =
  "tw-px-4 tw-py-2.5 tw-text-left tw-text-sm tw-font-medium tw-text-iron-200";

const ARITHMETIC = [
  { id: "s8-1", key: "s8-1", rule: RULE_RATE, refs: ["P26 §8.1"] },
  { id: "s8-2", key: "s8-2", rule: RULE_BASE, refs: ["P26 §8.2"] },
  { id: "s8-3", key: "s8-3", rule: RULE_BOOST, refs: ["P26 §8.3"] },
  { id: "s8-4", key: "s8-4", rule: RULE_FINAL, refs: ["P26 §8.4"] },
  { id: "s8-5", key: "s8-5", rule: null, refs: ["P26 §8.5", "DEV-13"] },
  { id: "s8-6", key: "s8-6", rule: RULE_DAILY_RATE, refs: ["P26 §8.6"] },
  { id: "s8-7", key: "s8-7", rule: RULE_RANGE, refs: ["P26 §8.7"] },
] as const;

const EVIDENCE = [
  { id: "evidence-replay", key: "replay" },
  { id: "evidence-clean-room", key: "cleanRoom" },
  { id: "evidence-comparison", key: "comparison" },
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
            {part.rule && (
              <Rule locale={locale} code={part.rule} source={part.refs[0]} />
            )}
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
        <div
          className={TDH_TABLE_WRAP}
          tabIndex={0}
          role="region"
          aria-label={t(locale, "network.tdh.spec.s10.tableCaption")}
        >
          <table className={`${TDH_TABLE} tw-min-w-[44rem]`}>
            <caption className={CAPTION}>
              {t(locale, "network.tdh.spec.s10.tableCaption")}
            </caption>
            <thead>
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
            <tbody>
              {PARAMETERS.map((row) => (
                <tr key={row.name}>
                  <th
                    scope="row"
                    className={`${TDH_TD} tw-font-mono tw-text-xs tw-font-normal tw-text-iron-100`}
                  >
                    {row.name}
                  </th>
                  <td
                    className={`${TDH_TD} tw-max-w-[22rem] tw-break-all tw-font-mono tw-text-xs`}
                  >
                    {row.value}
                  </td>
                  <td className={`${TDH_TD} tw-text-[13px] tw-text-iron-300`}>
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
          <p className="tw-m-0 tw-mt-1 tw-flex tw-items-start tw-gap-1">
            <code className="tw-min-w-0 tw-break-all tw-pt-3 tw-font-mono tw-text-xs tw-text-iron-200">
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
          <table className={TDH_TABLE}>
            <caption className={CAPTION}>
              {t(locale, "network.tdh.spec.s12.tableCaption")}
            </caption>
            <thead>
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
            <tbody>
              {BUG_IDS.map((id) => (
                <tr
                  key={id}
                  id={`bug-${id}`}
                  className="tw-scroll-mt-28 target:tw-bg-primary-500/10"
                >
                  <th
                    scope="row"
                    className={`${TDH_TD} tw-whitespace-nowrap tw-font-mono tw-text-[13px] tw-font-medium tw-text-iron-50`}
                  >
                    {`BUG-${id}`}
                  </th>
                  <td className={TDH_TD}>
                    {t(
                      locale,
                      `network.tdh.spec.bug.${id}.issue` as MessageKey
                    )}
                  </td>
                  <td className={`${TDH_TD} tw-text-iron-300`}>
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
        <Link
          href="/network/tdh/implementations"
          className={`${TDH_LINK_STANDALONE} tw-text-sm`}
        >
          {t(locale, "network.tdh.spec.s13.link")}
        </Link>
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
                <Link
                  href="/network/tdh/verification"
                  className={`${TDH_LINK_STANDALONE} tw-mt-2 tw-text-sm`}
                >
                  {t(locale, "network.tdh.spec.evidence.dashboard")}
                </Link>
              )}
            </article>
          ))}
        </div>
      </SpecSection>
    </>
  );
}
