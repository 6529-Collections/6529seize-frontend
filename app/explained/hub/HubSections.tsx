import HowWeKnow from "@/components/explained/shell/HowWeKnow";
import { EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import type { FactBook } from "@/lib/explained/facts";
import { mainStageDays } from "./schedule";
import { Fact } from "../_lib/facts";
import { hrich, ht } from "./copy";

/**
 * The hub's opener, its corrections log and its sources (MAP.md §3).
 * The opener's second line is the mission key: the owner's sentence
 * replaces the descriptive line by changing `explained.hub.mission`.
 */
const HUB_LEDE =
  "tw-m-0 tw-mt-4 tw-max-w-[660px] tw-text-[18px] tw-font-normal tw-leading-[28px] tw-text-iron-300 md:tw-mt-[22px] md:tw-text-[22px] md:tw-leading-[34px] lg:tw-mt-0 lg:tw-pb-1.5 lg:tw-text-[20px] lg:tw-leading-[31px]";

/**
 * On a wide screen the title and the descriptive line sit side by side, so
 * the loop below starts high enough for all six stations and Ethereum to
 * show on the first screen at 1440 × 900 (MAP.md §3), and the line keeps a
 * reading measure.
 */
export function HubOpener({
  book,
  locale,
}: {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
}) {
  return (
    <header className="tw-pt-[30px] md:tw-pt-[52px]">
      <span className={`${EX_TEXT.label} tw-mb-4 tw-block`}>
        {ht(locale, "eyebrow")}
      </span>
      <div className="lg:tw-grid lg:tw-grid-cols-[minmax(0,1fr)_400px] lg:tw-items-end lg:tw-gap-14">
        <h1
          className={`${EX_TEXT.displayHub} tw-text-balance max-[359px]:tw-text-[30px] max-[359px]:tw-leading-[34px] lg:tw-text-[72px] lg:tw-leading-[76px]`}
        >
          {ht(locale, "title")}
        </h1>
        <p className={HUB_LEDE} data-ex-lede="" data-ex-mission="">
          {hrich(locale, "mission", {
            perWeek: (
              <Fact book={book} id="site.mainStage.perWeek" locale={locale} />
            ),
          })}
        </p>
      </div>
    </header>
  );
}

/** Main Stage's hour as a clock, "16:00", from the schedule fact. */
function mainStageTime(book: FactBook): string {
  const hour = book.maybe<number>("site.mainStage.hourUtc")?.value;
  return hour === undefined ? "–" : `${String(hour).padStart(2, "0")}:00`;
}

export function HubSources({
  book,
  locale,
}: {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
}) {
  const fact = (id: Parameters<typeof Fact>[0]["id"], style?: "long") => (
    <Fact book={book} id={id} locale={locale} {...(style ? { style } : {})} />
  );
  return (
    <HowWeKnow
      locale={locale}
      title={ht(locale, "title")}
      log={
        <>
          <b className="tw-font-semibold tw-text-iron-50">
            {ht(locale, "corrections.label")}
          </b>
          {" · "}
          {ht(locale, "corrections.body")}
        </>
      }
      slug="explained-hub"
      rows={[
        {
          title: ht(locale, "hwk.feed"),
          body: hrich(locale, "hwk.feedBody", {
            written: fact("feed.writtenAt", "long"),
            read: fact("feed.readAt"),
          }),
        },
        {
          title: ht(locale, "hwk.site"),
          body: hrich(locale, "hwk.siteBody", {
            cards: fact("memes.count"),
            editionsRead: fact("memes.readAt"),
            days: mainStageDays(book, locale) ?? "",
            time: mainStageTime(book),
          }),
        },
        {
          title: ht(locale, "hwk.record"),
          body: hrich(locale, "hwk.recordBody", {
            newest: fact("rules.newestDecision"),
            date: fact("rules.chainHeadDate"),
          }),
        },
        {
          title: ht(locale, "hwk.manifest"),
          body: hrich(locale, "hwk.manifestBody", {
            written: fact("manifest.writtenAt"),
          }),
        },
      ]}
    />
  );
}
