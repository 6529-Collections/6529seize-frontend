import { notFound } from "next/navigation";
import { getAppMetadata } from "@/components/providers/metadata";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  LATEST_DAY_REVALIDATE_SECONDS,
  OLDER_DAY_REVALIDATE_SECONDS,
  loadPreviousDay,
  loadVerificationDay,
  loadVerificationIndex,
} from "@/lib/tdh/verification/loadVerification.server";
import { latestIndexDay } from "@/lib/tdh/verification/states";
import TdhPageShell from "../../shared/TdhPageShell";
import VerificationDashboard from "../components/VerificationDashboard";
import { formatCycleDate } from "../components/verificationFormat";

// Day permalinks render per request, like every route under the root layout
// (it reads cookies and headers); the index and day files are cached at the
// fetch level (`loadVerification.server.ts`). Rendering is made explicitly
// dynamic so no static-paths work is ever attempted for this segment: no
// generateStaticParams, and no route-level revalidate, which made the dev
// server's static-paths worker try (and fail on) the layout's dynamic reads.
export const dynamic = "force-dynamic";

type Params = Promise<{ cycleDay: string }>;

function parseCycleDay(value: string): number | null {
  return /^[1-9]\d{0,6}$/.test(value) ? Number(value) : null;
}

async function loadPermalink(value: string) {
  const cycleDay = parseCycleDay(value);
  if (cycleDay === null) {
    return null;
  }
  const indexLoad = await loadVerificationIndex();
  if (indexLoad.status !== "ok") {
    return null;
  }
  const entry = indexLoad.index.days.find((day) => day.cycleDay === cycleDay);
  if (!entry) {
    return null;
  }
  const isLatest = latestIndexDay(indexLoad.index)?.cycleDay === cycleDay;
  const [dayLoad, previousDay] = await Promise.all([
    loadVerificationDay(
      cycleDay,
      isLatest ? LATEST_DAY_REVALIDATE_SECONDS : OLDER_DAY_REVALIDATE_SECONDS
    ),
    loadPreviousDay(indexLoad.index, cycleDay),
  ]);
  return { indexLoad, entry, dayLoad, previousDay };
}

export default async function TdhVerificationDayPage({
  params,
}: {
  readonly params: Params;
}) {
  const { cycleDay } = await params;
  const loaded = await loadPermalink(cycleDay);
  // A day the index lists still renders from the index when its own file is
  // missing; only a day the index does not list is not found. The proxy has
  // already answered such a day with a 404 whenever it could read the index
  // (`lib/proxy/tdhVerificationDay.ts`); this is the fallback when it
  // could not.
  if (loaded === null) {
    notFound();
  }
  const locale = DEFAULT_LOCALE;
  const { indexLoad, entry, dayLoad, previousDay } = loaded;
  const cycle = formatInteger(locale, entry.cycleDay);
  const date = formatCycleDate(locale, entry.date);

  return (
    <TdhPageShell
      locale={locale}
      current="/network/tdh/verification"
      dropdownHref="/network/tdh/verification"
      documentTitle={t(locale, "network.tdh.verify.dayPageTitle", {
        cycle,
        date,
      })}
      title={t(locale, "network.tdh.verify.dayTitle", { date })}
      pills={
        <>
          <span className="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-px-2.5 tw-py-1 tw-text-xs tw-tabular-nums tw-text-iron-200 sm:tw-text-sm">
            {t(locale, "network.tdh.verify.dayCycle", { cycle })}
          </span>
        </>
      }
      lede={
        <p className="tw-m-0">
          {t(locale, "network.tdh.verify.dayLede", { date, cycle })}
        </p>
      }
    >
      <VerificationDashboard
        locale={locale}
        indexLoad={indexLoad}
        dayLoad={dayLoad}
        selected={entry}
        now={new Date()}
        permalink
        previousDay={previousDay}
      />
    </TdhPageShell>
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
        title: t(DEFAULT_LOCALE, "network.tdh.verify.dayNotFoundTitle"),
        description: t(
          DEFAULT_LOCALE,
          "network.tdh.verify.metadataDescription"
        ),
      },
      { canonicalPath: "/network/tdh/verification" }
    );
  }
  const cycle = formatInteger(DEFAULT_LOCALE, value);
  const date = formatCycleDate(DEFAULT_LOCALE, entry.date);
  return getAppMetadata(
    {
      title: t(DEFAULT_LOCALE, "network.tdh.verify.dayPageTitle", {
        cycle,
        date,
      }),
      description: t(
        DEFAULT_LOCALE,
        "network.tdh.verify.dayMetadataDescription",
        { date }
      ),
    },
    { canonicalPath: `/network/tdh/verification/${value}` }
  );
}
