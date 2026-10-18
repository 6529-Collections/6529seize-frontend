import EqualAreaFigure, {
  type EditionArea,
} from "@/components/explained/figures/EqualAreaFigure";
import { EX_LAYOUT, EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import type { FactBook, FactId } from "@/lib/explained/facts";
import { Fact } from "@/app/explained/_lib/facts";
import { orich, ot } from "./copy";
import NetworkDistribution from "./NetworkDistribution";
import type { NetworkDistribution as Distribution } from "./networkDistribution.server";
import SectionLabel from "./SectionLabel";

/**
 * §01 The picture (TDH-DESIGN.md §4.1, §5.2): a copy's TDH is an area, and
 * every edition has the same area. Four real editions drawn to scale on one
 * baseline: a rare card, the edition floor (in blue), a large card and
 * FirstGM, the unit. When the owner switches it on, the network's TDH
 * follows as one area too.
 */
const FIRST_GM = 8;
const RARE = 4;
const LARGE = 2;

function cents(book: FactBook, id: FactId): number | null {
  const fact = book.maybe<number>(id);
  return fact === null ? null : Math.round(fact.value * 100);
}

function editions(
  book: FactBook,
  locale: SupportedLocale
): EditionArea[] | null {
  const floor = book.maybe<number>("rules.editionFloorCap");
  const rows: {
    name: string;
    copies: number | undefined;
    rate: number | null;
    you?: boolean;
  }[] = [
    {
      name: ot(locale, "picture.card", { id: RARE }),
      copies: book.maybe<number>(`meme.${RARE}.edition`)?.value,
      rate: cents(book, `meme.${RARE}.rate`),
    },
    {
      name: ot(locale, "picture.floorCard", { copies: floor?.value ?? 0 }),
      copies: floor?.value,
      rate: cents(book, "engine.rate.310"),
      you: true,
    },
    {
      name: ot(locale, "picture.card", { id: LARGE }),
      copies: book.maybe<number>(`meme.${LARGE}.edition`)?.value,
      rate: cents(book, `meme.${LARGE}.rate`),
    },
    {
      name: ot(locale, "picture.firstGm"),
      copies: book.maybe<number>(`meme.${FIRST_GM}.edition`)?.value,
      rate: cents(book, "engine.rate.firstGM"),
    },
  ];
  const out: EditionArea[] = [];
  for (const row of rows) {
    if (row.copies === undefined || row.rate === null) return null;
    out.push({
      name: row.name,
      copies: row.copies,
      rateCents: row.rate,
      ...(row.you ? { you: true } : {}),
    });
  }
  return out;
}

export default function ThePicture({
  book,
  locale,
  distribution,
}: {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
  /**
   * The network's TDH by rank when the owner's flag is on: the data, or
   * "unavailable" when the API did not answer; null while the flag is off.
   */
  readonly distribution: Distribution | "unavailable" | null;
}) {
  const items = editions(book, locale);
  const bold = (text: string) => (
    <b className="tw-font-semibold tw-text-iron-50">{text}</b>
  );
  return (
    <section id="tdh-example" className={EX_LAYOUT.section}>
      <div className={EX_LAYOUT.stmt}>
        <div>
          <SectionLabel no="01" label={ot(locale, "picture.label")} />
          <h2 className={EX_TEXT.stmt}>{ot(locale, "picture.title")}</h2>
        </div>
        <div className="lg:tw-pt-1.5">
          <p className={`${EX_TEXT.body} tw-m-0`}>
            {orich(locale, "picture.body", {
              days: bold(ot(locale, "picture.termDays")),
              rate: bold(ot(locale, "picture.termRate")),
              boost: bold(ot(locale, "picture.termBoost")),
              h: <Fact book={book} id="engine.H" locale={locale} />,
            })}
          </p>
        </div>
      </div>
      <figure className="tw-m-0 tw-mt-10 md:tw-mt-12" id="tdh-reference">
        {items ? (
          <EqualAreaFigure items={items} locale={locale} />
        ) : (
          <Fact book={book} id="memes.editions" locale={locale} />
        )}
        <figcaption className={`${EX_TEXT.cap} tw-mt-5 tw-max-w-[760px]`}>
          {bold(ot(locale, "picture.captionLead"))}{" "}
          {orich(locale, "picture.caption", {
            h: <Fact book={book} id="engine.H" locale={locale} />,
            read: <Fact book={book} id="memes.readAt" locale={locale} />,
          })}
        </figcaption>
      </figure>
      {distribution === "unavailable" && (
        <p className={`${EX_TEXT.cap} tw-mt-16`} data-fig="network">
          {ot(locale, "network.unavailable")}
        </p>
      )}
      {distribution !== null && distribution !== "unavailable" && (
        <NetworkDistribution data={distribution} locale={locale} />
      )}
    </section>
  );
}
