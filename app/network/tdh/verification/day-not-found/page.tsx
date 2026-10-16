import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { getAppMetadata } from "@/components/providers/metadata";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { FIRST_TDH_FEED_CYCLE_DAY } from "@/lib/proxy/tdhVerificationDay";
import { loadVerificationIndex } from "@/lib/tdh/verification/loadVerification.server";
import { cutoverState, latestIndexDay } from "@/lib/tdh/verification/states";
import TdhArrowLink from "../../shared/TdhArrowLink";
import TdhPageShell from "../../shared/TdhPageShell";
import { TDH_BUTTON, TDH_CARD, TDH_LINK } from "../../shared/tdhStyles";
import VerificationCalendar from "../components/VerificationCalendar";
import { verificationDayHref } from "../components/VerificationHeadline";
import { formatCycleDate } from "../components/verificationFormat";

// The proxy rewrites a day permalink that cannot name a published day here,
// with status 404 (lib/proxy/tdhVerificationDay.ts); the address bar keeps
// the path that was asked for.
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ day?: string | string[] }>;

/** The feed's first day, October 14, 2026, as a date. */
const FIRST_DATE = new Date(FIRST_TDH_FEED_CYCLE_DAY * 86_400_000)
  .toISOString()
  .slice(0, 10);

/** The day asked for, as written, or as a cycle number when it is one. */
function askedDay(value: string | string[] | undefined): string {
  const raw = firstValue(value);
  return /^[1-9]\d{0,6}$/.test(raw)
    ? formatInteger(DEFAULT_LOCALE, Number(raw))
    : raw.slice(0, 32);
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
  const cutover = cutoverState(
    indexLoad.status === "ok" ? indexLoad.index.cutover : null,
    now
  );
  return (
    <TdhPageShell
      locale={locale}
      current="/network/tdh/verification"
      dropdownHref="/network/tdh/verification"
      documentTitle={t(locale, "network.tdh.verify.dayNotFoundTitle")}
      eyebrow={t(locale, "network.tdh.verify.title")}
      title={
        asked
          ? t(locale, "network.tdh.verify.notFound.title", { day: asked })
          : t(locale, "network.tdh.verify.notFound.titleNoDay")
      }
      lede={
        <p className="tw-m-0">
          {future === null
            ? t(locale, "network.tdh.verify.notFound.body", {
                first: formatCycleDate(locale, FIRST_DATE),
                cycle: formatInteger(locale, FIRST_TDH_FEED_CYCLE_DAY),
              })
            : t(locale, "network.tdh.verify.notFound.future", {
                day: formatInteger(locale, future),
                date: formatCycleDate(
                  locale,
                  new Date(future * 86_400_000).toISOString().slice(0, 10)
                ),
                first: formatCycleDate(locale, FIRST_DATE),
                cycle: formatInteger(locale, FIRST_TDH_FEED_CYCLE_DAY),
              })}
        </p>
      }
    >
      <div className="tw-space-y-4">
        {indexLoad.status === "ok" && latest && (
          <VerificationCalendar
            locale={locale}
            days={indexLoad.index.days}
            selectedCycleDay={latest.cycleDay}
            upcomingUntil={
              cutover.kind === "countdown" ? cutover.plannedDate : null
            }
            now={now}
          />
        )}
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
          <TdhArrowLink href="/network/tdh/verification">
            {t(locale, "network.tdh.verify.notFound.dashboard")}
          </TdhArrowLink>
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
