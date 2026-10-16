import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import TdhCopyButton from "../shared/TdhCopyButton";
import TdhDisclosure from "../shared/TdhDisclosure";
import TdhArrowLink from "../shared/TdhArrowLink";
import {
  RULE_CLUSTERS,
  RULE_CONVENTIONS,
  RULE_CUTOFF_SPEC,
  RULE_DECODING_CONDENSED,
  RULE_DELEGATION_CONDENSED,
  RULE_EDITIONS,
  RULE_FLOOR_READ_CONDENSED,
  RULE_IDENTITY_CONDENSED,
  RULE_LOG_SELECTION_CONDENSED,
  RULE_MINTS_CONDENSED,
  RULE_NETTING,
  RULE_ORDER,
  RULE_PAIR_STATE,
  RULE_RATE_SPEC,
  RULE_RECORDS_CONDENSED,
  RULE_REPLAY,
  RULE_SEASONS,
  RULE_TOKEN_VALUES,
  RULE_UNDERFLOW,
} from "../shared/tdhRules";
import {
  TDH_TABLE,
  TDH_TABLE_FRAME,
  TDH_TD,
  TDH_TH,
} from "../shared/tdhStyles";
import { middleTruncate } from "../verification/components/verificationFormat";
import { PairStateMachine } from "./SpecDiagrams";
import { Plain, Rule, SpecSection, SpecSub } from "./SpecParts";
import { CONTRACTS, SYMBOLS, TOPICS } from "./specData";

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
    <span className="tw-inline-flex tw-items-center tw-gap-0.5 tw-whitespace-nowrap">
      <code className="tw-font-mono tw-text-xs tw-text-iron-200" title={value}>
        <span aria-hidden="true">{middleTruncate(value, 6)}</span>
        <span className="tw-sr-only">{value}</span>
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

const MOBILE_CARD =
  "tw-min-w-0 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-px-3 tw-py-2.5";

function contractEvents(locale: SupportedLocale, key: string): string {
  return t(
    locale,
    key === "delegation"
      ? "network.tdh.spec.s2.delegationEvents"
      : "network.tdh.spec.s2.manifoldEvents"
  );
}

function Section2({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <SpecSection
      id="s2"
      title={t(locale, "network.tdh.spec.s2.title")}
      locale={locale}
    >
      <Plain>{t(locale, "network.tdh.spec.s2.body")}</Plain>
      <TdhDisclosure
        tone="strong"
        summary={t(locale, "network.tdh.spec.s2.tableSummary")}
      >
        <ul
          aria-label={t(locale, "network.tdh.spec.s2.tableCaption")}
          className="tw-m-0 tw-grid tw-list-none tw-gap-2 tw-p-0 sm:tw-grid-cols-2 lg:tw-hidden"
        >
          {CONTRACTS.map((contract) => (
            <li key={contract.key} className={MOBILE_CARD}>
              <p className="tw-m-0 tw-flex tw-items-baseline tw-justify-between tw-gap-3 tw-text-sm tw-font-semibold tw-text-iron-50">
                <span>{t(locale, `network.tdh.spec.s2.${contract.key}`)}</span>
                {contract.standard && (
                  <span className="tw-text-sm tw-font-normal tw-text-iron-400">
                    {contract.standard}
                  </span>
                )}
              </p>
              <p className="tw-m-0 tw-mt-1">
                <Address locale={locale} value={contract.address} />
              </p>
              <p className="tw-m-0 tw-mt-1 tw-text-[13px] tw-leading-5 tw-text-iron-300">
                {contract.events ?? contractEvents(locale, contract.key)}
              </p>
            </li>
          ))}
        </ul>
        <div className={`${TDH_TABLE_FRAME} tw-hidden lg:tw-block`}>
          <table className={TDH_TABLE}>
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
                    {contract.events ?? contractEvents(locale, contract.key)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="tw-m-0 tw-mt-4 tw-text-sm tw-font-medium tw-text-iron-100">
          {t(locale, "network.tdh.spec.s2.topics")}
        </p>
        <ul
          aria-label={t(locale, "network.tdh.spec.s2.topicsCaption")}
          className="tw-m-0 tw-mt-2 tw-grid tw-list-none tw-gap-2 tw-p-0 lg:tw-hidden"
        >
          {TOPICS.map(([signature, topic]) => (
            <li key={topic} className={MOBILE_CARD}>
              <p className="tw-m-0 tw-break-all tw-font-mono tw-text-xs tw-leading-5 tw-text-iron-100">
                {signature}
              </p>
              <p className="tw-m-0 tw-mt-1">
                <Address locale={locale} value={topic} />
              </p>
            </li>
          ))}
        </ul>
        <div className={`${TDH_TABLE_FRAME} tw-mt-2 tw-hidden lg:tw-block`}>
          <table className={TDH_TABLE}>
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
                    className={`${TDH_TD} tw-font-mono tw-text-xs tw-font-normal [overflow-wrap:anywhere]`}
                  >
                    {signature}
                  </th>
                  <td className={`${TDH_TD} tw-font-mono tw-text-xs`}>
                    <Address locale={locale} value={topic} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TdhDisclosure>
    </SpecSection>
  );
}

function Symbols({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      id="symbols"
      aria-label={t(locale, "network.tdh.spec.symbols.title")}
      className="tw-scroll-mt-24 tw-pb-6"
    >
      <TdhDisclosure
        tone="strong"
        className="tw-border-0 tw-border-y tw-border-solid tw-border-white/[0.07]"
        summary={t(locale, "network.tdh.spec.symbols.summary")}
      >
        <dl className="tw-m-0 tw-grid tw-grid-cols-1 tw-gap-x-8 tw-gap-y-0 tw-pb-3 md:tw-grid-cols-2">
          {SYMBOLS.map((row) => (
            <div
              key={row.key}
              className="tw-grid tw-grid-cols-1 tw-items-baseline tw-gap-x-3 tw-gap-y-0.5 tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.06] tw-py-2 min-[420px]:tw-grid-cols-[6.5rem_minmax(0,1fr)]"
            >
              <dt className="tw-break-words tw-font-mono tw-text-sm tw-text-iron-50">
                {row.symbol}
              </dt>
              <dd className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-200">
                {t(locale, `network.tdh.spec.symbol.${row.key}` as MessageKey)}{" "}
                <a
                  href={`#s${row.section.replaceAll(".", "-")}`}
                  className="tw-whitespace-nowrap tw-font-mono tw-text-xs tw-text-iron-400 tw-no-underline hover:tw-text-primary-300"
                >
                  §{row.section}
                </a>
              </dd>
            </div>
          ))}
        </dl>
      </TdhDisclosure>
    </section>
  );
}

export default function SpecSectionsA({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <>
      <Symbols locale={locale} />
      <SpecSection
        id="s1"
        title={t(locale, "network.tdh.spec.s1.title")}
        locale={locale}
      >
        <Plain>{t(locale, "network.tdh.spec.s1.body")}</Plain>
        <Rule locale={locale} code={RULE_CONVENTIONS} source="P26 §1" />
      </SpecSection>

      <Section2 locale={locale} />

      <SpecSection
        id="s3"
        title={t(locale, "network.tdh.spec.s3.title")}
        locale={locale}
        sources={["DEV-2", "D131"]}
      >
        <Plain>{t(locale, "network.tdh.spec.s3.body")}</Plain>
        <SpecSub
          id="s3-1"
          title={t(locale, "network.tdh.spec.s3-1.title")}
          locale={locale}
        >
          <Plain>{t(locale, "network.tdh.spec.s3-1.body")}</Plain>
          <Rule
            locale={locale}
            code={RULE_LOG_SELECTION_CONDENSED}
            source="P26 §3.1"
            condensed
          />
        </SpecSub>
        <SpecSub
          id="s3-2"
          title={t(locale, "network.tdh.spec.s3-2.title")}
          locale={locale}
        >
          <Plain>{t(locale, "network.tdh.spec.s3-2.body")}</Plain>
          <Rule
            locale={locale}
            code={RULE_DECODING_CONDENSED}
            source="P26 §3.2"
            condensed
          />
        </SpecSub>
        <SpecSub
          id="s3-3"
          title={t(locale, "network.tdh.spec.s3-3.title")}
          locale={locale}
        >
          <Plain>{t(locale, "network.tdh.spec.s3-3.body")}</Plain>
          <Rule locale={locale} code={RULE_ORDER} source="P26 §3.3" />
        </SpecSub>
        <SpecSub
          id="s3-4"
          title={t(locale, "network.tdh.spec.s3-4.title")}
          locale={locale}
        >
          <Plain>{t(locale, "network.tdh.spec.s3.sinks")}</Plain>
          <Rule
            locale={locale}
            code={RULE_MINTS_CONDENSED}
            source="P26 §3.4"
            condensed
          />
        </SpecSub>
      </SpecSection>

      <SpecSection
        id="s4"
        title={t(locale, "network.tdh.spec.s4.title")}
        locale={locale}
        sources={["DEV-3", "DEV-17", "D121"]}
      >
        <div id="s4-1" className="tw-scroll-mt-24">
          <Plain>{t(locale, "network.tdh.spec.s4.body")}</Plain>
        </div>
        <div id="s4-2" className="tw-scroll-mt-24">
          <Plain>{t(locale, "network.tdh.spec.s4.order")}</Plain>
        </div>
        <div id="s4-3" className="tw-scroll-mt-24">
          <Rule locale={locale} code={RULE_CUTOFF_SPEC} source="P26 §4.2" />
        </div>
        <p className="tw-m-0 tw-max-w-[34rem] tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, "network.tdh.spec.s4.binds")}
        </p>
      </SpecSection>

      <SpecSection
        id="s5"
        title={t(locale, "network.tdh.spec.s5.title")}
        locale={locale}
        sources={["P53 §11.3", "DEV-6", "DEV-7", "DEV-8"]}
      >
        <SpecSub
          id="s5-1"
          title={t(locale, "network.tdh.spec.s5-1.title")}
          locale={locale}
        >
          <Plain>{t(locale, "network.tdh.spec.s5-1.body")}</Plain>
        </SpecSub>
        <SpecSub
          id="s5-2"
          title={t(locale, "network.tdh.spec.s5-2.title")}
          locale={locale}
        >
          <Plain>{t(locale, "network.tdh.spec.s5-2.body")}</Plain>
          <Rule locale={locale} code={RULE_EDITIONS} source="P26 §5.2" />
          <TdhDisclosure
            tone="strong"
            summary={t(locale, "network.tdh.spec.s5-2.floorRead")}
          >
            <div className="tw-pt-1">
              <Rule
                locale={locale}
                code={RULE_FLOOR_READ_CONDENSED}
                source="P53 §11.3"
                condensed
              />
            </div>
          </TdhDisclosure>
        </SpecSub>
        <SpecSub
          id="s5-3"
          title={t(locale, "network.tdh.spec.s5-3.title")}
          locale={locale}
        >
          <Plain>{t(locale, "network.tdh.spec.s5-3.body")}</Plain>
          <Rule locale={locale} code={RULE_RATE_SPEC} source="P26 §8.1" />
        </SpecSub>
        <SpecSub
          id="s5-4"
          title={t(locale, "network.tdh.spec.s5-4.title")}
          locale={locale}
        >
          <Plain>{t(locale, "network.tdh.spec.s5-4.body")}</Plain>
          <Rule locale={locale} code={RULE_SEASONS} source="P26 §10" />
        </SpecSub>
      </SpecSection>

      <SpecSection
        id="s6"
        title={t(locale, "network.tdh.spec.s6.title")}
        locale={locale}
        sources={["DEV-10", "DEV-11", "DEV-12"]}
      >
        <SpecSub
          id="s6-1"
          title={t(locale, "network.tdh.spec.s6-1.title")}
          locale={locale}
        >
          <Plain>{t(locale, "network.tdh.spec.s6-1.body")}</Plain>
          <Rule
            locale={locale}
            code={RULE_DELEGATION_CONDENSED}
            source="P26 §6.1"
            condensed
          />
        </SpecSub>
        <SpecSub
          id="s6-2"
          title={t(locale, "network.tdh.spec.s6-2.title")}
          locale={locale}
        >
          <Plain>{t(locale, "network.tdh.spec.s6-2.body")}</Plain>
          <TdhDisclosure
            tone="strong"
            summary={t(locale, "network.tdh.spec.s6-2.machineSummary")}
          >
            <div className="tw-pt-1">
              <PairStateMachine locale={locale} />
            </div>
          </TdhDisclosure>
          <Rule
            locale={locale}
            code={RULE_PAIR_STATE}
            source="P26 §6.2"
            aligned
          />
        </SpecSub>
        <SpecSub
          id="s6-3"
          title={t(locale, "network.tdh.spec.s6-3.title")}
          locale={locale}
        >
          <Plain>{t(locale, "network.tdh.spec.s6-3.body")}</Plain>
          <Rule locale={locale} code={RULE_CLUSTERS} source="P26 §6.3" />
          <p className="tw-m-0 tw-max-w-[34rem] tw-rounded-lg tw-border-0 tw-border-l-2 tw-border-solid tw-border-amber-400/70 tw-bg-amber-400/[0.05] tw-py-2 tw-pl-4 tw-pr-3 tw-text-sm tw-leading-6 tw-text-iron-200">
            {t(locale, "network.tdh.spec.s11.pending")}
          </p>
          <TdhArrowLink href="/network/tdh/how-it-works#step-10">
            {t(locale, "network.tdh.spec.s6-3.example")}
          </TdhArrowLink>
        </SpecSub>
        <SpecSub
          id="s6-4"
          title={t(locale, "network.tdh.spec.s6-4.title")}
          locale={locale}
        >
          <div id="s6-5" className="tw-scroll-mt-24" />
          <Plain>{t(locale, "network.tdh.spec.s6-4.body")}</Plain>
          <Rule
            locale={locale}
            code={RULE_IDENTITY_CONDENSED}
            source="P26 §6.5"
            condensed
          />
        </SpecSub>
      </SpecSection>

      <SpecSection
        id="s7"
        title={t(locale, "network.tdh.spec.s7.title")}
        locale={locale}
        sources={["D131", "DEV-16"]}
      >
        <SpecSub
          id="s7-1"
          title={t(locale, "network.tdh.spec.s7-1.title")}
          locale={locale}
        >
          <Plain>{t(locale, "network.tdh.spec.s7.body")}</Plain>
          <Rule
            locale={locale}
            code={RULE_UNDERFLOW}
            source="P26 §7.1"
            title={t(locale, "network.tdh.spec.s7.underflow")}
          />
          <Rule
            locale={locale}
            code={RULE_NETTING}
            source="P26 §7.1"
            title={t(locale, "network.tdh.spec.s7.netting")}
          />
          <Rule
            locale={locale}
            code={RULE_REPLAY}
            source="P26 §7.1"
            title={t(locale, "network.tdh.spec.s7.replay")}
          />
          <p className="tw-m-0 tw-max-w-[34rem] tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(locale, "network.tdh.spec.s7.replayNote")}
          </p>
          <Plain>{t(locale, "network.tdh.spec.s7.property")}</Plain>
          <p className="tw-m-0 tw-max-w-[34rem] tw-rounded-lg tw-border-0 tw-border-l-2 tw-border-solid tw-border-amber-400/70 tw-bg-amber-400/[0.05] tw-py-2 tw-pl-4 tw-pr-3 tw-text-sm tw-leading-6 tw-text-iron-200">
            {t(locale, "network.tdh.spec.s7.limit")}
          </p>
        </SpecSub>
        <SpecSub
          id="s7-2"
          title={t(locale, "network.tdh.spec.s7-2.title")}
          locale={locale}
        >
          <Plain>{t(locale, "network.tdh.spec.s7-2.body")}</Plain>
          <Rule locale={locale} code={RULE_TOKEN_VALUES} source="P26 §7.2" />
        </SpecSub>
        <SpecSub
          id="s7-3"
          title={t(locale, "network.tdh.spec.s7-3.title")}
          locale={locale}
        >
          <Plain>{t(locale, "network.tdh.spec.s7-3.body")}</Plain>
          <Rule
            locale={locale}
            code={RULE_RECORDS_CONDENSED}
            source="P26 §7.3"
            condensed
          />
        </SpecSub>
      </SpecSection>
    </>
  );
}
