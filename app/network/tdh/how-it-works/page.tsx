import type { Metadata } from "next";
import Link from "next/link";
import conformance from "@/components/explained/engine/conformance.json";
import FactValue from "@/components/explained/facts/FactValue";
import { kt } from "@/components/explained/i18n";
import { chapterById, HUB_HREF } from "@/components/explained/shell/chapters";
import ExplainedShell from "@/components/explained/shell/ExplainedShell";
import HowWeKnow from "@/components/explained/shell/HowWeKnow";
import PrevNext from "@/components/explained/shell/PrevNext";
import { EX_LINK } from "@/components/explained/tokens";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { loadFactBook } from "@/lib/explained/feed.server";
import type { Fact, FactBook, FactEntry } from "@/lib/explained/facts";
import { ENGINE } from "@/lib/explained/engine";
import { formatCents, formatCount, formatUtcDay } from "@/lib/explained/format";
import BoostLens from "./BoostLens";
import { ht } from "./copy";
import FirstDayLens from "./FirstDayLens";
import HowParts from "./HowParts";
import IdentityModel from "./IdentityModel";
import NettingLens from "./NettingLens";
import NetworkSection from "./NetworkSection";
import { EXAMPLE_CARD, FIRST_GM } from "./models/rates";
import RatesLens from "./RatesLens";
import FactDerived, { RecordValue } from "./_kit/FactDerived";
import {
  EdRow,
  GoLink,
  PageHead,
  pageLink,
  Para,
  Section,
  Statement,
  StatementLabel,
  You,
} from "./_kit/layout";
import { pageLocale, type LocaleSearchParams } from "./_kit/pageLocale";
import { rich } from "./_kit/rich";
import { formatDecimal } from "./_kit/numbers";
import { utcClock, utcDay } from "./_kit/time";

const ROUTE = "/network/tdh/how-it-works";
/** The base TDH example: two copies of a 310-copy card held thirty days. */
const BASE_EXAMPLE = { copies: 2, days: 30 } as const;

/**
 * 1 How it works (TDH-DESIGN.md §4.2): four ideas, each with a model that
 * runs the TDH v1.4 engine in the browser, then the network. Every number
 * is a fact or the engine's; every anchor of the old fourteen steps lands
 * inside its part (MAP.md §2).
 */
export default async function TdhHowItWorksPage({
  searchParams,
}: {
  readonly searchParams: LocaleSearchParams;
}) {
  const locale = await pageLocale(searchParams);
  const book = await loadFactBook();
  const editions = book.maybe<number[][]>("memes.editions");
  const newest =
    editions && editions.value.length > 0
      ? Math.max(...editions.value.map((row) => row[0] ?? 0))
      : null;
  // The family facts the models read on the client.
  book.maybe(`meme.${EXAMPLE_CARD}.minted`);
  book.maybe(`meme.${FIRST_GM}.minted`);
  if (newest !== null) {
    book.maybe(`meme.${newest}.minted`);
    book.maybe(`meme.${newest}.edition`);
  }
  const firstMint =
    newest === null ? null : book.maybe<string>(`meme.${newest}.firstMint`);

  const chapter = chapterById("tdh");
  const page = chapter.read.find((entry) => entry.id === "how");
  const v = (fact: FactEntry | null) => (
    <FactValue fact={fact} locale={locale} />
  );
  const f = (id: Parameters<FactBook["maybe"]>[0]) => v(book.maybe(id));

  return (
    <ExplainedShell
      chapter="tdh"
      page="how"
      crumbs={[
        { label: kt(locale, "explained.kit.map.hub"), href: HUB_HREF },
        {
          label: kt(locale, "explained.kit.map.chapterTitle", {
            number: chapter.number ?? "",
            title: kt(locale, "explained.kit.map.tdh"),
          }),
          href: "/network/tdh",
        },
        { label: kt(locale, "explained.kit.map.tdh.how") },
      ]}
      live={{ fact: book.maybe("feed.writtenAt"), kind: "feed" }}
      facts={book.snapshot()}
      locale={locale}
    >
      <article data-ex-article="" lang={locale}>
        <div id="tdh-exact">
          <PageHead
            eyebrow={
              <>
                {ht(locale, "explained.tdh.how.eyebrow.chapter")}{" "}
                <span>{chapter.number}</span>
                {" · "}
                <You>{page?.n}</You> {kt(locale, "explained.kit.map.tdh.how")}
              </>
            }
            title={ht(locale, "explained.tdh.how.title")}
            lede={ht(locale, "explained.tdh.how.lede")}
          />
          <HowParts locale={locale} />
        </div>

        <PartA
          book={book}
          locale={locale}
          newest={newest}
          firstMint={firstMint}
        />
        <PartB book={book} locale={locale} newest={newest} />

        <Section id="part-c">
          <span id="step-9" />
          <span id="tdh-1-4" />
          <Statement
            label={
              <StatementLabel mark="C">
                {ht(locale, "explained.tdh.how.parts.c.title")}
              </StatementLabel>
            }
            title={ht(locale, "explained.tdh.how.c.title")}
          >
            <Para>
              {rich(locale, "explained.tdh.how.c.body", {
                season: f("rules.seasonBonus"),
                single: f("rules.genesisBonus"),
                gradient: f("rules.gradientBonus"),
                max: f("rules.gradientMax"),
                todayMax: f("engine.boost.todayMax"),
                ceiling: f("engine.boost.ceiling"),
                last: f("rules.lastBoostedSeason"),
              })}
            </Para>
          </Statement>
          <div className="tw-mt-12">
            <BoostLens locale={locale} />
          </div>
        </Section>

        <Section id="part-d">
          <span id="step-10" />
          <span id="step-11" />
          <span id="step-12" />
          <Statement
            label={
              <StatementLabel mark="D">
                {ht(locale, "explained.tdh.how.parts.d.title")}
              </StatementLabel>
            }
            title={ht(locale, "explained.tdh.how.d.title")}
          >
            <Para>{ht(locale, "explained.tdh.how.d.body")}</Para>
            <p className="tw-m-0">
              <GoLink href="/network/tdh/consolidation">
                {ht(locale, "explained.tdh.how.d.link")}
              </GoLink>
            </p>
          </Statement>
          <figure className="tw-m-0 tw-mt-12">
            <IdentityModel locale={locale} />
          </figure>
        </Section>

        <NetworkSection book={book} locale={locale} />

        <PrevNext
          locale={locale}
          prev={pageLink(
            "/network/tdh",
            kt(locale, "explained.kit.map.tdh.overview")
          )}
          next={pageLink(
            "/network/tdh/consolidation",
            kt(locale, "explained.kit.map.tdh.wallets"),
            chapter.read.find((entry) => entry.id === "wallets")?.n
          )}
        />
      </article>
      <HowWeKnow
        locale={locale}
        title={ht(locale, "explained.tdh.how.title")}
        slug="tdh-how-it-works"
        rows={howWeKnow(book, locale)}
      />
    </ExplainedShell>
  );
}

function PartA({
  book,
  locale,
  newest,
  firstMint,
}: {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
  readonly newest: number | null;
  readonly firstMint: Fact<string> | null;
}) {
  const day = book.maybe<number>("rules.daySeconds");
  const mint =
    firstMint === null ? null : Math.floor(Date.parse(firstMint.value) / 1000);
  // The first result that counts a card: the first boundary a whole day after its first mint.
  const from =
    mint !== null && day !== null
      ? Math.ceil((mint + day.value) / day.value) * day.value
      : null;
  return (
    <Section id="part-a">
      <span id="step-1" />
      <span id="step-2" />
      <Statement
        label={
          <StatementLabel mark="A">
            {ht(locale, "explained.tdh.how.parts.a.title")}
          </StatementLabel>
        }
        title={ht(locale, "explained.tdh.how.a.title")}
      >
        <Para>
          {day === null
            ? null
            : rich(locale, "explained.tdh.how.a.body", {
                midnight: (
                  <FactDerived fact={day} locale={locale}>
                    {`${utcClock(locale, 0)} UTC`}
                  </FactDerived>
                ),
                hours: (
                  <FactDerived fact={day} locale={locale}>
                    {formatCount(locale, day.value / 3_600)}
                  </FactDerived>
                ),
              })}
        </Para>
      </Statement>
      <div className="tw-mt-12">
        <FirstDayLens locale={locale} />
      </div>
      <EdRow
        no="3"
        label={ht(locale, "explained.tdh.how.cards.label")}
        className="tw-mt-16"
      >
        <Para>
          <span id="step-3" />
          {ht(locale, "explained.tdh.how.cards.lead")}{" "}
          {firstMint !== null &&
            mint !== null &&
            from !== null &&
            newest !== null && (
              <>
                {rich(locale, "explained.tdh.how.cards.example", {
                  card: `Meme #${newest}`,
                  date: (
                    <FactDerived fact={firstMint} locale={locale}>
                      {utcDay(locale, mint)}
                    </FactDerived>
                  ),
                  time: (
                    <FactDerived fact={firstMint} locale={locale}>
                      {`${utcClock(locale, mint)} UTC`}
                    </FactDerived>
                  ),
                  from: (
                    <FactDerived fact={firstMint} locale={locale}>
                      {utcDay(locale, from)}
                    </FactDerived>
                  ),
                })}{" "}
              </>
            )}
          {ht(locale, "explained.tdh.how.cards.tail")}
        </Para>
      </EdRow>
      <EdRow
        no="4"
        label={ht(locale, "explained.tdh.how.moves.label")}
        className="tw-mt-8"
      >
        <Para>
          <span id="step-4" />
          {rich(locale, "explained.tdh.how.moves.body", {
            link: (
              <Link className={EX_LINK} href="/network/tdh/consolidation">
                {ht(locale, "explained.tdh.how.moves.link")}
              </Link>
            ),
          })}
        </Para>
      </EdRow>
      <div id="step-5" className="tw-mt-16 tw-scroll-mt-24">
        <NettingLens locale={locale} />
      </div>
    </Section>
  );
}

function PartB({
  book,
  locale,
  newest,
}: {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
  readonly newest: number | null;
}) {
  const v = (id: Parameters<FactBook["maybe"]>[0]) => (
    <FactValue fact={book.maybe(id)} locale={locale} />
  );
  const rate = book.maybe<number>("engine.rate.310");
  const { copies, days } = BASE_EXAMPLE;
  const cents = rate === null ? null : Math.round(rate.value * 100);
  return (
    <Section id="part-b">
      <span id="step-6" />
      <span id="step-7" />
      <Statement
        label={
          <StatementLabel mark="B">
            {ht(locale, "explained.tdh.how.parts.b.title")}
          </StatementLabel>
        }
        title={ht(locale, "explained.tdh.how.b.title")}
      >
        <Para>
          {rich(locale, "explained.tdh.how.b.body", {
            H: v("engine.H"),
            rateFirstGM: v("engine.rate.firstGM"),
            cap: v("rules.editionFloorCap"),
            rate310: v("engine.rate.310"),
            threshold: v("rules.editionThreshold"),
          })}
        </Para>
      </Statement>
      <div className="tw-mt-12">
        {newest === null ? (
          <p className="tw-m-0 tw-rounded-xl tw-border tw-border-dashed tw-border-iron-700 tw-p-5 tw-text-[15px] tw-leading-6 tw-text-iron-400">
            {ht(locale, "explained.tdh.how.model.unavailable")}
          </p>
        ) : (
          <RatesLens locale={locale} newest={newest} />
        )}
      </div>
      <EdRow
        no="8"
        label={ht(locale, "explained.tdh.how.base.label")}
        className="tw-mt-16"
      >
        <Para>
          <span id="step-8" />
          {rate !== null && cents !== null
            ? rich(locale, "explained.tdh.how.base.body", {
                cap: v("rules.editionFloorCap"),
                days: (
                  <span data-ex-allow-number="example">
                    {formatCount(locale, days)}
                  </span>
                ),
                sum: (
                  <FactDerived
                    fact={rate}
                    locale={locale}
                    how={ht(locale, "explained.tdh.how.firstday.tag")}
                    className="tw-whitespace-nowrap"
                  >
                    {`${formatCount(locale, copies)} × ${formatCount(locale, days)} × ${formatCents(locale, cents / 100)} = ${formatDecimal(locale, (copies * days * cents) / 100, 1)}`}
                  </FactDerived>
                ),
                rounded: (
                  <FactDerived fact={rate} locale={locale}>
                    {formatCount(locale, ENGINE.baseTdh(cents, copies * days))}
                  </FactDerived>
                ),
              })
            : null}
        </Para>
      </EdRow>
    </Section>
  );
}

function howWeKnow(book: FactBook, locale: SupportedLocale) {
  const v = (id: Parameters<FactBook["maybe"]>[0], style?: "long") => (
    <FactValue
      fact={book.maybe(id)}
      locale={locale}
      {...(style ? { style } : {})}
    />
  );
  const readAt = book.maybe<string>("memes.readAt");
  const source = `components/explained/engine/conformance.json, P26 at ${conformance.specification.commit.slice(0, 7)}`;
  return [
    {
      title: ht(locale, "explained.tdh.how.hwk.rules"),
      body: rich(locale, "explained.tdh.how.hwk.rulesBody", {
        head: <>6529chain {v("rules.chainHead")}</>,
      }),
    },
    {
      title: ht(locale, "explained.tdh.how.hwk.models"),
      body: rich(locale, "explained.tdh.how.hwk.modelsBody", {
        pass: (
          <RecordValue
            id="engine.conformance.pass"
            source={source}
            locale={locale}
          >
            {formatCount(locale, conformance.summary.pass)}
          </RecordValue>
        ),
        vectors: v("rules.vectors"),
      }),
    },
    {
      title: ht(locale, "explained.tdh.how.hwk.editions"),
      body: rich(locale, "explained.tdh.how.hwk.editionsBody", {
        time: v("memes.readAt"),
        date:
          readAt === null ? (
            v("memes.readAt")
          ) : (
            <FactDerived fact={readAt} locale={locale}>
              {formatUtcDay(locale, readAt.value)}
            </FactDerived>
          ),
      }),
    },
    {
      title: ht(locale, "explained.tdh.how.hwk.netting"),
      body: ht(locale, "explained.tdh.how.hwk.nettingBody"),
    },
    {
      title: ht(locale, "explained.tdh.how.hwk.decisions"),
      body: rich(locale, "explained.tdh.how.hwk.decisionsBody", {
        threshold: v("rules.editionThreshold"),
      }),
    },
    {
      title: ht(locale, "explained.tdh.how.hwk.totals"),
      body: rich(locale, "explained.tdh.how.hwk.totalsBody", {
        written: v("feed.writtenAt", "long"),
      }),
    },
  ];
}

export function generateMetadata(): Metadata {
  return getAppMetadata(
    {
      title: ht(DEFAULT_LOCALE, "explained.tdh.how.meta.title"),
      description: ht(DEFAULT_LOCALE, "explained.tdh.how.meta.description"),
    },
    { canonicalPath: ROUTE }
  );
}
