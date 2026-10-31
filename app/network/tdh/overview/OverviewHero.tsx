import Link from "next/link";
import LiveStrip from "@/components/explained/evidence/LiveStrip";
import type { ResultDay } from "@/components/explained/evidence/DayRibbon";
import { LoopLocator } from "@/components/explained/figures/LoopFigure";
import { kt } from "@/components/explained/i18n";
import { Icon } from "@/components/explained/marks/glyphs";
import Mark from "@/components/explained/marks/Mark";
import Track from "@/components/explained/marks/Track";
import { chapterById } from "@/components/explained/shell/chapters";
import { EX_BUTTON, EX_LINK, EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import type { FactBook } from "@/lib/explained/facts";
import { Fact } from "@/app/explained/_lib/facts";
import Machine, { type MachineCard } from "./Machine";
import { orich, ot } from "./copy";

/**
 * The overview's first screen (TDH-DESIGN.md §4.1, §0): the eyebrow with
 * the loop locator, the display title, then the hero. Left: the lede, two
 * marks, the two actions and today on the network. Right: the machine,
 * one real card as an area.
 */
function equalEverywhere(book: FactBook): boolean {
  const equal = book.maybe<number>("tdh.latest.agree.live.identities.equal");
  const total = book.maybe<number>("tdh.latest.agree.live.identities.total");
  const python = book.maybe<number>("tdh.latest.agree.python.identities.equal");
  return (
    equal !== null &&
    total !== null &&
    python !== null &&
    equal.value === total.value &&
    python.value === total.value
  );
}

/** The mini ribbon shows the last five results, then the open day (TDH-DESIGN.md §4.1). */
const MINI_RIBBON_RESULTS = 5;

function TodayOnTheNetwork({
  book,
  locale,
}: {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
}) {
  const days = (book.maybe<ResultDay[]>("tdh.days")?.value ?? []).slice(
    -MINI_RIBBON_RESULTS
  );
  const open = book.maybe<string>("tdh.open.date")?.value;
  const equation = (
    <b className="tw-font-semibold tw-text-iron-50">
      {ot(locale, "live.equation")}
    </b>
  );
  const identities = (
    <Fact book={book} id="tdh.latest.identities" locale={locale} />
  );
  return (
    <LiveStrip
      locale={locale}
      days={days}
      {...(open === undefined ? {} : { openDate: open })}
      headline={orich(locale, "live.total", {
        total: (
          // At 400% zoom the total shrinks so it stays inside the strip.
          <span className="max-[359px]:tw-text-xl">
            <Fact book={book} id="tdh.latest.total" locale={locale} />
          </span>
        ),
      })}
    >
      {equalEverywhere(book)
        ? orich(locale, "live.line", { identities, equation })
        : orich(locale, "live.lineDiffers", {
            identities,
            equation,
            equal: (
              <Fact
                book={book}
                id="tdh.latest.agree.live.identities.equal"
                locale={locale}
              />
            ),
          })}{" "}
      <Link className={EX_LINK} href="/network/tdh/verification">
        {ot(locale, "live.link")}
      </Link>
    </LiveStrip>
  );
}

export default function OverviewHero({
  book,
  locale,
  cards,
}: {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
  readonly cards: readonly MachineCard[];
}) {
  const chapter = chapterById("tdh");
  const dailyRef = orich(locale, "mark.dailyRef", {
    equal: <Fact book={book} id="tdh.days.equal" locale={locale} />,
    compared: <Fact book={book} id="tdh.days.compared" locale={locale} />,
  });
  return (
    <>
      <header className="tw-pt-[30px] md:tw-pt-[52px]">
        <div className="tw-mb-4 tw-flex tw-items-center tw-gap-3">
          <LoopLocator label={kt(locale, "explained.kit.loop.locator")} />
          <span className={EX_TEXT.label}>
            {orich(locale, "eyebrow", {
              number: <span>{chapter.number ?? ""}</span>,
            })}
          </span>
        </div>
        <h1
          className={`${EX_TEXT.display} max-[359px]:tw-text-[30px] max-[359px]:tw-leading-[34px]`}
        >
          {ot(locale, "title")}
        </h1>
      </header>
      <section
        id="tdh-minute"
        className="tw-grid tw-grid-cols-1 tw-items-start tw-gap-[30px] tw-pt-[18px] md:tw-pt-[30px] xl:tw-grid-cols-[minmax(0,1fr)_548px] xl:tw-gap-14"
      >
        <div className="tw-min-w-0">
          <p className={EX_TEXT.lede} data-ex-lede="">
            {ot(locale, "lede")}
          </p>
          <div className="tw-mt-6 tw-flex tw-flex-col tw-items-start tw-gap-y-1.5">
            <Track
              maturity="live"
              locale={locale}
              label={ot(locale, "mark.live")}
              refText={ot(locale, "mark.liveRef")}
            />
            <span className="tw-inline-flex tw-flex-wrap tw-items-center tw-gap-x-1.5">
              <Mark
                kind="tested"
                locale={locale}
                label={ot(locale, "mark.daily")}
              />
              <span className="tw-text-sm tw-font-medium tw-leading-5 tw-text-iron-400">
                {dailyRef}
              </span>
            </span>
          </div>
          <div className="tw-mt-6 tw-flex tw-flex-wrap tw-gap-2.5 md:tw-mt-[30px]">
            <a className={EX_BUTTON.cta} href="#explain">
              {ot(locale, "cta.explain")}
            </a>
            <Link
              className={EX_BUTTON.secondary}
              href={chapter.read[1]?.href ?? "/network/tdh/how-it-works"}
            >
              {ot(locale, "cta.how")}
              <Icon kind="arrow" className="tw-size-4" />
            </Link>
          </div>
          <div className="tw-mt-7 md:tw-mt-10">
            <TodayOnTheNetwork book={book} locale={locale} />
          </div>
        </div>
        <Machine cards={cards} locale={locale} />
      </section>
    </>
  );
}
