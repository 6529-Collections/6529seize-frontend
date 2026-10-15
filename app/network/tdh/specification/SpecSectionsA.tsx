import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import TdhCopyButton from "../shared/TdhCopyButton";
import TdhSource from "../shared/TdhSource";
import TdhStatusPill from "../shared/TdhStatusPill";
import {
  RULE_CLUSTERS,
  RULE_CONVENTIONS,
  RULE_CUTOFF_SPEC,
  RULE_EDITIONS,
  RULE_ORDER,
  RULE_PAIR_STATE,
  RULE_RATE,
  RULE_SEASONS,
  RULE_STACKS,
} from "../shared/tdhRules";
import {
  TDH_FOCUS_RING,
  TDH_TABLE,
  TDH_TABLE_WRAP,
  TDH_TD,
  TDH_TH,
} from "../shared/tdhStyles";
import { IdentityGraphDiagram } from "../how-it-works/HowItWorksDiagrams";
import { PairStateMachine } from "./SpecDiagrams";
import { PendingNote, Plain, Rule, SpecSection, SpecSub } from "./SpecParts";
import { CONTRACTS, TOPICS } from "./specData";

const CAPTION =
  "tw-px-4 tw-py-2.5 tw-text-left tw-text-sm tw-font-medium tw-text-iron-200";

function Address({
  locale,
  value,
}: {
  readonly locale: SupportedLocale;
  readonly value: string;
}) {
  return (
    <span className="tw-inline-flex tw-items-center tw-gap-0.5">
      <code className="tw-break-all tw-font-mono tw-text-xs tw-text-iron-200">
        {value}
      </code>
      <TdhCopyButton
        value={value}
        label={t(locale, "network.tdh.shared.copyNamed", { name: value })}
        copiedLabel={t(locale, "network.tdh.shared.copied")}
        failedLabel={t(locale, "network.tdh.shared.copyFailed")}
      />
    </span>
  );
}

function Section2({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <SpecSection
      id="s2"
      title={t(locale, "network.tdh.spec.s2.title")}
      locale={locale}
    >
      <Plain locale={locale} refs={["P26 §2"]}>
        {t(locale, "network.tdh.spec.s2.body")}
      </Plain>
      <div
        className={TDH_TABLE_WRAP}
        tabIndex={0}
        role="region"
        aria-label={t(locale, "network.tdh.spec.s2.tableCaption")}
      >
        <table className={`${TDH_TABLE} tw-min-w-[44rem]`}>
          <caption className={CAPTION}>
            {t(locale, "network.tdh.spec.s2.tableCaption")}
          </caption>
          <thead>
            <tr>
              <th scope="col" className={TDH_TH}>
                {t(locale, "network.tdh.spec.s2.role")}
              </th>
              <th scope="col" className={TDH_TH}>
                {t(locale, "network.tdh.spec.s2.contract")}
              </th>
              <th scope="col" className={TDH_TH}>
                {t(locale, "network.tdh.spec.s2.standard")}
              </th>
              <th scope="col" className={TDH_TH}>
                {t(locale, "network.tdh.spec.s2.events")}
              </th>
            </tr>
          </thead>
          <tbody>
            {CONTRACTS.map((contract) => (
              <tr key={contract.key}>
                <th scope="row" className={`${TDH_TD} tw-font-normal`}>
                  {t(locale, `network.tdh.spec.s2.${contract.key}`)}
                </th>
                <td className={TDH_TD}>
                  <Address locale={locale} value={contract.address} />
                </td>
                <td className={`${TDH_TD} tw-whitespace-nowrap`}>
                  {contract.standard ?? "–"}
                </td>
                <td className={`${TDH_TD} tw-text-[13px]`}>
                  {contract.events ??
                    t(
                      locale,
                      contract.key === "delegation"
                        ? "network.tdh.spec.s2.delegationEvents"
                        : "network.tdh.spec.s2.manifoldEvents"
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details className="tw-group tw-max-w-3xl">
        <summary
          className={`tw-inline-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-text-sm tw-font-medium tw-text-iron-300 hover:tw-text-iron-50 ${TDH_FOCUS_RING}`}
        >
          {t(locale, "network.tdh.spec.s2.topics")}
        </summary>
        <div
          className={`${TDH_TABLE_WRAP} tw-mt-2`}
          tabIndex={0}
          role="region"
          aria-label={t(locale, "network.tdh.spec.s2.topicsCaption")}
        >
          <table className={`${TDH_TABLE} tw-min-w-[48rem]`}>
            <caption className={CAPTION}>
              {t(locale, "network.tdh.spec.s2.topicsCaption")}
            </caption>
            <thead>
              <tr>
                <th scope="col" className={TDH_TH}>
                  {t(locale, "network.tdh.spec.s2.event")}
                </th>
                <th scope="col" className={TDH_TH}>
                  topic0
                </th>
              </tr>
            </thead>
            <tbody>
              {TOPICS.map(([signature, topic]) => (
                <tr key={topic}>
                  <th
                    scope="row"
                    className={`${TDH_TD} tw-font-mono tw-text-xs tw-font-normal`}
                  >
                    {signature}
                  </th>
                  <td
                    className={`${TDH_TD} tw-break-all tw-font-mono tw-text-xs`}
                  >
                    {topic}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </SpecSection>
  );
}

export default function SpecSectionsA({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <>
      <SpecSection
        id="s1"
        title={t(locale, "network.tdh.spec.s1.title")}
        locale={locale}
      >
        <Plain locale={locale} refs={["P26 §1"]}>
          {t(locale, "network.tdh.spec.s1.body")}
        </Plain>
        <Rule locale={locale} code={RULE_CONVENTIONS} source="P26 §1" />
      </SpecSection>

      <Section2 locale={locale} />

      <SpecSection
        id="s3"
        title={t(locale, "network.tdh.spec.s3.title")}
        locale={locale}
      >
        <div id="s3-1" className="tw-scroll-mt-24" />
        <div id="s3-2" className="tw-scroll-mt-24" />
        <div id="s3-3" className="tw-scroll-mt-24">
          <Plain locale={locale} refs={["P26 §3.1", "P26 §3.2", "P26 §3.3"]}>
            {t(locale, "network.tdh.spec.s3.body")}
          </Plain>
        </div>
        <div id="s3-4" className="tw-scroll-mt-24">
          <Plain locale={locale} refs={["P26 §3.4"]}>
            {t(locale, "network.tdh.spec.s3.sinks")}
          </Plain>
        </div>
        <Rule locale={locale} code={RULE_ORDER} source="P26 §3.3" />
        <PendingNote>
          <TdhStatusPill pill="ruleTextPending" locale={locale} size="sm" />{" "}
          {t(locale, "network.tdh.spec.s3.d131")}
          <TdhSource refs={["D131"]} locale={locale} />
        </PendingNote>
      </SpecSection>

      <SpecSection
        id="s4"
        title={t(locale, "network.tdh.spec.s4.title")}
        locale={locale}
      >
        <div id="s4-1" className="tw-scroll-mt-24">
          <Plain locale={locale} refs={["P26 §4"]}>
            {t(locale, "network.tdh.spec.s4.body")}
          </Plain>
        </div>
        <div id="s4-2" className="tw-scroll-mt-24" />
        <div id="s4-3" className="tw-scroll-mt-24">
          <Rule locale={locale} code={RULE_CUTOFF_SPEC} source="P26 §4.2" />
        </div>
        <p className="tw-m-0 tw-max-w-3xl tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, "network.tdh.spec.s4.binds")}
        </p>
      </SpecSection>

      <SpecSection
        id="s5"
        title={t(locale, "network.tdh.spec.s5.title")}
        locale={locale}
      >
        <SpecSub
          id="s5-1"
          title={t(locale, "network.tdh.spec.s5-1.title")}
          locale={locale}
        >
          <Plain locale={locale} refs={["P26 §5.1"]}>
            {t(locale, "network.tdh.spec.s5-1.body")}
          </Plain>
        </SpecSub>
        <SpecSub
          id="s5-2"
          title={t(locale, "network.tdh.spec.s5-2.title")}
          locale={locale}
        >
          <Plain locale={locale} refs={["P26 §5.2"]}>
            {t(locale, "network.tdh.spec.s5-2.body")}
          </Plain>
          <Rule locale={locale} code={RULE_EDITIONS} source="P26 §5.2" />
        </SpecSub>
        <SpecSub
          id="s5-3"
          title={t(locale, "network.tdh.spec.s5-3.title")}
          locale={locale}
        >
          <Plain locale={locale} refs={["P26 §5.3"]}>
            {t(locale, "network.tdh.spec.s5-3.body")}
          </Plain>
          <Rule locale={locale} code={RULE_RATE} source="P26 §8.1" />
        </SpecSub>
        <SpecSub
          id="s5-4"
          title={t(locale, "network.tdh.spec.s5-4.title")}
          locale={locale}
        >
          <Plain locale={locale} refs={["P26 §5.4", "P26 §10"]}>
            {t(locale, "network.tdh.spec.s5-4.body")}
          </Plain>
          <Rule locale={locale} code={RULE_SEASONS} source="P26 §10" />
        </SpecSub>
      </SpecSection>

      <SpecSection
        id="s6"
        title={t(locale, "network.tdh.spec.s6.title")}
        locale={locale}
      >
        <SpecSub
          id="s6-1"
          title={t(locale, "network.tdh.spec.s6-1.title")}
          locale={locale}
        >
          <Plain locale={locale} refs={["P26 §6.1"]}>
            {t(locale, "network.tdh.spec.s6-1.body")}
          </Plain>
        </SpecSub>
        <SpecSub
          id="s6-2"
          title={t(locale, "network.tdh.spec.s6-2.title")}
          locale={locale}
        >
          <Plain locale={locale} refs={["P26 §6.2", "DEV-12"]}>
            {t(locale, "network.tdh.spec.s6-2.body")}
          </Plain>
          <PairStateMachine locale={locale} />
          <Rule locale={locale} code={RULE_PAIR_STATE} source="P26 §6.2" />
        </SpecSub>
        <SpecSub
          id="s6-3"
          title={t(locale, "network.tdh.spec.s6-3.title")}
          locale={locale}
        >
          <Plain locale={locale} refs={["P26 §6.3"]}>
            {t(locale, "network.tdh.spec.s6-3.body")}
          </Plain>
          <IdentityGraphDiagram locale={locale} />
          <Rule locale={locale} code={RULE_CLUSTERS} source="P26 §6.3" />
        </SpecSub>
        <SpecSub
          id="s6-4"
          title={t(locale, "network.tdh.spec.s6-4.title")}
          locale={locale}
        >
          <div id="s6-5" className="tw-scroll-mt-24" />
          <Plain locale={locale} refs={["P26 §6.4", "P26 §6.5", "DEV-10"]}>
            {t(locale, "network.tdh.spec.s6-4.body")}
          </Plain>
        </SpecSub>
      </SpecSection>

      <SpecSection
        id="s7"
        title={t(locale, "network.tdh.spec.s7.title")}
        locale={locale}
      >
        <div id="s7-1" className="tw-scroll-mt-24" />
        <div id="s7-2" className="tw-scroll-mt-24" />
        <div id="s7-3" className="tw-scroll-mt-24">
          <Plain locale={locale} refs={["P26 §7"]}>
            {t(locale, "network.tdh.spec.s7.body")}
          </Plain>
        </div>
        <Rule locale={locale} code={RULE_STACKS} source="P26 §7.1" />
        <PendingNote>
          <TdhStatusPill pill="ruleTextPending" locale={locale} size="sm" />{" "}
          {t(locale, "network.tdh.spec.s7.d131")}
          <TdhSource refs={["D131"]} locale={locale} />
        </PendingNote>
      </SpecSection>
    </>
  );
}
