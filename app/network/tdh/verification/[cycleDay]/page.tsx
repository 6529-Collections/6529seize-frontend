import Link from "next/link";
import { notFound } from "next/navigation";
import { getAppMetadata } from "@/components/providers/metadata";
import Receipt from "@/components/explained/evidence/Receipt";
import Verdict from "@/components/explained/evidence/Verdict";
import FactValue from "@/components/explained/facts/FactValue";
import { kt } from "@/components/explained/i18n";
import { Icon } from "@/components/explained/marks/glyphs";
import ExplainedShell from "@/components/explained/shell/ExplainedShell";
import HowWeKnow from "@/components/explained/shell/HowWeKnow";
import { chapterById } from "@/components/explained/shell/chapters";
import { EX_BUTTON, EX_FOCUS, EX_TEXT } from "@/components/explained/tokens";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import type { FactBook } from "@/lib/explained/facts";
import { formatUtcDay, formatUtcLongDay } from "@/lib/explained/format";
import { resolveExplainedLocale } from "@/lib/explained/locale.server";
import { dayFactIds } from "@/lib/explained/registry/dayFacts";
import { dateOfCycle } from "@/lib/explained/registry/helpers";
import { loadVerificationIndex } from "@/lib/tdh/verification/loadVerification.server";
import { pt } from "../components/copy";
import { FactText } from "@/components/explained/facts/FactText";
import { rich } from "@/components/explained/rich";
import { dayView, type DayView } from "../components/dayModel";
import { loadDayBook } from "../components/loadBook.server";
import CopyReceipt from "./CopyReceipt";
import { Builds, DaySide } from "./DaySide";
import { receiptRows, receiptText } from "./receiptRows";

/**
 * A day's receipt (TDH-DESIGN.md §4.5): one day's comparison on one slip,
 * in a fixed order, with every hash needed to check it and the file's
 * SHA-256 computed in the reader's browser. A day the feed's index does not
 * list is a real 404: the proxy answers it before this page runs
 * (`lib/proxy/tdhVerificationDay.ts`), and `notFound()` here is the
 * fallback when the proxy could not read the index.
 *
 * Rendered per request, like every route under the root layout (it reads
 * cookies and headers); the index and day files are cached at the fetch
 * level. No generateStaticParams and no route-level revalidate, which made
 * the dev server's static-paths worker try (and fail on) the layout's
 * dynamic reads.
 */
export const dynamic = "force-dynamic";

type Params = Promise<{ cycleDay: string }>;
type SearchParams = Promise<{ locale?: string | string[] }>;

const CHECK_ROUTE = "/network/tdh/verification";
/** Never "late": an older day's file is not expected to change. */
const ARCHIVED_CADENCE_MINUTES = Number.MAX_SAFE_INTEGER;

function parseCycleDay(value: string): number | null {
  return /^[1-9]\d{0,6}$/.test(value) ? Number(value) : null;
}

const NAV_BUTTON = `tw-inline-flex tw-h-10 tw-items-center tw-gap-2 tw-whitespace-nowrap tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-white/[0.06] tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-50 tw-no-underline hover:tw-border-iron-600 ${EX_FOCUS}`;
/** The open day: not a link, and said so in words, not by fading. */
const NAV_OPEN =
  "tw-inline-flex tw-h-10 tw-items-center tw-whitespace-nowrap tw-rounded-full tw-border tw-border-dashed tw-border-iron-700 tw-px-4 tw-text-sm tw-font-semibold tw-text-iron-400";

/** The result before and after; while the next day is open, it says so. */
function DayNav({
  cycle,
  cycles,
  book,
  locale,
}: {
  readonly cycle: number;
  readonly cycles: readonly number[];
  readonly book: FactBook;
  readonly locale: SupportedLocale;
}) {
  const days = book.maybe("tdh.days");
  const previous = cycles.filter((value) => value < cycle).at(-1);
  const next = cycles.find((value) => value > cycle);
  const day = (value: number) => (
    <FactText fact={days} locale={locale}>
      {formatUtcDay(locale, dateOfCycle(value))}
    </FactText>
  );
  const long = (value: number) => formatUtcLongDay(locale, dateOfCycle(value));
  return (
    <nav
      className="tw-flex tw-flex-wrap tw-gap-2"
      aria-label={pt(locale, "explained.tdh.day.nav.label")}
    >
      {previous !== undefined && (
        <Link
          className={NAV_BUTTON}
          href={`${CHECK_ROUTE}/${previous}`}
          aria-label={pt(locale, "explained.tdh.day.nav.previous", {
            date: long(previous),
          })}
        >
          <Icon kind="arrow" className="tw-size-3.5 tw-rotate-180" />
          {day(previous)}
        </Link>
      )}
      {next === undefined ? (
        <span
          className={NAV_OPEN}
          aria-disabled="true"
          aria-label={pt(locale, "explained.tdh.day.nav.openLabel", {
            date: long(cycle + 1),
          })}
        >
          <span>
            {rich(locale, "explained.tdh.day.nav.open", {
              date: day(cycle + 1),
            })}
          </span>
        </span>
      ) : (
        <Link
          className={NAV_BUTTON}
          href={`${CHECK_ROUTE}/${next}`}
          aria-label={pt(locale, "explained.tdh.day.nav.next", {
            date: long(next),
          })}
        >
          {day(next)}
          <Icon kind="arrow" className="tw-size-3.5" />
        </Link>
      )}
    </nav>
  );
}

function Header({
  day,
  cycle,
  cycles,
  book,
  locale,
}: {
  readonly day: DayView;
  readonly cycle: number;
  readonly cycles: readonly number[];
  readonly book: FactBook;
  readonly locale: SupportedLocale;
}) {
  return (
    <header className="tw-pt-[30px] md:tw-pt-[52px]">
      <span className={`${EX_TEXT.label} tw-block`}>
        {pt(locale, "explained.tdh.day.eyebrow")}
      </span>
      <div className="tw-mt-4 tw-flex tw-flex-wrap tw-items-end tw-justify-between tw-gap-x-6 tw-gap-y-4">
        <h1
          className={`${EX_TEXT.h1r} max-[359px]:tw-text-[26px] max-[359px]:tw-leading-[32px]`}
        >
          {rich(locale, "explained.tdh.day.title", {
            date: (
              <FactValue fact={day.fact("date")} locale={locale} style="long" />
            ),
          })}
        </h1>
        <DayNav cycle={cycle} cycles={cycles} book={book} locale={locale} />
      </div>
      <p className={`${EX_TEXT.lede} tw-mt-4 md:tw-mt-[22px]`} data-ex-lede="">
        {pt(locale, "explained.tdh.day.lede")}
      </p>
    </header>
  );
}

/**
 * The day's file could not be read: either the index lists the day and its
 * file failed, or the feed's index itself could not be read just now.
 */
function MissingFile({
  locale,
  indexRead,
}: {
  readonly locale: SupportedLocale;
  readonly indexRead: boolean;
}) {
  return (
    <div className="tw-mt-10 md:tw-mt-12">
      <Verdict
        state="missing"
        date={null}
        cycle={null}
        headline={pt(
          locale,
          indexRead
            ? "explained.tdh.day.missing.headline"
            : "explained.tdh.day.missing.headlineFeed"
        )}
        locale={locale}
      >
        <p className="tw-m-0 tw-text-[15px] tw-leading-6 tw-text-iron-300">
          {pt(locale, "explained.tdh.day.missing.body")}
        </p>
      </Verdict>
    </div>
  );
}

function DayHowWeKnow({
  day,
  book,
  locale,
  title,
}: {
  readonly day: DayView;
  readonly book: FactBook;
  readonly locale: SupportedLocale;
  readonly title: string;
}) {
  const url = day.text("file.url");
  return (
    <HowWeKnow
      locale={locale}
      title={title}
      slug="tdh-day-receipt"
      rows={[
        {
          title: pt(locale, "explained.tdh.day.hwk.file"),
          body: rich(locale, "explained.tdh.day.hwk.fileBody", {
            file: (
              <FactText fact={day.fact("file.url")} locale={locale}>
                {url === null ? "" : url.split("/").slice(-2).join("/")}
              </FactText>
            ),
            written: (
              <FactValue
                fact={day.fact("writtenAt")}
                locale={locale}
                style="long"
              />
            ),
            read: (
              <FactValue fact={book.maybe("page.readAt")} locale={locale} />
            ),
          }),
        },
        {
          title: pt(locale, "explained.tdh.day.hwk.rules"),
          body: rich(locale, "explained.tdh.day.hwk.rulesBody", {
            commit: (
              <FactValue fact={book.maybe("rules.p26Commit")} locale={locale} />
            ),
            registry: (
              <FactValue fact={book.maybe("rules.registry")} locale={locale} />
            ),
            ruleId: (
              <FactValue fact={book.maybe("rules.ruleId")} locale={locale} />
            ),
          }),
        },
        {
          title: pt(locale, "explained.tdh.day.hwk.totals"),
          body: rich(locale, "explained.tdh.day.hwk.totalsBody", {
            cycle: (
              <FactValue
                fact={book.maybe("site.proofA.cycle")}
                locale={locale}
              />
            ),
          }),
        },
      ]}
    />
  );
}

export default async function TdhDayReceiptPage({
  params,
  searchParams,
}: {
  readonly params: Params;
  readonly searchParams: SearchParams;
}) {
  const { cycleDay } = await params;
  const cycle = parseCycleDay(cycleDay);
  if (cycle === null) {
    notFound();
  }
  const locale = await resolveExplainedLocale(await searchParams);
  const { book, files, cycles } = await loadDayBook(cycle);
  // A day the index does not list is not found; the proxy has already
  // answered it with a 404 whenever it could read the index. When the index
  // itself could not be read just now, the day is not declared missing: the
  // page says the feed could not be read, and to try again.
  const indexRead = cycles.length > 0;
  if (indexRead && !cycles.includes(cycle)) {
    notFound();
  }
  for (const id of dayFactIds(cycle)) {
    book.maybe(id);
  }
  book.maybe("tdh.days");
  const day = dayView(book, cycle);
  const file = files.get(cycle) ?? null;
  const date = formatUtcLongDay(locale, dateOfCycle(cycle));
  const title = pt(locale, "explained.tdh.day.title", { date });
  const tdh = chapterById("tdh");
  const check = tdh.check.find((page) => page.id === "check");
  const rows = file === null ? [] : receiptRows(day, book, locale, file.text);
  const fileUrl = day.text("file.url");
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
        {
          label: check ? kt(locale, check.title) : CHECK_ROUTE,
          href: CHECK_ROUTE,
        },
        { label: formatUtcDay(locale, dateOfCycle(cycle)) },
      ]}
      live={{
        fact: day.fact("writtenAt"),
        kind: "file",
        ...(cycle === cycles.at(-1)
          ? {}
          : { cadenceMinutes: ARCHIVED_CADENCE_MINUTES }),
      }}
      facts={book.snapshot()}
      locale={locale}
    >
      <article data-ex-article="" lang={locale}>
        <Header
          day={day}
          cycle={cycle}
          cycles={cycles}
          book={book}
          locale={locale}
        />
        {file === null ? (
          <MissingFile locale={locale} indexRead={indexRead} />
        ) : (
          <div className="tw-mt-10 tw-grid tw-grid-cols-1 tw-items-start tw-gap-7 md:tw-mt-12 lg:tw-grid-cols-[minmax(0,1fr)_360px] lg:tw-gap-10">
            <div className="tw-min-w-0">
              <Receipt
                rows={rows}
                cycle={formatInteger(locale, cycle)}
                locale={locale}
              />
              <div className="tw-mt-8 tw-flex tw-flex-wrap tw-gap-2.5">
                <CopyReceipt
                  text={receiptText(rows, day, locale)}
                  label={pt(locale, "explained.tdh.day.act.copy")}
                  done={pt(locale, "explained.tdh.day.act.copied")}
                />
                {fileUrl !== null && (
                  <a className={EX_BUTTON.secondary} href={fileUrl}>
                    <Icon kind="down" />
                    {pt(locale, "explained.tdh.day.act.json")}
                  </a>
                )}
              </div>
              <p className={`${EX_TEXT.cap} tw-m-0 tw-mt-3`}>
                {pt(locale, "explained.tdh.day.act.note")}
              </p>
            </div>
            <DaySide day={day} book={book} cycle={cycle} locale={locale} />
          </div>
        )}
        {file !== null && <Builds day={day} locale={locale} />}
        <DayHowWeKnow day={day} book={book} locale={locale} title={title} />
      </article>
    </ExplainedShell>
  );
}

export async function generateMetadata({
  params,
}: {
  readonly params: Params;
}) {
  const { cycleDay } = await params;
  const value = parseCycleDay(cycleDay);
  const indexLoad = value === null ? null : await loadVerificationIndex();
  const entry =
    indexLoad?.status === "ok"
      ? indexLoad.index.days.find((day) => day.cycleDay === value)
      : undefined;
  if (value === null || entry === undefined) {
    // An unknown day the proxy could not check against the index (it
    // answers 404 for every other): the page renders the not-found view
    // (`notFound()`), which Next marks noindex, so this sets only the title.
    return getAppMetadata(
      {
        title: pt(DEFAULT_LOCALE, "explained.tdh.day.notFound.metaTitle"),
        description: pt(DEFAULT_LOCALE, "explained.tdh.day.metaDescription"),
      },
      { canonicalPath: CHECK_ROUTE }
    );
  }
  return getAppMetadata(
    {
      title: pt(DEFAULT_LOCALE, "explained.tdh.day.metaTitle", {
        date: formatUtcLongDay(DEFAULT_LOCALE, entry.date),
      }),
      description: pt(DEFAULT_LOCALE, "explained.tdh.day.metaDescription"),
    },
    { canonicalPath: `${CHECK_ROUTE}/${value}` }
  );
}
