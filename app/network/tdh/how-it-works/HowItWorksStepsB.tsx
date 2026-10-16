import { formatInteger, formatNumber } from "@/i18n/format";
import TdhTableFrame from "../shared/TdhTableFrame";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { baseTdh, finalTdh, rateCents } from "@/lib/tdh/tdhV1Arithmetic";
import TdhArrowLink from "../shared/TdhArrowLink";
import { RULE_BASE, RULE_BOOST, RULE_FINAL } from "../shared/tdhRules";
import {
  TDH_MEASURE,
  TDH_TABLE,
  TDH_TABLE_WRAP,
  TDH_TD,
  TDH_TD_NUM,
  TDH_TH,
  TDH_TH_NUM,
  tdhNarrowCell,
} from "../shared/tdhStyles";
import { BOOST_EXAMPLES, HOUSEHOLD_HOLDINGS, MINUTE_EXAMPLE } from "./examples";
import BoostBuilder from "./explorables/BoostBuilder";
import HouseholdWalkthrough from "./explorables/HouseholdWalkthrough";
import { IdentityGraphDiagram } from "./HowItWorksDiagrams";
import { rateText } from "./HowItWorksStepsA";
import { formatCycleDate } from "../verification/components/verificationFormat";
import TdhDisclosure from "../shared/TdhDisclosure";
import StepSection, {
  Caution,
  Cited,
  Example,
  Measure,
  Note,
} from "./StepSection";

const HOLDINGS_CAPTION = "network.tdh.how.s12.holdingsCaption";
const CAPTION =
  "tw-px-4 tw-py-2.5 tw-text-left tw-text-sm tw-font-medium tw-text-iron-200";
const H = 3_941;

/** A step's list; its sources are on the step's line. */
function Bullets({
  items,
}: {
  readonly locale: SupportedLocale;
  readonly items: ReadonlyArray<{ readonly text: string }>;
}) {
  return (
    <ul
      className={`tw-m-0 tw-space-y-2 tw-pl-5 tw-text-base tw-leading-7 tw-text-iron-200 marker:tw-text-iron-500 ${TDH_MEASURE}`}
    >
      {items.map((item) => (
        <li key={item.text}>{item.text}</li>
      ))}
    </ul>
  );
}

function Step8({ locale }: { readonly locale: SupportedLocale }) {
  const rate = rateCents(H, 310) ?? 0;
  return (
    <StepSection
      locale={locale}
      sources={["P26 §7.2", "P26 §8.2", "P26 §7.3"]}
      step={8}
      title={t(locale, "network.tdh.how.s8.title")}
      rule={RULE_BASE}
      ruleSource="P26 §8.2"
    >
      <Cited locale={locale}>{t(locale, "network.tdh.how.s8.body")}</Cited>
      <Example locale={locale}>
        <p className="tw-m-0">
          {t(locale, "network.tdh.how.s8.example", {
            base: formatInteger(locale, MINUTE_EXAMPLE.base),
          })}
        </p>
      </Example>
      <Cited locale={locale}>
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
      sources={["P26 §8.3", "P26 §10", "P26 §5.4"]}
      step={9}
      title={t(locale, "network.tdh.how.s9.title")}
      rule={RULE_BOOST}
      ruleSource="P26 §8.3"
    >
      <Cited locale={locale}>{t(locale, "network.tdh.how.s9.body")}</Cited>
      <Bullets
        locale={locale}
        items={[
          {
            text: t(locale, "network.tdh.how.s9.gradients"),
          },
          {
            text: t(locale, "network.tdh.how.s9.seasons"),
          },
          { text: t(locale, "network.tdh.how.s9.partial") },
          { text: t(locale, "network.tdh.how.s9.fullSet") },
        ]}
      />
      <Cited locale={locale}>
        {t(locale, "network.tdh.how.s9.tableIntro")}
      </Cited>
      <Measure>
        <TdhTableFrame label={t(locale, "network.tdh.how.s9.tableCaption")}>
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
                      `network.tdh.how.s9.ex.${row.id}` as Parameters<
                        typeof t
                      >[1]
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
        </TdhTableFrame>
      </Measure>
      <TdhDisclosure
        className={TDH_MEASURE}
        summary={t(locale, "network.tdh.how.s9.newestSummary")}
      >
        <p className="tw-m-0 tw-pb-2 tw-pl-6 tw-text-sm tw-leading-6 tw-text-iron-300">
          {t(locale, "network.tdh.how.s9.newest")}
        </p>
      </TdhDisclosure>
      <BoostBuilder locale={locale} />
    </StepSection>
  );
}

function Step10({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <StepSection
      locale={locale}
      sources={[
        "P26 §6.1",
        "P26 §6.2",
        "P26 §6.3",
        "P26 §6.4",
        "P26 §7.1",
        "P26 §7.3",
        "P26 §10",
        "DEV-10",
        "DEV-12",
        "D121",
      ]}
      step={10}
      title={t(locale, "network.tdh.how.s10.title")}
    >
      <Cited locale={locale}>{t(locale, "network.tdh.how.s10.body")}</Cited>
      <Cited locale={locale}>{t(locale, "network.tdh.how.s10.limit")}</Cited>
      <Caution>{t(locale, "network.tdh.how.s10.fourth")}</Caution>
      <IdentityGraphDiagram locale={locale} />
      <p className="tw-m-0 tw-text-base tw-font-medium tw-leading-7 tw-text-iron-100">
        {t(locale, "network.tdh.how.s10.changes")}
      </p>
      <ol
        className={`tw-m-0 tw-space-y-2 tw-pl-5 tw-text-base tw-leading-7 tw-text-iron-200 marker:tw-text-iron-500 ${TDH_MEASURE}`}
      >
        <li>{t(locale, "network.tdh.how.s10.change1")}</li>
        <li>{t(locale, "network.tdh.how.s10.change2")}</li>
        <li>{t(locale, "network.tdh.how.s10.change3")}</li>
        <li>{t(locale, "network.tdh.how.s10.change4")}</li>
      </ol>
      <Cited locale={locale} muted>
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
      sources={["P26 §8.4", "DEV-14", "D121"]}
      step={11}
      title={t(locale, "network.tdh.how.s11.title")}
      rule={RULE_FINAL}
      ruleSource="P26 §8.4"
    >
      <Cited locale={locale}>{t(locale, "network.tdh.how.s11.body")}</Cited>
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
      <Note>
        {t(locale, "network.tdh.how.s11.tie", {
          tie: formatInteger(locale, finalTdh(25, 114)),
        })}
      </Note>
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
      sources={["P26 §7", "P26 §8", "P26 §8.3", "P26 §8.6"]}
      step={12}
      title={t(locale, "network.tdh.how.s12.title")}
    >
      <Cited locale={locale}>{t(locale, "network.tdh.how.s12.body")}</Cited>
      {/* On phones a compact table of three columns, one row group per
          wallet, instead of a card per holding. */}
      <TdhTableFrame
        label={t(locale, HOLDINGS_CAPTION)}
        className="md:tw-hidden"
      >
        <table className={TDH_TABLE}>
          <caption className={CAPTION}>{t(locale, HOLDINGS_CAPTION)}</caption>
          <thead>
            <tr>
              <th scope="col" className={tdhNarrowCell(TDH_TH)}>
                {t(locale, "network.tdh.how.s12.card")}
              </th>
              <th scope="col" className={tdhNarrowCell(TDH_TH_NUM)}>
                {t(locale, "network.tdh.how.s12.daysTimesRate")}
              </th>
              <th scope="col" className={tdhNarrowCell(TDH_TH_NUM)}>
                {t(locale, "network.tdh.how.s12.base")}
              </th>
            </tr>
          </thead>
          {(["A", "B"] as const).map((wallet) => (
            <tbody key={wallet}>
              <tr>
                <th
                  scope="colgroup"
                  colSpan={3}
                  className="tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.05] tw-bg-iron-950/60 tw-px-3 tw-py-2 tw-text-left tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-400"
                >
                  {t(locale, "network.tdh.how.s12.wallet")} {wallet}
                </th>
              </tr>
              {HOUSEHOLD_HOLDINGS.filter(
                (holding) => holding.wallet === wallet
              ).map((holding) => {
                const rate = rates[holding.card] ?? 0;
                const raw = holding.days.reduce((sum, days) => sum + days, 0);
                const sameMeme =
                  holding.wallet === "B" && holding.card === "meme310";
                const fresh =
                  holding.wallet === "A" && holding.card === "meme310";
                return (
                  <tr key={`${holding.wallet}-${holding.card}`}>
                    <th
                      scope="row"
                      className={`${tdhNarrowCell(TDH_TD)} tw-font-normal tw-text-iron-100`}
                    >
                      {t(
                        locale,
                        sameMeme
                          ? "network.tdh.how.s12.card.meme310Same"
                          : `network.tdh.how.s12.card.${holding.card}`
                      )}
                    </th>
                    <td className={tdhNarrowCell(TDH_TD_NUM)}>
                      {fresh
                        ? t(locale, "network.tdh.how.s12.freshCopy")
                        : `${formatInteger(locale, raw)} × ${rateText(locale, rate)}`}
                    </td>
                    <td
                      className={`${tdhNarrowCell(TDH_TD_NUM)} tw-font-semibold tw-text-iron-50`}
                    >
                      {formatInteger(locale, baseTdh(rate, raw))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </TdhTableFrame>
      <div
        className={`${TDH_TABLE_WRAP} tw-hidden md:tw-block`}
        tabIndex={0}
        role="region"
        aria-label={t(locale, HOLDINGS_CAPTION)}
      >
        <table className={`${TDH_TABLE} tw-min-w-[36rem]`}>
          <caption className={CAPTION}>{t(locale, HOLDINGS_CAPTION)}</caption>
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
      <Cited locale={locale}>
        {t(locale, "network.tdh.how.s12.boostNote")}
      </Cited>
      <HouseholdWalkthrough locale={locale} />
      <TdhArrowLink href="/network/tdh#tdh-profile">
        {t(locale, "network.tdh.how.s12.cta")}
      </TdhArrowLink>
    </StepSection>
  );
}

function Step13({
  locale,
  latestTotal,
}: {
  readonly locale: SupportedLocale;
  /** The latest compared day's total, when all three agreed on it. */
  readonly latestTotal: {
    readonly date: string;
    readonly total: number;
  } | null;
}) {
  return (
    <StepSection
      locale={locale}
      sources={["P26 §8.5", "P26 §13", "DEV-13", "D121"]}
      step={13}
      title={t(locale, "network.tdh.how.s13.title")}
    >
      <Cited locale={locale}>{t(locale, "network.tdh.how.s13.body")}</Cited>
      <p
        className={`tw-m-0 tw-flex tw-flex-col tw-items-start tw-gap-1 tw-rounded-lg tw-border tw-border-solid tw-border-success/30 tw-bg-success/[0.05] tw-px-4 tw-py-3 tw-text-base tw-leading-7 tw-text-iron-100 ${TDH_MEASURE}`}
      >
        {latestTotal === null
          ? t(locale, "network.tdh.how.s13.verify")
          : t(locale, "network.tdh.how.s13.latest", {
              date: formatCycleDate(locale, latestTotal.date),
              total: formatInteger(locale, latestTotal.total),
            })}
        <TdhArrowLink href="/network/tdh/verification">
          {t(locale, "network.tdh.how.s13.verifyLink")}
        </TdhArrowLink>
      </p>
    </StepSection>
  );
}

function Step14({
  locale,
  comparedDays,
}: {
  readonly locale: SupportedLocale;
  /** Days the daily comparison has published; null without the feed. */
  readonly comparedDays: number | null;
}) {
  const compared =
    comparedDays === null
      ? t(locale, "network.tdh.how.s14.comparedNoFeed")
      : t(locale, "network.tdh.how.s14.compared", {
          days: formatInteger(locale, comparedDays),
        });
  return (
    <StepSection
      locale={locale}
      sources={[
        "D132",
        "D121",
        "DEV-3",
        "DEV-4",
        "DEV-6",
        "DEV-7",
        "DEV-8",
        "DEV-2",
        "DEV-9",
      ]}
      step={14}
      title={t(locale, "network.tdh.how.s14.title")}
    >
      <Cited locale={locale}>{t(locale, "network.tdh.how.s14.body")}</Cited>
      <Bullets
        locale={locale}
        items={[
          {
            text: t(locale, "network.tdh.how.s14.item1"),
          },
          { text: t(locale, "network.tdh.how.s14.item2") },
          { text: t(locale, "network.tdh.how.s14.item3") },
          { text: t(locale, "network.tdh.how.s14.item4") },
          {
            text: t(locale, "network.tdh.how.s14.item5", { compared }),
          },
          { text: t(locale, "network.tdh.how.s14.item6") },
          { text: t(locale, "network.tdh.how.s14.item7") },
        ]}
      />
      <div className="tw-flex tw-flex-col tw-items-start tw-gap-1">
        <TdhArrowLink href="/network/tdh/verification">
          {t(locale, "network.tdh.how.s14.verify")}
        </TdhArrowLink>
        <TdhArrowLink href="/network/tdh/verification#classes">
          {t(locale, "network.tdh.how.s14.classes")}
        </TdhArrowLink>
      </div>
    </StepSection>
  );
}

export default function HowItWorksStepsB({
  locale,
  comparedDays = null,
  latestTotal = null,
}: {
  readonly locale: SupportedLocale;
  /** Days the daily comparison has published; null without the feed. */
  readonly comparedDays?: number | null;
  /** The latest compared day's total, when all three agreed on it. */
  readonly latestTotal?: {
    readonly date: string;
    readonly total: number;
  } | null;
}) {
  return (
    <>
      <Step8 locale={locale} />
      <Step9 locale={locale} />
      <Step10 locale={locale} />
      <Step11 locale={locale} />
      <Step12 locale={locale} />
      <Step13 locale={locale} latestTotal={latestTotal} />
      <Step14 locale={locale} comparedDays={comparedDays} />
    </>
  );
}
