import Link from "next/link";
import { getAppMetadata } from "@/components/providers/metadata";
import { ageText } from "@/components/explained/age";
import { kt } from "@/components/explained/i18n";
import { Icon } from "@/components/explained/marks/glyphs";
import ExplainedShell from "@/components/explained/shell/ExplainedShell";
import { chapterById } from "@/components/explained/shell/chapters";
import { EX_BUTTON, EX_LINK, EX_TEXT } from "@/components/explained/tokens";
import { formatInteger } from "@/i18n/format";
import {
  DEFAULT_LOCALE,
  normalizeLocale,
  type SupportedLocale,
} from "@/i18n/locales";
import { loadFactBook } from "@/lib/explained/feed.server";
import type { FactBook } from "@/lib/explained/facts";
import {
  formatUtcClock,
  formatUtcDay,
  formatUtcLongDay,
  minutesBetween,
} from "@/lib/explained/format";
import { cycleOf, dateOfCycle } from "@/lib/explained/registry/helpers";
import { pt } from "../components/copy";
import { FactText } from "@/components/explained/facts/FactText";
import { rich } from "@/components/explained/rich";

/**
 * The receipt pages' not-found view. The proxy rewrites a day permalink
 * that names no published day here, with status 404
 * (lib/proxy/tdhVerificationDay.ts): one that cannot exist, and one inside
 * the feed's range that its index does not list. The address bar keeps the
 * path that was asked for; `?day=` carries the day only when it is a cycle
 * number, so no other text of the address reaches the page.
 */
export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  day?: string | string[];
  locale?: string | string[];
}>;

const CHECK_ROUTE = "/network/tdh/verification";
/** 6529.io's own uploads, for the days before the comparison began. */
const UPLOADS_URL = "https://api.6529.io/api/consolidated_uploads";

function firstValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/**
 * The day asked for, as a cycle number, or null for anything else. The text
 * of an address is never echoed into the page: a trust page must not repeat
 * whatever a link puts in its path.
 */
function askedCycle(value: string | string[] | undefined): number | null {
  const raw = firstValue(value);
  return /^[1-9]\d{0,6}$/.test(raw) ? Number(raw) : null;
}

/** Why the day has no receipt: not closed yet, before the feed, or unlisted. */
function Explanation({
  cycle,
  book,
  locale,
}: {
  readonly cycle: number | null;
  readonly book: FactBook;
  readonly locale: SupportedLocale;
}) {
  const first = book.maybe<string>("tdh.days.first");
  const next = book.maybe<string>("tdh.nextResultAt");
  const openCycle = book.maybe<number>("tdh.open.cycle");
  const firstDate = first === null ? null : first.value;
  const firstParams = {
    first: (
      <FactText fact={first} locale={locale}>
        {firstDate === null ? "" : formatUtcLongDay(locale, firstDate)}
      </FactText>
    ),
    cycle: (
      <FactText fact={first} locale={locale}>
        {firstDate === null ? "" : formatInteger(locale, cycleOf(firstDate))}
      </FactText>
    ),
  };
  const lede = `${EX_TEXT.lede} tw-mt-4 md:tw-mt-[22px]`;
  const now = book.maybe<string>("page.readAt")?.value;
  // Cycle N closes at 00:00 UTC of its date: a later one has no result yet.
  if (
    cycle !== null &&
    now !== undefined &&
    cycle * 86_400_000 > Date.parse(now)
  ) {
    const date = dateOfCycle(cycle);
    const after =
      next !== null && openCycle !== null
        ? ageText(
            locale,
            minutesBetween(
              `${dateOfCycle(openCycle.value)}T00:00:00Z`,
              next.value
            )
          )
        : "";
    return (
      <p className={lede} data-ex-lede="">
        {rich(locale, "explained.tdh.day.notFound.future", {
          day: formatInteger(locale, cycle),
          close: formatUtcClock(locale, `${date}T00:00:00Z`),
          date: formatUtcLongDay(locale, date),
          after: (
            <FactText fact={next} locale={locale}>
              {after}
            </FactText>
          ),
        })}
      </p>
    );
  }
  if (cycle !== null && firstDate !== null && cycle < cycleOf(firstDate)) {
    return (
      <>
        <p className={lede} data-ex-lede="">
          {rich(locale, "explained.tdh.day.notFound.before", {
            ...firstParams,
            day: formatInteger(locale, cycle),
            date: formatUtcLongDay(locale, dateOfCycle(cycle)),
          })}
        </p>
        {/* The day proof A proved is before the first published day: say
            so, and where its proof is, since readers type it from there. */}
        {book.maybe<number>("proofs.day.cycle")?.value === cycle && (
          <p className={`${EX_TEXT.body} tw-m-0 tw-mt-4 tw-max-w-[660px]`}>
            {rich(locale, "explained.tdh.day.notFound.proved", {
              link: (
                <Link className={EX_LINK} href="/network/tdh/proofs">
                  {pt(locale, "explained.tdh.day.notFound.provedLink")}
                </Link>
              ),
            })}
          </p>
        )}
        <p className={`${EX_TEXT.body} tw-m-0 tw-mt-4 tw-max-w-[660px]`}>
          {rich(locale, "explained.tdh.day.notFound.uploads", {
            link: (
              <a
                className={EX_LINK}
                href={UPLOADS_URL}
                rel="noopener noreferrer"
                target="_blank"
              >
                {pt(locale, "explained.tdh.day.notFound.uploadsLink")}
              </a>
            ),
          })}
        </p>
      </>
    );
  }
  return (
    <p className={lede} data-ex-lede="">
      {rich(locale, "explained.tdh.day.notFound.body", firstParams)}
    </p>
  );
}

export default async function TdhVerificationDayNotFound({
  searchParams,
}: {
  readonly searchParams: SearchParams;
}) {
  const params = await searchParams;
  const locale = normalizeLocale(firstValue(params.locale));
  const book = await loadFactBook();
  const cycle = askedCycle(params.day);
  const latest = book.maybe<number>("tdh.latest.cycle");
  const latestDate = book.maybe<string>("tdh.latest.date");
  const tdh = chapterById("tdh");
  const check = tdh.check.find((page) => page.id === "check");
  const checkTitle = check ? kt(locale, check.title) : "";
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
        { label: checkTitle, href: CHECK_ROUTE },
      ]}
      live={{ fact: book.maybe("feed.writtenAt"), kind: "feed" }}
      facts={book.snapshot()}
      locale={locale}
    >
      <article data-ex-article="" lang={locale}>
        <header className="tw-pt-[30px] md:tw-pt-[52px]">
          <span className={`${EX_TEXT.label} tw-block`}>
            {pt(locale, "explained.tdh.day.eyebrow")}
          </span>
          <h1
            className={`${EX_TEXT.h1r} tw-mt-4 max-[359px]:tw-text-[26px] max-[359px]:tw-leading-[32px]`}
          >
            {cycle === null
              ? pt(locale, "explained.tdh.day.notFound.titleNoDay")
              : pt(locale, "explained.tdh.day.notFound.title", {
                  day: formatInteger(locale, cycle),
                })}
          </h1>
          <Explanation cycle={cycle} book={book} locale={locale} />
        </header>
        <div className="tw-mt-8 tw-flex tw-flex-wrap tw-gap-2.5">
          {latest !== null && latestDate !== null && (
            <Link
              className={EX_BUTTON.cta}
              href={`${CHECK_ROUTE}/${latest.value}`}
            >
              <span>
                {rich(locale, "explained.tdh.day.notFound.latest", {
                  date: (
                    <FactText fact={latestDate} locale={locale}>
                      {formatUtcDay(locale, latestDate.value)}
                    </FactText>
                  ),
                })}
              </span>
              <Icon kind="arrow" />
            </Link>
          )}
          <Link className={EX_BUTTON.secondary} href={CHECK_ROUTE}>
            {pt(locale, "explained.tdh.day.notFound.check")}
          </Link>
        </div>
      </article>
    </ExplainedShell>
  );
}

export function generateMetadata() {
  return getAppMetadata(
    {
      title: pt(DEFAULT_LOCALE, "explained.tdh.day.notFound.metaTitle"),
      description: pt(DEFAULT_LOCALE, "explained.tdh.day.metaDescription"),
    },
    { robots: { index: false, follow: true } }
  );
}
