import Link from "next/link";
import type { ReactNode } from "react";
import { getAppMetadata } from "@/components/providers/metadata";
import Verdict from "@/components/explained/evidence/Verdict";
import { kt } from "@/components/explained/i18n";
import HowWeKnow from "@/components/explained/shell/HowWeKnow";
import PrevNext from "@/components/explained/shell/PrevNext";
import ExplainedShell from "@/components/explained/shell/ExplainedShell";
import { chapterById } from "@/components/explained/shell/chapters";
import FactValue from "@/components/explained/facts/FactValue";
import { EX_LINK, EX_TEXT } from "@/components/explained/tokens";
import { formatUtcDate } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import type { FactBook } from "@/lib/explained/facts";
import { formatUtcClock, formatUtcDay } from "@/lib/explained/format";
import { resolveExplainedLocale } from "@/lib/explained/locale.server";
import {
  CheckItYourself,
  HowTheCheckRuns,
  ReadItRight,
} from "./components/CheckSections";
import CheckTop from "./components/CheckTop";
import { pt } from "./components/copy";
import { FactText } from "@/components/explained/facts/FactText";
import { rich } from "@/components/explained/rich";
import { dayView, type DayView } from "./components/dayModel";
import { UploadLink } from "./[cycleDay]/DaySide";
import { loadCheckBook, type PageBook } from "./components/loadBook.server";
import { simulateFailingDay } from "./components/simulatedDay";

/**
 * The daily check (TDH-DESIGN.md §4.4): today's verdict with its limit
 * inside, every result so far, how the check runs, how far a green day
 * goes, and who can repeat each step. Built on the 6529 Explained kit;
 * every number is a fact of the public feed, read when the page is.
 */
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ locale?: string | string[] }>;

const ROUTE = "/network/tdh/verification";

function Header({
  book,
  day,
  locale,
}: {
  readonly book: FactBook;
  readonly day: DayView;
  readonly locale: SupportedLocale;
}) {
  const tdh = chapterById("tdh");
  const page = tdh.check.find((entry) => entry.id === "check");
  const first = book.maybe<string>("tdh.days.first");
  const latest = day.fact("date");
  const latestDate = day.text("date");
  const next = book.maybe<string>("tdh.nextResultAt");
  const sep = " · ";
  return (
    <header
      className="tw-scroll-mt-24 tw-pt-[30px] md:tw-pt-[52px]"
      id="method"
    >
      <span className={`${EX_TEXT.label} tw-block`}>
        {rich(locale, "explained.tdh.check.chapter", {
          number: <span>{tdh.number}</span>,
        })}
        {sep}
        <span className="tw-text-primary-300">{page?.n}</span>{" "}
        {pt(locale, "explained.tdh.check.title")}
      </span>
      <h1
        className={`${EX_TEXT.h1r} tw-mt-4 max-[359px]:tw-text-[26px] max-[359px]:tw-leading-[32px]`}
      >
        {pt(locale, "explained.tdh.check.title")}
      </h1>
      <p className={`${EX_TEXT.lede} tw-mt-4 md:tw-mt-[22px]`} data-ex-lede="">
        {pt(locale, "explained.tdh.check.lede")}
      </p>
      <p className={`${EX_TEXT.meta} tw-m-0 tw-mt-5 md:tw-mt-6`}>
        <b className="tw-font-semibold tw-text-iron-300">
          {pt(locale, "explained.tdh.check.scope.all")}
        </b>
        {sep}
        {rich(locale, "explained.tdh.check.scope.dates", {
          first: (
            <FactText fact={first} locale={locale}>
              {first === null ? "" : formatUtcDay(locale, first.value)}
            </FactText>
          ),
          last: (
            <FactText fact={latest} locale={locale}>
              {latestDate === null
                ? ""
                : formatUtcDate(locale, latestDate, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
            </FactText>
          ),
        })}
        {next !== null && (
          <>
            {sep}
            {rich(locale, "explained.tdh.check.scope.next", {
              time: (
                <FactText fact={next} locale={locale}>
                  {formatUtcClock(locale, next.value)}
                </FactText>
              ),
              date: (
                <FactText fact={next} locale={locale}>
                  {formatUtcDay(locale, next.value)}
                </FactText>
              ),
            })}
          </>
        )}
        {sep}
        <Link
          className={`${EX_LINK} tw-font-semibold`}
          href="/network/tdh/verification.rss"
          aria-label={pt(locale, "explained.tdh.check.scope.rssLabel")}
        >
          {pt(locale, "explained.tdh.check.scope.rss")}
        </Link>
      </p>
    </header>
  );
}

/** The verdict block when the feed cannot be read: said, never a stale number. */
function Unread({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <div className="tw-mt-8" id="side">
      <Verdict
        state="missing"
        word={pt(locale, "explained.tdh.check.unread.word")}
        date={null}
        cycle={null}
        headline={pt(locale, "explained.tdh.check.unread.headline")}
        locale={locale}
      >
        <p className="tw-m-0 tw-text-[15px] tw-leading-6 tw-text-iron-300">
          {pt(locale, "explained.tdh.check.unread.body")}
        </p>
      </Verdict>
    </div>
  );
}

function fileRange(
  files: PageBook["files"],
  daysFact: ReturnType<FactBook["maybe"]>,
  locale: SupportedLocale
): { first: ReactNode; last: ReactNode } {
  const cycles = [...files.keys()].sort((a, b) => a - b);
  const label = (cycle: number | undefined) => (
    <FactText fact={daysFact} locale={locale}>
      {cycle === undefined ? "–" : String(cycle)}
    </FactText>
  );
  return { first: label(cycles[0]), last: label(cycles.at(-1)) };
}

function HowWeKnowRows({
  loaded,
  day,
  locale,
}: {
  readonly loaded: PageBook;
  readonly day: DayView;
  readonly locale: SupportedLocale;
}) {
  const { book, files } = loaded;
  const days =
    book.maybe<{ cycle: number; sha256: string | null }[]>("tdh.days");
  const stated = new Map(
    (days?.value ?? []).map((entry) => [entry.cycle, entry.sha256])
  );
  const mismatched = [...files.keys()].filter((cycle) => {
    const read = book.maybe<string>(`tdh.day.${cycle}.file.sha256Read`)?.value;
    return read === undefined || read !== stated.get(cycle);
  }).length;
  const range = fileRange(files, days, locale);
  return (
    <HowWeKnow
      locale={locale}
      title={pt(locale, "explained.tdh.check.hwk.citeTitle")}
      slug="tdh-daily-check"
      rows={[
        {
          title: pt(locale, "explained.tdh.check.hwk.feed"),
          body: (
            <>
              {rich(locale, "explained.tdh.check.hwk.feedBody", {
                ...range,
                written: (
                  <FactValue
                    fact={book.maybe("feed.writtenAt")}
                    locale={locale}
                    style="long"
                  />
                ),
                read: (
                  <FactValue fact={book.maybe("page.readAt")} locale={locale} />
                ),
              })}{" "}
              {mismatched === 0
                ? pt(locale, "explained.tdh.check.hwk.feedEqual")
                : rich(locale, "explained.tdh.check.hwk.feedDiffers", {
                    count: (
                      <FactText fact={days} locale={locale}>
                        {String(mismatched)}
                      </FactText>
                    ),
                  })}
            </>
          ),
        },
        {
          title: pt(locale, "explained.tdh.check.hwk.live"),
          body: rich(locale, "explained.tdh.check.hwk.liveBody", {
            hash: <FactValue fact={day.fact("liveSha")} locale={locale} />,
            link: (
              <UploadLink
                day={day}
                field="liveUpload"
                label={pt(locale, "explained.tdh.check.hwk.liveOpen")}
              />
            ),
          }),
        },
        {
          title: pt(locale, "explained.tdh.check.hwk.decisions"),
          body: pt(locale, "explained.tdh.check.hwk.decisionsBody"),
        },
      ]}
    />
  );
}

export default async function TdhDailyCheckPage({
  searchParams,
}: {
  readonly searchParams: SearchParams;
}) {
  const params = await searchParams;
  const locale = await resolveExplainedLocale(params);
  const loaded = await loadCheckBook();
  const { book, files } = loaded;
  const day = dayView(book, "latest");
  const cycle = day.num("cycle");
  const latestFile = cycle === null ? undefined : files.get(cycle);
  const simulated = latestFile ? simulateFailingDay(latestFile.day) : null;
  for (const fileCycle of files.keys()) {
    book.maybe(`tdh.day.${fileCycle}.file.sha256Read`);
  }
  const tdh = chapterById("tdh");
  const title = pt(locale, "explained.tdh.check.title");
  const pageLink = (id: "wallets" | "sure") => {
    const found = [...tdh.read, ...tdh.check].find((entry) => entry.id === id);
    return {
      href: found?.href ?? ROUTE,
      title: found ? kt(locale, found.title) : "",
      ...(found?.n === undefined ? {} : { n: found.n }),
    };
  };
  return (
    <ExplainedShell
      chapter="tdh"
      page="check"
      crumbs={[
        {
          label: kt(locale, "explained.kit.shell.explained"),
          href: "/explained",
        },
        {
          label: kt(locale, "explained.kit.map.chapterTitle", {
            number: tdh.number ?? "",
            title: kt(locale, tdh.title),
          }),
          href: tdh.href ?? "/network/tdh",
        },
        { label: title },
      ]}
      live={{ fact: book.maybe("feed.writtenAt"), kind: "feed" }}
      facts={book.snapshot()}
      locale={locale}
    >
      <article data-ex-article="" lang={locale}>
        <Header book={book} day={day} locale={locale} />
        {cycle === null ? (
          <Unread locale={locale} />
        ) : (
          <CheckTop
            book={book}
            day={day}
            simulated={simulated}
            locale={locale}
          />
        )}
        <HowTheCheckRuns book={book} day={day} locale={locale} />
        <ReadItRight book={book} locale={locale} />
        <CheckItYourself day={day} locale={locale} />
        <PrevNext
          locale={locale}
          prev={pageLink("wallets")}
          next={pageLink("sure")}
        />
        <HowWeKnowRows loaded={loaded} day={day} locale={locale} />
      </article>
    </ExplainedShell>
  );
}

export function generateMetadata() {
  return getAppMetadata(
    {
      title: pt(DEFAULT_LOCALE, "explained.tdh.check.metaTitle"),
      description: pt(DEFAULT_LOCALE, "explained.tdh.check.metaDescription"),
    },
    { canonicalPath: ROUTE }
  );
}
