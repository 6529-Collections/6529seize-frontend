import { notFound } from "next/navigation";
import { getAppMetadata } from "@/components/providers/metadata";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  LATEST_DAY_REVALIDATE_SECONDS,
  OLDER_DAY_REVALIDATE_SECONDS,
  loadVerificationDay,
  loadVerificationIndex,
} from "@/lib/tdh/verification/loadVerification.server";
import { latestIndexDay } from "@/lib/tdh/verification/states";
import TdhPageShell from "../../shared/TdhPageShell";
import VerificationDashboard, {
  VerificationLede,
} from "../components/VerificationDashboard";
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
  return /^\d{1,7}$/.test(value) ? Number(value) : null;
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
  const dayLoad = await loadVerificationDay(
    cycleDay,
    isLatest ? LATEST_DAY_REVALIDATE_SECONDS : OLDER_DAY_REVALIDATE_SECONDS
  );
  return { indexLoad, entry, dayLoad };
}

export default async function TdhVerificationDayPage({
  params,
}: {
  readonly params: Params;
}) {
  const { cycleDay } = await params;
  const loaded = await loadPermalink(cycleDay);
  // A day the index lists still renders from the index when its own file is
  // missing; only a day the index does not list is not found.
  if (loaded === null) {
    notFound();
  }
  const locale = DEFAULT_LOCALE;
  const { indexLoad, entry, dayLoad } = loaded;
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
      lede={<VerificationLede locale={locale} />}
    >
      <VerificationDashboard
        locale={locale}
        indexLoad={indexLoad}
        dayLoad={dayLoad}
        selected={entry}
        now={new Date()}
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
    // An unknown day: the page renders the not-found view (`notFound()`), so
    // it gets a not-found title and is kept out of search results.
    return getAppMetadata(
      {
        title: t(DEFAULT_LOCALE, "network.tdh.verify.dayNotFoundTitle"),
        description: t(
          DEFAULT_LOCALE,
          "network.tdh.verify.metadataDescription"
        ),
      },
      {
        canonicalPath: "/network/tdh/verification",
        robots: { index: false, follow: true },
      }
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
