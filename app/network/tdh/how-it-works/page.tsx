import type { Metadata } from "next";
import conformance from "@/components/explained/engine/conformance.json";
import FactValue from "@/components/explained/facts/FactValue";
import { kt } from "@/components/explained/i18n";
import { chapterById, HUB_HREF } from "@/components/explained/shell/chapters";
import ExplainedShell from "@/components/explained/shell/ExplainedShell";
import HowWeKnow from "@/components/explained/shell/HowWeKnow";
import PrevNext from "@/components/explained/shell/PrevNext";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { loadFactBook } from "@/lib/explained/feed.server";
import type { FactBook, FactEntry } from "@/lib/explained/facts";
import { ENGINE } from "@/lib/explained/engine";
import { formatCents, formatCount, formatUtcDay } from "@/lib/explained/format";
import {
  resolveExplainedLocale,
  type ExplainedParams,
} from "@/lib/explained/locale.server";
import BoostLens from "./BoostLens";
import { ht } from "./copy";
import EligibilityLens from "./EligibilityLens";
import FirstDayLens from "./FirstDayLens";
import HowParts, { HowFormula } from "./HowParts";
import IdentityModel from "./IdentityModel";
import NettingLens from "./NettingLens";
import NetworkSection from "./NetworkSection";
import { EXAMPLE_CARD, FIRST_GM } from "./models/rates";
import RatesLens from "./RatesLens";
import StacksLens from "./StacksLens";
import StepsInOrder, { traceOf } from "./StepsInOrder";
import { RecordValue } from "@/components/explained/layout/RecordValue";
import { FactText } from "@/components/explained/facts/FactText";
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
} from "@/components/explained/layout/rows";
import { rich } from "@/components/explained/rich";
import { formatDecimal } from "@/components/explained/layout/numbers";
import { utcClock } from "@/components/explained/layout/time";

const ROUTE = "/network/tdh/how-it-works";
/** The base TDH example: two copies of a 310-copy card held thirty days. */
const BASE_EXAMPLE = { copies: 2, days: 30 } as const;
/** How many of the newest cards the eligibility model offers. */
const RECENT_CARDS = 3;

/**
 * 1 How it works (TDH-DESIGN.md §4.2): four ideas, each with a model that
 * runs the TDH v1.4 engine in the browser, then the network. Every number
 * is a fact or the engine's; every anchor of the old fourteen steps lands
 * inside its part (MAP.md §2).
 */
export default async function TdhHowItWorksPage({
  searchParams,
}: {
  readonly searchParams: Promise<ExplainedParams>;
}) {
  const locale = await resolveExplainedLocale(await searchParams);
  const book = await loadFactBook();
  const editions = book.maybe<number[][]>("memes.editions");
  const ids = editions ? editions.value.map((row) => row[0] ?? 0) : [];
  const newest = ids.length > 0 ? Math.max(...ids) : null;
  const threshold = book.maybe<number>("rules.editionThreshold");
  // The newest card still below the threshold, if any: the floor's Break it.
  const below =
    editions && threshold
      ? editions.value
          .filter((row) => (row[2] ?? 0) < threshold.value)
          .map((row) => row[0] ?? 0)
      : [];
  const floorCard = below.length > 0 ? Math.max(...below) : null;
  if (floorCard !== null) {
    book.maybe(`meme.${floorCard}.minted`);
    book.maybe(`meme.${floorCard}.edition`);
  }
  // The newest cards whose first mints the eligibility model places.
  const recent = [...ids].sort((a, b) => a - b).slice(-RECENT_CARDS);
  // The family facts the models read on the client.
  book.maybe(`meme.${EXAMPLE_CARD}.minted`);
  book.maybe(`meme.${FIRST_GM}.minted`);
  const recentCards = recent.filter(
    (id) => book.maybe<string>(`meme.${id}.firstMint`) !== null
  );

  // One copy through every step, on today's H (the steps table's trace).
  const hFact = book.maybe<number>("engine.H");
  const capFact = book.maybe<number>("rules.editionFloorCap");
  const countFact = book.maybe<number>("memes.count");
  const trace =
    hFact && capFact && countFact
      ? traceOf(hFact.value, capFact.value, countFact.value)
      : null;

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
          <HowFormula locale={locale} />
          <HowParts locale={locale} />
          <p className="tw-m-0 tw-mt-5">
            <GoLink href="#steps">
              {ht(locale, "explained.tdh.how.order.jump")}
            </GoLink>
          </p>
        </div>

        <PartA book={book} locale={locale} recentCards={recentCards} />
        <PartB
          book={book}
          locale={locale}
          ready={newest !== null}
          floorCard={floorCard}
        />

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
          <div className="tw-mt-12">
            <IdentityModel locale={locale} />
          </div>
        </Section>

        <NetworkSection book={book} locale={locale} />

        <StepsInOrder locale={locale} trace={trace} />

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
  recentCards,
}: {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
  readonly recentCards: readonly number[];
}) {
  const day = book.maybe<number>("rules.daySeconds");
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
                  <FactText fact={day} locale={locale}>
                    {`${utcClock(locale, 0)} UTC`}
                  </FactText>
                ),
                hours: (
                  <FactText fact={day} locale={locale}>
                    {formatCount(locale, day.value / 3_600)}
                  </FactText>
                ),
              })}
        </Para>
      </Statement>
      <div className="tw-mt-12">
        <FirstDayLens locale={locale} />
      </div>
      <div id="step-3" className="tw-mt-16 tw-scroll-mt-24">
        <EligibilityLens locale={locale} cards={recentCards} />
      </div>
      <div id="step-4" className="tw-mt-16 tw-scroll-mt-24">
        <StacksLens locale={locale} />
      </div>
      <div id="step-5" className="tw-mt-16 tw-scroll-mt-24">
        <NettingLens locale={locale} />
      </div>
    </Section>
  );
}

function PartB({
  book,
  locale,
  ready,
  floorCard,
}: {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
  /** Whether the Meme editions could be read. */
  readonly ready: boolean;
  /** The newest card still below the threshold, or null. */
  readonly floorCard: number | null;
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
        <Para>
          {rich(locale, "explained.tdh.how.b.others", {
            H: v("engine.H"),
            rateGradient: v("engine.rate.gradient"),
          })}
        </Para>
      </Statement>
      <div className="tw-mt-12">
        {ready ? null : (
          <p className="tw-m-0 tw-rounded-xl tw-border tw-border-dashed tw-border-iron-700 tw-p-5 tw-text-[15px] tw-leading-6 tw-text-iron-400">
            {ht(locale, "explained.tdh.how.model.unavailable")}
          </p>
        )}
        {ready && <RatesLens locale={locale} floorCard={floorCard} />}
      </div>
      <EdRow
        no="B"
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
                  <FactText
                    fact={rate}
                    locale={locale}
                    how={ht(locale, "explained.tdh.how.firstday.tag")}
                    className="tw-whitespace-nowrap"
                  >
                    {`${formatCount(locale, copies)} × ${formatCount(locale, days)} × ${formatCents(locale, cents / 100)} = ${formatDecimal(locale, (copies * days * cents) / 100, 1)}`}
                  </FactText>
                ),
                rounded: (
                  <FactText fact={rate} locale={locale}>
                    {formatCount(locale, ENGINE.baseTdh(cents, copies * days))}
                  </FactText>
                ),
              })
            : null}
        </Para>
        {rate !== null && cents !== null && (
          <figure className="tw-m-0 tw-mt-4" data-fig="base">
            <code
              className="tw-inline-block tw-max-w-full tw-whitespace-pre-wrap tw-rounded-md tw-border tw-border-solid tw-border-iron-800 tw-bg-black/20 tw-px-3 tw-py-2 tw-font-mono tw-text-[13.5px] tw-leading-[21px] tw-text-iron-300"
              data-fact={rate.id}
              data-fact-derived=""
            >
              {`BASE(r, raw) = (r × raw + 50) div 100
= (${formatCount(locale, cents)} × ${formatCount(locale, copies * days)} + 50) div 100 = ${formatCount(locale, ENGINE.baseTdh(cents, copies * days))}`}
            </code>
            <span className="tw-mt-2 tw-block tw-text-[13px] tw-leading-5 tw-text-iron-400">
              {ht(locale, "explained.tdh.how.base.ruleSource")}
            </span>
          </figure>
        )}
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
        head: <>6529chain {v("rules.p26Commit")}</>,
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
        commit: conformance.specification.commit.slice(0, 7),
        public: v("vectors.public.count"),
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
            <FactText fact={readAt} locale={locale}>
              {formatUtcDay(locale, readAt.value)}
            </FactText>
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
