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
import TdhStatusPill from "../../shared/TdhStatusPill";
import VerificationDashboard, {
  VerificationLede,
} from "../components/VerificationDashboard";
import { formatCycleDate } from "../components/verificationFormat";

// Day permalinks are rendered on first request and refreshed hourly.
export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

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
  const isSample = indexLoad.source === "sample";
  const cycle = formatInteger(locale, entry.cycleDay);

  return (
    <TdhPageShell
      locale={locale}
      current="/network/tdh/verification"
      dropdownHref="/network/tdh/verification"
      documentTitle={t(locale, "network.tdh.verify.dayPageTitle", { cycle })}
      title={t(locale, "network.tdh.verify.dayTitle", { cycle })}
      pills={
        isSample ? <TdhStatusPill pill="sample" locale={locale} /> : undefined
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
  const cycle = formatInteger(DEFAULT_LOCALE, value ?? 0);
  return getAppMetadata(
    {
      title: t(DEFAULT_LOCALE, "network.tdh.verify.dayPageTitle", { cycle }),
      description: entry
        ? t(DEFAULT_LOCALE, "network.tdh.verify.dayMetadataDescription", {
            date: formatCycleDate(DEFAULT_LOCALE, entry.date),
          })
        : t(DEFAULT_LOCALE, "network.tdh.verify.metadataDescription"),
    },
    {
      canonicalPath:
        value === null
          ? "/network/tdh/verification"
          : `/network/tdh/verification/${value}`,
    }
  );
}
