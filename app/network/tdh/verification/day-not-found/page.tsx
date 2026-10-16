import { getAppMetadata } from "@/components/providers/metadata";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { FIRST_TDH_FEED_CYCLE_DAY } from "@/lib/proxy/tdhVerificationDay";
import { loadVerificationIndex } from "@/lib/tdh/verification/loadVerification.server";
import { latestIndexDay } from "@/lib/tdh/verification/states";
import TdhArrowLink from "../../shared/TdhArrowLink";
import TdhPageShell from "../../shared/TdhPageShell";
import { TDH_CARD } from "../../shared/tdhStyles";
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
  const raw = (Array.isArray(value) ? value[0] : value) ?? "";
  return /^[1-9]\d{0,6}$/.test(raw)
    ? formatInteger(DEFAULT_LOCALE, Number(raw))
    : raw.slice(0, 32);
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
  return (
    <TdhPageShell
      locale={locale}
      current="/network/tdh/verification"
      dropdownHref="/network/tdh/verification"
      documentTitle={t(locale, "network.tdh.verify.dayNotFoundTitle")}
      title={
        asked
          ? t(locale, "network.tdh.verify.notFound.title", { day: asked })
          : t(locale, "network.tdh.verify.notFound.titleNoDay")
      }
      lede={
        <p className="tw-m-0">
          {t(locale, "network.tdh.verify.notFound.body", {
            first: formatCycleDate(locale, FIRST_DATE),
            cycle: formatInteger(locale, FIRST_TDH_FEED_CYCLE_DAY),
          })}
        </p>
      }
    >
      <div className={`${TDH_CARD} tw-flex tw-flex-col tw-gap-2 tw-p-5`}>
        {latest && (
          <TdhArrowLink href={verificationDayHref(latest.cycleDay)}>
            {t(locale, "network.tdh.verify.notFound.latest", {
              date: formatCycleDate(locale, latest.date),
              cycle: formatInteger(locale, latest.cycleDay),
            })}
          </TdhArrowLink>
        )}
        <TdhArrowLink href="/network/tdh/verification">
          {t(locale, "network.tdh.verify.notFound.dashboard")}
        </TdhArrowLink>
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
