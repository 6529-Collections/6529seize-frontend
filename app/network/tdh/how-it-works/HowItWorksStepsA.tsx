import { formatInteger, formatNumber } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  DAY_SECONDS,
  EXAMPLE_SNAPSHOT_TIME,
  cycleDayOfDate,
  wholeDays,
} from "@/lib/tdh/tdhV1Arithmetic";
import TransactionBoxDiagram from "../shared/diagrams/TransactionBoxDiagram";
import TdhStatusPill from "../shared/TdhStatusPill";
import {
  RULE_CUTOFF,
  RULE_DAYS,
  RULE_EDITIONS,
  RULE_RATE,
  RULE_STACKS,
} from "../shared/tdhRules";
import {
  TDH_TABLE,
  TDH_TABLE_FRAME,
  TDH_TD,
  TDH_TD_NUM,
  TDH_TH,
  TDH_TH_NUM,
} from "../shared/tdhStyles";
import { EDITION_EXAMPLES, RATE_EXAMPLES } from "./examples";
import DayCounter from "./explorables/DayCounter";
import RateExplorer from "./explorables/RateExplorer";
import StackSimulator from "./explorables/StackSimulator";
import { RateCurveDiagram, StackDiagram } from "./HowItWorksDiagrams";
import StepSection, { Cited, Example } from "./StepSection";

const CAPTION =
  "tw-px-4 tw-py-2.5 tw-text-left tw-text-sm tw-font-medium tw-text-iron-200";

export function rateText(locale: SupportedLocale, cents: number): string {
  return formatNumber(locale, cents / 100, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function Step1({ locale }: { readonly locale: SupportedLocale }) {
  const cycle = cycleDayOfDate("2026-10-15") ?? 0;
  return (
    <StepSection
      locale={locale}
      step={1}
      title={t(locale, "network.tdh.how.s1.title")}
      rule={RULE_CUTOFF}
      ruleSource="P26 §4.2"
    >
      <Cited locale={locale} refs={["P26 §4.1", "P26 §4.2"]}>
        {t(locale, "network.tdh.how.s1.body")}
      </Cited>
      <Cited locale={locale} refs={["P26 §4.2", "P53 §2"]}>
        {t(locale, "network.tdh.how.s1.finality")}
      </Cited>
      <Example locale={locale}>
        <p className="tw-m-0">
          {t(locale, "network.tdh.how.s1.example", {
            cycle: formatInteger(locale, cycle),
            boundary: formatInteger(locale, cycle * DAY_SECONDS),
            snapshot: formatInteger(locale, EXAMPLE_SNAPSHOT_TIME),
          })}
        </p>
      </Example>
    </StepSection>
  );
}

function Step2({ locale }: { readonly locale: SupportedLocale }) {
  const rows = [
    { key: "row1", seconds: 100 * DAY_SECONDS + 23 * 3_600 },
    { key: "row2", seconds: 23 * 3_600 },
    { key: "row3", seconds: DAY_SECONDS },
  ] as const;
  return (
    <StepSection
      locale={locale}
      step={2}
      title={t(locale, "network.tdh.how.s2.title")}
      rule={RULE_DAYS}
      ruleSource="P26 §4.3"
    >
      <Cited locale={locale} refs={["P26 §4.3"]}>
        {t(locale, "network.tdh.how.s2.body")}
      </Cited>
      <div className={TDH_TABLE_FRAME}>
        <table className={TDH_TABLE}>
          <caption className={CAPTION}>
            {t(locale, "network.tdh.how.s2.tableCaption")}
          </caption>
          <thead>
            <tr>
              <th scope="col" className={TDH_TH}>
                {t(locale, "network.tdh.how.s2.acquired")}
              </th>
              <th scope="col" className={TDH_TH_NUM}>
                {t(locale, "network.tdh.how.s2.days")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const days = wholeDays(
                EXAMPLE_SNAPSHOT_TIME,
                EXAMPLE_SNAPSHOT_TIME - row.seconds
              );
              return (
                <tr key={row.key}>
                  <th scope="row" className={`${TDH_TD} tw-font-normal`}>
                    {t(locale, `network.tdh.how.s2.${row.key}`)}
                  </th>
                  <td className={TDH_TD_NUM}>
                    {row.key === "row2"
                      ? t(locale, "network.tdh.how.s2.row2Days", {
                          days: formatInteger(locale, days),
                        })
                      : formatInteger(locale, days)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Cited locale={locale} refs={["P26 §4.3", "DEV-17", "D121"]} muted>
        {t(locale, "network.tdh.how.s2.reference")}
      </Cited>
      <DayCounter locale={locale} />
    </StepSection>
  );
}

function Step3({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <StepSection
      locale={locale}
      step={3}
      title={t(locale, "network.tdh.how.s3.title")}
    >
      <Cited locale={locale} refs={["P26 §2", "P26 §5.1", "DEV-5"]}>
        {t(locale, "network.tdh.how.s3.body")}
      </Cited>
    </StepSection>
  );
}

function Step4({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <StepSection
      locale={locale}
      step={4}
      title={t(locale, "network.tdh.how.s4.title")}
      rule={RULE_STACKS}
      ruleSource="P26 §7.1"
    >
      <Cited locale={locale} refs={["P26 §7.1"]}>
        {t(locale, "network.tdh.how.s4.body")}
      </Cited>
      <Example locale={locale}>
        <p className="tw-m-0">{t(locale, "network.tdh.how.s4.example")}</p>
        <div className={TDH_TABLE_FRAME}>
          <table className={TDH_TABLE}>
            <caption className={CAPTION}>
              {t(locale, "network.tdh.how.s4.tableCaption")}
            </caption>
            <thead>
              <tr>
                <th scope="col" className={TDH_TH}>
                  {t(locale, "network.tdh.how.s4.holder")}
                </th>
                <th scope="col" className={TDH_TH_NUM}>
                  {t(locale, "network.tdh.how.s4.copies")}
                </th>
                <th scope="col" className={TDH_TH_NUM}>
                  {t(locale, "network.tdh.how.s4.days")}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row" className={`${TDH_TD} tw-font-normal`}>
                  {t(locale, "network.tdh.how.s4.walletA")}
                </th>
                <td className={TDH_TD_NUM}>{formatInteger(locale, 2)}</td>
                <td className={TDH_TD_NUM}>
                  {formatInteger(locale, 300)} + {formatInteger(locale, 200)} ={" "}
                  {formatInteger(locale, 500)}
                </td>
              </tr>
              <tr>
                <th scope="row" className={`${TDH_TD} tw-font-normal`}>
                  {t(locale, "network.tdh.how.s4.buyer")}
                </th>
                <td className={TDH_TD_NUM}>{formatInteger(locale, 1)}</td>
                <td className={TDH_TD_NUM}>
                  {t(locale, "network.tdh.how.s4.buyerDays", {
                    days: formatInteger(locale, 50),
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <StackDiagram locale={locale} />
      </Example>
      <Cited locale={locale} refs={["P26 §3.4", "P26 §5.2"]} muted>
        {t(locale, "network.tdh.how.s4.burns")}
      </Cited>
      <StackSimulator locale={locale} />
    </StepSection>
  );
}

function Step5({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <StepSection
      locale={locale}
      step={5}
      title={t(locale, "network.tdh.how.s5.title")}
      pills={
        <>
          <TdhStatusPill pill="decided" locale={locale} />
          <TdhStatusPill pill="ruleTextPending" locale={locale} />
        </>
      }
    >
      <Cited locale={locale} refs={["D131", "D121"]}>
        {t(locale, "network.tdh.how.s5.body")}
      </Cited>
      <Example locale={locale}>
        <p className="tw-m-0">{t(locale, "network.tdh.how.s5.example")}</p>
        <div className={TDH_TABLE_FRAME}>
          <table className={TDH_TABLE}>
            <caption className={CAPTION}>
              {t(locale, "network.tdh.how.s5.tableCaption")}
            </caption>
            <thead>
              <tr>
                <th scope="col" className={TDH_TH}>
                  {t(locale, "network.tdh.how.s5.rule")}
                </th>
                <th scope="col" className={TDH_TH_NUM}>
                  {t(locale, "network.tdh.how.s5.result")}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row" className={`${TDH_TD} tw-font-normal`}>
                  {t(locale, "network.tdh.how.s5.netted")}
                </th>
                <td className={TDH_TD_NUM}>
                  {t(locale, "network.tdh.how.s5.nettedDays", {
                    days: formatInteger(locale, 300),
                  })}
                </td>
              </tr>
              <tr>
                <th scope="row" className={`${TDH_TD} tw-font-normal`}>
                  {t(locale, "network.tdh.how.s5.inOrder")}
                </th>
                <td className={TDH_TD_NUM}>
                  {t(locale, "network.tdh.how.s5.inOrderDays", {
                    days: formatInteger(locale, 20),
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TransactionBoxDiagram locale={locale} />
      </Example>
      <Cited locale={locale} refs={["D131", "Comparison 2026-10-14/15"]}>
        {t(locale, "network.tdh.how.s5.measured")}
      </Cited>
      <Cited locale={locale} refs={[]} muted>
        {t(locale, "network.tdh.how.s5.pending")}
      </Cited>
    </StepSection>
  );
}

function Step6({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <StepSection
      locale={locale}
      step={6}
      title={t(locale, "network.tdh.how.s6.title")}
      rule={RULE_EDITIONS}
      ruleSource="P26 §5.2"
    >
      <Cited locale={locale} refs={["P26 §3.4", "P26 §5.2", "P26 §10"]}>
        {t(locale, "network.tdh.how.s6.body")}
      </Cited>
      <Cited locale={locale} refs={["P26 §5.2"]}>
        {t(locale, "network.tdh.how.s6.floor")}
      </Cited>
      <div className={TDH_TABLE_FRAME}>
        <table className={TDH_TABLE}>
          <caption className={CAPTION}>
            {t(locale, "network.tdh.how.s6.tableCaption")}
          </caption>
          <thead>
            <tr>
              <th scope="col" className={TDH_TH_NUM}>
                {t(locale, "network.tdh.how.s6.minted")}
              </th>
              <th scope="col" className={TDH_TH_NUM}>
                {t(locale, "network.tdh.how.s6.claim")}
              </th>
              <th scope="col" className={TDH_TH_NUM}>
                {t(locale, "network.tdh.how.s6.edition")}
              </th>
              <th scope="col" className={TDH_TH_NUM}>
                {t(locale, "network.tdh.how.s6.rate")}
              </th>
            </tr>
          </thead>
          <tbody>
            {EDITION_EXAMPLES.map((row) => (
              <tr key={row.minted}>
                <td className={TDH_TD_NUM}>
                  {formatInteger(locale, row.minted)}
                </td>
                <td className={TDH_TD_NUM}>
                  {formatInteger(locale, row.claimLimit)}
                </td>
                <td
                  className={`${TDH_TD_NUM} tw-font-semibold tw-text-iron-50`}
                >
                  {formatInteger(locale, row.edition)}
                </td>
                <td className={TDH_TD_NUM}>{rateText(locale, row.cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Cited locale={locale} refs={["P26 §5.2"]} muted>
        {t(locale, "network.tdh.how.s6.cycle")}
      </Cited>
      <RateExplorer locale={locale} />
    </StepSection>
  );
}

function Step7({ locale }: { readonly locale: SupportedLocale }) {
  const edition = (row: (typeof RATE_EXAMPLES)[number]) => {
    if (row.id === "nextgen") {
      return t(locale, "network.tdh.how.s7.nextgenEdition", {
        count: formatInteger(locale, row.edition),
      });
    }
    if (row.id === "gradient") {
      return t(locale, "network.tdh.how.s7.gradientEdition", {
        count: formatInteger(locale, row.edition),
      });
    }
    return formatInteger(locale, row.edition);
  };
  return (
    <StepSection
      locale={locale}
      step={7}
      title={t(locale, "network.tdh.how.s7.title")}
      rule={RULE_RATE}
      ruleSource="P26 §8.1"
    >
      <Cited locale={locale} refs={["P26 §5.3", "P26 §8.1"]}>
        {t(locale, "network.tdh.how.s7.body")}
      </Cited>
      <div className={TDH_TABLE_FRAME}>
        <table className={TDH_TABLE}>
          <caption className={CAPTION}>
            {t(locale, "network.tdh.how.s7.tableCaption")}
          </caption>
          <thead>
            <tr>
              <th scope="col" className={TDH_TH}>
                {t(locale, "network.tdh.how.s7.card")}
              </th>
              <th scope="col" className={TDH_TH_NUM}>
                {t(locale, "network.tdh.how.s7.edition")}
              </th>
              <th scope="col" className={TDH_TH_NUM}>
                {t(locale, "network.tdh.how.s7.rate")}
              </th>
            </tr>
          </thead>
          <tbody>
            {RATE_EXAMPLES.map((row) => (
              <tr key={row.id}>
                <th scope="row" className={`${TDH_TD} tw-font-normal`}>
                  {t(locale, `network.tdh.how.s7.${row.id}`)}
                </th>
                <td className={TDH_TD_NUM}>{edition(row)}</td>
                <td
                  className={`${TDH_TD_NUM} tw-font-semibold tw-text-iron-50`}
                >
                  {rateText(locale, row.cents ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <RateCurveDiagram locale={locale} />
      <Cited locale={locale} refs={["P26 §8.1"]} muted>
        {t(locale, "network.tdh.how.s7.tie")}
      </Cited>
    </StepSection>
  );
}

export default function HowItWorksStepsA({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  return (
    <>
      <Step1 locale={locale} />
      <Step2 locale={locale} />
      <Step3 locale={locale} />
      <Step4 locale={locale} />
      <Step5 locale={locale} />
      <Step6 locale={locale} />
      <Step7 locale={locale} />
    </>
  );
}
