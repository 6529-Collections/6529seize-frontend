import { formatInteger, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { baseTdh, finalTdh, rateCents } from "@/lib/tdh/tdhV1Arithmetic";
import TdhArrowLink from "../shared/TdhArrowLink";
import TdhSource from "../shared/TdhSource";
import { RULE_BASE, RULE_BOOST, RULE_FINAL } from "../shared/tdhRules";
import {
  TDH_TABLE,
  TDH_TABLE_FRAME,
  TDH_TABLE_WRAP,
  TDH_TD,
  TDH_TD_NUM,
  TDH_TH,
  TDH_TH_NUM,
} from "../shared/tdhStyles";
import { BOOST_EXAMPLES, HOUSEHOLD_HOLDINGS, MINUTE_EXAMPLE } from "./examples";
import BoostBuilder from "./explorables/BoostBuilder";
import HouseholdWalkthrough from "./explorables/HouseholdWalkthrough";
import { HouseholdDiagram, IdentityGraphDiagram } from "./HowItWorksDiagrams";
import { rateText } from "./HowItWorksStepsA";
import StepSection, { Cited, Example } from "./StepSection";

const CAPTION =
  "tw-px-4 tw-py-2.5 tw-text-left tw-text-sm tw-font-medium tw-text-iron-200";
const H = 3_941;

function Bullets({
  locale,
  items,
}: {
  readonly locale: SupportedLocale;
  readonly items: ReadonlyArray<{
    readonly text: string;
    readonly refs: readonly string[];
  }>;
}) {
  return (
    <ul className="tw-m-0 tw-space-y-2 tw-pl-5 tw-text-[15px] tw-leading-7 tw-text-iron-200 marker:tw-text-iron-500">
      {items.map((item) => (
        <li key={item.text} className="tw-relative">
          {item.text}
          {item.refs.length > 0 && (
            <TdhSource
              refs={item.refs}
              locale={locale}
              className="xl:tw-absolute xl:tw-left-full xl:tw-top-1 xl:tw-ml-6 xl:tw-w-36"
            />
          )}
        </li>
      ))}
    </ul>
  );
}

function Step8({ locale }: { readonly locale: SupportedLocale }) {
  const rate = rateCents(H, 310) ?? 0;
  return (
    <StepSection
      locale={locale}
      step={8}
      title={t(locale, "network.tdh.how.s8.title")}
      rule={RULE_BASE}
      ruleSource="P26 §8.2"
    >
      <Cited locale={locale} refs={["P26 §7.2", "P26 §8.2"]}>
        {t(locale, "network.tdh.how.s8.body")}
      </Cited>
      <Example locale={locale}>
        <p className="tw-m-0">
          {t(locale, "network.tdh.how.s8.example", {
            base: formatInteger(locale, MINUTE_EXAMPLE.base),
          })}
        </p>
      </Example>
      <Cited locale={locale} refs={["P26 §7.3"]}>
        {t(locale, "network.tdh.how.s8.perWallet", {
          one: formatInteger(locale, baseTdh(rate, 1)),
          two: formatInteger(locale, 2 * baseTdh(rate, 1)),
          merged: formatInteger(locale, baseTdh(rate, 2)),
        })}
      </Cited>
    </StepSection>
  );
}

function Step9({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <StepSection
      locale={locale}
      step={9}
      title={t(locale, "network.tdh.how.s9.title")}
      rule={RULE_BOOST}
      ruleSource="P26 §8.3"
    >
      <Cited locale={locale} refs={["P26 §8.3"]}>
        {t(locale, "network.tdh.how.s9.body")}
      </Cited>
      <Bullets
        locale={locale}
        items={[
          {
            text: t(locale, "network.tdh.how.s9.gradients"),
            refs: ["P26 §10"],
          },
          {
            text: t(locale, "network.tdh.how.s9.seasons"),
            refs: ["P26 §5.4", "P26 §8.3"],
          },
          { text: t(locale, "network.tdh.how.s9.partial"), refs: ["P26 §8.3"] },
          { text: t(locale, "network.tdh.how.s9.fullSet"), refs: ["P26 §8.3"] },
        ]}
      />
      <p className="tw-m-0 tw-text-[15px] tw-leading-7 tw-text-iron-200">
        {t(locale, "network.tdh.how.s9.tableIntro")}
      </p>
      <div className={TDH_TABLE_FRAME}>
        <table className={TDH_TABLE}>
          <caption className={CAPTION}>
            {t(locale, "network.tdh.how.s9.tableCaption")}
          </caption>
          <thead>
            <tr>
              <th scope="col" className={TDH_TH}>
                {t(locale, "network.tdh.how.s9.holdings")}
              </th>
              <th scope="col" className={TDH_TH_NUM}>
                {t(locale, "network.tdh.how.s9.boost")}
              </th>
            </tr>
          </thead>
          <tbody>
            {BOOST_EXAMPLES.map((row) => (
              <tr key={row.id}>
                <th scope="row" className={`${TDH_TD} tw-font-normal`}>
                  {t(
                    locale,
                    `network.tdh.how.s9.ex.${row.id}` as Parameters<typeof t>[1]
                  )}
                </th>
                <td
                  className={`${TDH_TD_NUM} tw-font-semibold tw-text-iron-50`}
                >
                  {rateText(locale, row.betaCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Cited locale={locale} refs={["P26 §8.3"]} muted>
        {t(locale, "network.tdh.how.s9.newest")}
      </Cited>
      <BoostBuilder locale={locale} />
    </StepSection>
  );
}

function Step10({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <StepSection
      locale={locale}
      step={10}
      title={t(locale, "network.tdh.how.s10.title")}
    >
      <Cited locale={locale} refs={["P26 §6.1", "P26 §6.2"]}>
        {t(locale, "network.tdh.how.s10.body")}
      </Cited>
      <Cited locale={locale} refs={["P26 §6.3", "P26 §10"]}>
        {t(locale, "network.tdh.how.s10.limit")}
      </Cited>
      <p className="tw-m-0 tw-rounded-lg tw-border-0 tw-border-l-2 tw-border-solid tw-border-amber-400/70 tw-bg-amber-400/[0.05] tw-py-2 tw-pl-4 tw-pr-3 tw-text-sm tw-leading-6 tw-text-iron-200">
        {t(locale, "network.tdh.how.s10.fourth")}
        <TdhSource refs={["P26 §6.3", "P26 §10"]} locale={locale} />
      </p>
      <IdentityGraphDiagram locale={locale} />
      <p className="tw-m-0 tw-text-[15px] tw-font-medium tw-leading-7 tw-text-iron-100">
        {t(locale, "network.tdh.how.s10.changes")}
        <TdhSource
          refs={["P26 §7.1", "P26 §7.3", "P26 §6.4"]}
          locale={locale}
        />
      </p>
      <ol className="tw-m-0 tw-space-y-2 tw-pl-5 tw-text-[15px] tw-leading-7 tw-text-iron-200 marker:tw-text-iron-500">
        <li>{t(locale, "network.tdh.how.s10.change1")}</li>
        <li>{t(locale, "network.tdh.how.s10.change2")}</li>
        <li>{t(locale, "network.tdh.how.s10.change3")}</li>
        <li>
          {t(locale, "network.tdh.how.s10.change4")}
          <TdhSource refs={["DEV-10", "D121"]} locale={locale} />
        </li>
      </ol>
      <Cited locale={locale} refs={["P26 §6.1", "DEV-12"]} muted>
        {t(locale, "network.tdh.how.s10.delegation")}
      </Cited>
      <p className="tw-m-0">
        <TdhArrowLink href="/network/tdh/consolidation">
          {t(locale, "network.tdh.how.s10.guide")}
        </TdhArrowLink>
      </p>
    </StepSection>
  );
}

function Step11({ locale }: { readonly locale: SupportedLocale }) {
  const product = formatNumber(
    locale,
    (MINUTE_EXAMPLE.base * MINUTE_EXAMPLE.betaCents) / 100,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
  return (
    <StepSection
      locale={locale}
      step={11}
      title={t(locale, "network.tdh.how.s11.title")}
      rule={RULE_FINAL}
      ruleSource="P26 §8.4"
    >
      <Cited locale={locale} refs={["P26 §8.4"]}>
        {t(locale, "network.tdh.how.s11.body")}
      </Cited>
      <Example locale={locale}>
        <p className="tw-m-0">
          {t(locale, "network.tdh.how.s11.example", {
            base: formatInteger(locale, MINUTE_EXAMPLE.base),
            boost: rateText(locale, MINUTE_EXAMPLE.betaCents),
            product,
            final: formatInteger(locale, MINUTE_EXAMPLE.final),
          })}
        </p>
      </Example>
      <Cited locale={locale} refs={["P26 §8.4", "DEV-14", "D121"]} muted>
        {t(locale, "network.tdh.how.s11.tie", {
          tie: formatInteger(locale, finalTdh(25, 114)),
        })}
      </Cited>
    </StepSection>
  );
}

function Step12({ locale }: { readonly locale: SupportedLocale }) {
  const rates: Record<string, number> = {
    firstgm: rateCents(H, 3_941) ?? 0,
    meme310: rateCents(H, 310) ?? 0,
    gradient1: rateCents(H, 101, true) ?? 0,
    gradient2: rateCents(H, 101, true) ?? 0,
    nextgen: rateCents(H, 1_000) ?? 0,
  };
  return (
    <StepSection
      locale={locale}
      step={12}
      title={t(locale, "network.tdh.how.s12.title")}
    >
      <Cited locale={locale} refs={["P26 §7", "P26 §8"]}>
        {t(locale, "network.tdh.how.s12.body")}
      </Cited>
      <ul
        aria-label={t(locale, "network.tdh.how.s12.holdingsCaption")}
        className="tw-m-0 tw-grid tw-list-none tw-gap-2 tw-p-0 md:tw-hidden"
      >
        {HOUSEHOLD_HOLDINGS.map((holding) => {
          const rate = rates[holding.card] ?? 0;
          const raw = holding.days.reduce((sum, days) => sum + days, 0);
          const sameMeme = holding.wallet === "B" && holding.card === "meme310";
          return (
            <li
              key={`${holding.wallet}-${holding.card}`}
              className="tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-px-4 tw-py-3"
            >
              <p className="tw-m-0 tw-flex tw-items-baseline tw-justify-between tw-gap-3 tw-text-sm">
                <span className="tw-font-medium tw-text-iron-100">
                  {t(
                    locale,
                    sameMeme
                      ? "network.tdh.how.s12.card.meme310Same"
                      : `network.tdh.how.s12.card.${holding.card}`
                  )}
                </span>
                <span className="tw-text-xs tw-text-iron-400">
                  {t(locale, "network.tdh.how.s12.wallet")} {holding.wallet}
                </span>
              </p>
              <dl className="tw-m-0 tw-mt-2 tw-grid tw-grid-cols-[auto_minmax(0,1fr)] tw-gap-x-4 tw-gap-y-1 tw-text-sm tw-tabular-nums">
                <dt className="tw-text-iron-400">
                  {t(locale, "network.tdh.how.s12.days")}
                </dt>
                <dd className="tw-m-0 tw-text-right tw-text-iron-200">
                  {holding.wallet === "A" && holding.card === "meme310"
                    ? t(locale, "network.tdh.how.s12.freshCopy")
                    : holding.days
                        .map((days) => formatInteger(locale, days))
                        .join(", ")}
                </dd>
                <dt className="tw-text-iron-400">
                  {t(locale, "network.tdh.how.s12.rate")}
                </dt>
                <dd className="tw-m-0 tw-text-right tw-text-iron-200">
                  {rateText(locale, rate)}
                </dd>
                <dt className="tw-text-iron-400">
                  {t(locale, "network.tdh.how.s12.base")}
                </dt>
                <dd className="tw-m-0 tw-text-right tw-font-semibold tw-text-iron-50">
                  {formatInteger(locale, baseTdh(rate, raw))}
                </dd>
              </dl>
            </li>
          );
        })}
      </ul>
      <div
        className={`${TDH_TABLE_WRAP} tw-hidden md:tw-block`}
        tabIndex={0}
        role="region"
        aria-label={t(locale, "network.tdh.how.s12.holdingsCaption")}
      >
        <table className={`${TDH_TABLE} tw-min-w-[36rem]`}>
          <caption className={CAPTION}>
            {t(locale, "network.tdh.how.s12.holdingsCaption")}
          </caption>
          <thead>
            <tr>
              <th scope="col" className={TDH_TH}>
                {t(locale, "network.tdh.how.s12.wallet")}
              </th>
              <th scope="col" className={TDH_TH}>
                {t(locale, "network.tdh.how.s12.card")}
              </th>
              <th scope="col" className={TDH_TH_NUM}>
                {t(locale, "network.tdh.how.s12.copies")}
              </th>
              <th scope="col" className={TDH_TH_NUM}>
                {t(locale, "network.tdh.how.s12.days")}
              </th>
              <th scope="col" className={TDH_TH_NUM}>
                {t(locale, "network.tdh.how.s12.rate")}
              </th>
              <th scope="col" className={TDH_TH_NUM}>
                {t(locale, "network.tdh.how.s12.base")}
              </th>
            </tr>
          </thead>
          <tbody>
            {HOUSEHOLD_HOLDINGS.map((holding) => {
              const rate = rates[holding.card] ?? 0;
              const raw = holding.days.reduce((sum, days) => sum + days, 0);
              const sameMeme =
                holding.wallet === "B" && holding.card === "meme310";
              return (
                <tr key={`${holding.wallet}-${holding.card}`}>
                  <td className={TDH_TD}>{holding.wallet}</td>
                  <th scope="row" className={`${TDH_TD} tw-font-normal`}>
                    {t(
                      locale,
                      sameMeme
                        ? "network.tdh.how.s12.card.meme310Same"
                        : `network.tdh.how.s12.card.${holding.card}`
                    )}
                  </th>
                  <td className={TDH_TD_NUM}>
                    {formatInteger(locale, holding.days.length)}
                  </td>
                  <td className={TDH_TD_NUM}>
                    {holding.wallet === "A" && holding.card === "meme310"
                      ? t(locale, "network.tdh.how.s12.freshCopy")
                      : holding.days
                          .map((days) => formatInteger(locale, days))
                          .join(", ")}
                  </td>
                  <td className={TDH_TD_NUM}>{rateText(locale, rate)}</td>
                  <td className={`${TDH_TD_NUM} tw-text-iron-50`}>
                    {formatInteger(locale, baseTdh(rate, raw))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Cited locale={locale} refs={["P26 §8.3", "P26 §8.6"]}>
        {t(locale, "network.tdh.how.s12.boostNote")}
      </Cited>
      <HouseholdDiagram locale={locale} />
      <HouseholdWalkthrough locale={locale} />
      <TdhArrowLink href="/network/tdh#tdh-profile">
        {t(locale, "network.tdh.how.s12.cta")}
      </TdhArrowLink>
    </StepSection>
  );
}

function Step13({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <StepSection
      locale={locale}
      step={13}
      title={t(locale, "network.tdh.how.s13.title")}
    >
      <Cited locale={locale} refs={["P26 §8.5", "P26 §13", "DEV-13", "D121"]}>
        {t(locale, "network.tdh.how.s13.body")}
      </Cited>
      <p className="tw-m-0 tw-flex tw-flex-col tw-items-start tw-gap-1 tw-rounded-lg tw-border tw-border-solid tw-border-success/30 tw-bg-success/[0.05] tw-px-4 tw-py-3 tw-text-[15px] tw-leading-7 tw-text-iron-100">
        {t(locale, "network.tdh.how.s13.verify")}
        <TdhArrowLink href="/network/tdh/verification">
          {t(locale, "network.tdh.how.s13.verifyLink")}
        </TdhArrowLink>
      </p>
    </StepSection>
  );
}

function Step14({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <StepSection
      locale={locale}
      step={14}
      title={t(locale, "network.tdh.how.s14.title")}
    >
      <Cited locale={locale} refs={["D132", "D121"]}>
        {t(locale, "network.tdh.how.s14.body")}
      </Cited>
      <Bullets
        locale={locale}
        items={[
          {
            text: t(locale, "network.tdh.how.s14.item1"),
            refs: ["DEV-3", "DEV-4"],
          },
          { text: t(locale, "network.tdh.how.s14.item2"), refs: ["DEV-6"] },
          { text: t(locale, "network.tdh.how.s14.item3"), refs: ["DEV-7"] },
          { text: t(locale, "network.tdh.how.s14.item4"), refs: ["DEV-8"] },
          {
            text: t(locale, "network.tdh.how.s14.item5"),
            refs: ["DEV-2", "D121", "D132"],
          },
          { text: t(locale, "network.tdh.how.s14.item6"), refs: ["DEV-9"] },
          { text: t(locale, "network.tdh.how.s14.item7"), refs: ["P26 §6.3"] },
        ]}
      />
      <TdhArrowLink href="/network/tdh/verification">
        {t(locale, "network.tdh.how.s14.verify")}
      </TdhArrowLink>
    </StepSection>
  );
}

export default function HowItWorksStepsB({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <>
      <Step8 locale={locale} />
      <Step9 locale={locale} />
      <Step10 locale={locale} />
      <Step11 locale={locale} />
      <Step12 locale={locale} />
      <Step13 locale={locale} />
      <Step14 locale={locale} />
    </>
  );
}
