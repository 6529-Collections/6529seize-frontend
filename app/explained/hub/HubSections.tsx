import HowWeKnow from "@/components/explained/shell/HowWeKnow";
import { EX_LAYOUT, EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import type { FactBook } from "@/lib/explained/facts";
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
export function HubOpener({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <header className="tw-pt-[30px] md:tw-pt-[52px]">
      <span className={`${EX_TEXT.label} tw-mb-4 tw-block`}>
        {ht(locale, "eyebrow")}
      </span>
      <div className="lg:tw-grid lg:tw-grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:tw-items-end lg:tw-gap-14">
        <h1
          className={`${EX_TEXT.displayHub} tw-text-balance max-[359px]:tw-text-[30px] max-[359px]:tw-leading-[34px] lg:tw-text-[72px] lg:tw-leading-[76px]`}
        >
          {ht(locale, "title")}
        </h1>
        <p className={HUB_LEDE} data-ex-lede="" data-ex-mission="">
          {ht(locale, "mission")}
        </p>
      </div>
    </header>
  );
}

/** The corrections log every page's How we know links to (`/explained#corrections`). */
export function Corrections({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <section
      id="corrections"
      className={EX_LAYOUT.sectionTight}
      aria-labelledby="corrections-title"
    >
      <div className={EX_LAYOUT.ed}>
        <div className="lg:tw-pt-1">
          <span className={EX_TEXT.label} id="corrections-title">
            {ht(locale, "corrections.label")}
          </span>
        </div>
        <div className={EX_LAYOUT.edWide}>
          <p className="tw-m-0 tw-max-w-[660px] tw-text-[15px] tw-leading-6 tw-text-iron-300">
            {ht(locale, "corrections.body")}
          </p>
        </div>
      </div>
    </section>
  );
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
            through: fact("site.mainStage.through"),
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
