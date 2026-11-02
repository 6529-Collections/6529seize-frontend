import HowWeKnow from "@/components/explained/shell/HowWeKnow";
import type { SupportedLocale } from "@/i18n/locales";
import { hw, hwRich } from "./_lib/copy";
import { Hw } from "./_lib/facts";

/**
 * How we know (EXPLAINED.md §6.2): the records and pages this page restates,
 * each with its day. The validator's own repository is private until the
 * owner publishes its code (D116), so its documents are named, not linked;
 * every public price page is linked from the table that uses it.
 */
export default function Sources({
  locale,
  title,
}: {
  readonly locale: SupportedLocale;
  readonly title: string;
}) {
  const day = <Hw id="read.day" locale={locale} />;
  return (
    <HowWeKnow
      locale={locale}
      title={title}
      slug="validator-hardware"
      rows={[
        {
          title: hw(locale, "hwk.tiers.title"),
          body: hwRich(locale, "hwk.tiers.body", { date: day }),
        },
        {
          title: hw(locale, "hwk.holders.title"),
          body: hw(locale, "hwk.holders.body"),
        },
        {
          title: hw(locale, "hwk.parts.title"),
          body: hwRich(locale, "hwk.parts.body", { date: day }),
        },
        {
          title: hw(locale, "hwk.use.title"),
          body: hwRich(locale, "hwk.use.body", {
            date: day,
            blocks: <Hw id="use.blocks" locale={locale} />,
          }),
        },
        {
          title: hw(locale, "hwk.cloud.title"),
          body: hwRich(locale, "hwk.cloud.body", {
            date: day,
            hours: <Hw id="month.hours" locale={locale} />,
            rate: <Hw id="eur.rate" locale={locale} />,
          }),
        },
        {
          title: hw(locale, "hwk.home.title"),
          body: hwRich(locale, "hwk.home.body", {
            date: day,
            months: <Hw id="home.months" locale={locale} />,
            kwh: <Hw id="power.kwh" locale={locale} />,
          }),
        },
        {
          title: hw(locale, "hwk.node.title"),
          body: hw(locale, "hwk.node.body"),
        },
        {
          title: hw(locale, "hwk.open.title"),
          body: hw(locale, "hwk.open.body"),
        },
      ]}
    />
  );
}
