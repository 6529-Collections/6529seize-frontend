import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { getAppMetadata } from "@/components/providers/metadata";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { FIRST_TDH_FEED_CYCLE_DAY } from "@/lib/proxy/tdhVerificationDay";
import { loadVerificationIndex } from "@/lib/tdh/verification/loadVerification.server";
import { latestIndexDay } from "@/lib/tdh/verification/states";
import TdhPageShell from "../../shared/TdhPageShell";
import { TDH_BUTTON, TDH_CARD, TDH_LINK } from "../../shared/tdhStyles";
import { verificationDayHref } from "../components/VerificationHeadline";
import { formatCycleDate } from "../components/verificationFormat";

// The proxy rewrites a day permalink that names no published day here,
// with status 404 (lib/proxy/tdhVerificationDay.ts): one that cannot exist,
// and one inside the feed's range that its index does not list. The address
// bar keeps the path that was asked for; `?day=` carries the day only when
// it is a cycle number, so no other text of the address reaches the page.
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ day?: string | string[] }>;

/** The feed's first day, October 14, 2026, as a date. */
const FIRST_DATE = new Date(FIRST_TDH_FEED_CYCLE_DAY * 86_400_000)
  .toISOString()
  .slice(0, 10);

/**
 * The day asked for, as a cycle number, or null for anything else. The text
 * of an address is never echoed into the page: a trust page must not repeat
 * whatever a link puts in its path.
 */
function askedDay(value: string | string[] | undefined): string | null {
  const raw = firstValue(value);
  return /^[1-9]\d{0,6}$/.test(raw)
    ? formatInteger(DEFAULT_LOCALE, Number(raw))
    : null;
}

function firstValue(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/**
 * The cycle asked for when it has not closed yet: cycle N closes at 00:00
 * UTC of its date, N days after January 1, 1970.
 */
function futureCycle(
  value: string | string[] | undefined,
  now: Date
): number | null {
  const raw = firstValue(value);
  if (!/^[1-9]\d{0,6}$/.test(raw)) {
    return null;
  }
  const cycle = Number(raw);
  return cycle * 86_400_000 > now.getTime() ? cycle : null;
}

/** The cycle asked for when it is a number before the feed's first day. */
function earlyCycle(value: string | string[] | undefined): number | null {
  const raw = firstValue(value);
  if (!/^[1-9]\d{0,6}$/.test(raw)) {
    return null;
  }
  const cycle = Number(raw);
  return cycle < FIRST_TDH_FEED_CYCLE_DAY ? cycle : null;
}

/** A cycle day's date, "YYYY-MM-DD". */
function cycleDate(cycle: number): string {
  return new Date(cycle * 86_400_000).toISOString().slice(0, 10);
}

/**
 * The TDH pages' not-found view for a day permalink: which day was asked
 * for, the days the feed holds, and the way to the latest day and the
 * dashboard, inside the site's frame.
 */
export default async function TdhVerificationDayNotFound({
  searchParams,
}: {
  readonly searchParams: SearchParams;
}) {
  const locale = DEFAULT_LOCALE;
  const { day } = await searchParams;
  const asked = askedDay(day);
  const indexLoad = await loadVerificationIndex();
  const latest =
    indexLoad.status === "ok" ? latestIndexDay(indexLoad.index) : null;
  const now = new Date();
  const future = futureCycle(day, now);
  const early = earlyCycle(day);
  const first = {
    first: formatCycleDate(locale, FIRST_DATE),
    cycle: formatInteger(locale, FIRST_TDH_FEED_CYCLE_DAY),
  };
  let lede = t(locale, "network.tdh.verify.notFound.body", first);
  if (future !== null) {
    lede = t(locale, "network.tdh.verify.notFound.future", {
      ...first,
      day: formatInteger(locale, future),
      date: formatCycleDate(locale, cycleDate(future)),
    });
  } else if (early !== null) {
    lede = t(locale, "network.tdh.verify.notFound.beforeFirst", {
      ...first,
      day: formatInteger(locale, early),
      date: formatCycleDate(locale, cycleDate(early)),
    });
  }
  return (
    <TdhPageShell
      locale={locale}
      current="/network/tdh/verification"
      dropdownHref="/network/tdh/verification"
      documentTitle={t(locale, "network.tdh.verify.dayNotFoundTitle")}
      title={
        asked === null
          ? t(locale, "network.tdh.verify.notFound.titleNoDay")
          : t(locale, "network.tdh.verify.notFound.title", { day: asked })
      }
      lede={<p className="tw-m-0">{lede}</p>}
    >
      {/* The way on, and nothing else: the latest day and the dashboard as
          a primary and a secondary button, and, for a day before the feed,
          where its uploads and the replay are. */}
      <div className="tw-space-y-4">
        <div
          className={`${TDH_CARD} tw-flex tw-w-fit tw-max-w-full tw-flex-col tw-items-start tw-gap-3 tw-p-5`}
        >
          {latest && (
            <Link
              href={verificationDayHref(latest.cycleDay)}
              className={`${TDH_BUTTON} tw-border-primary-400/60 tw-bg-primary-500/15 tw-text-iron-50 tw-no-underline hover:tw-border-primary-400 hover:tw-bg-primary-500/25`}
            >
              {t(locale, "network.tdh.verify.notFound.latest", {
                date: formatCycleDate(locale, latest.date),
                cycle: formatInteger(locale, latest.cycleDay),
              })}
              <ArrowRightIcon aria-hidden="true" className="tw-size-4" />
            </Link>
          )}
          <Link
            href="/network/tdh/verification"
            className={`${TDH_BUTTON} tw-no-underline`}
          >
            {t(locale, "network.tdh.verify.notFound.dashboard")}
          </Link>
          {/* Where the days before the feed are: only for a day before it. */}
          {early !== null && (
            <>
              <p className="tw-m-0 tw-max-w-[36em] tw-text-sm tw-leading-6 tw-text-iron-300">
                {t(locale, "network.tdh.verify.notFound.before", {
                  first: formatCycleDate(locale, FIRST_DATE),
                })}{" "}
                <a
                  href="https://api.6529.io/api/consolidated_uploads"
                  className={TDH_LINK}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {t(locale, "network.tdh.verify.check.apiLink")}
                </a>
              </p>
              <p className="tw-m-0 tw-max-w-[36em] tw-text-sm tw-leading-6 tw-text-iron-300">
                {t(locale, "network.tdh.verify.notFound.replay")}{" "}
                <Link
                  href="/network/tdh/specification#evidence-replay"
                  className={TDH_LINK}
                >
                  {t(locale, "network.tdh.verify.notFound.replayLink")}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </TdhPageShell>
  );
}

export function generateMetadata() {
  return getAppMetadata(
    {
      title: t(DEFAULT_LOCALE, "network.tdh.verify.dayNotFoundTitle"),
      description: t(DEFAULT_LOCALE, "network.tdh.verify.metadataDescription"),
    },
    { robots: { index: false, follow: true } }
  );
}
