import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  LATEST_DAY_REVALIDATE_SECONDS,
  loadVerificationDay,
  loadVerificationIndex,
} from "@/lib/tdh/verification/loadVerification.server";
import { latestIndexDay } from "@/lib/tdh/verification/states";
import TdhPageShell from "../shared/TdhPageShell";
import VerificationDashboard, {
  VerificationLede,
} from "./components/VerificationDashboard";

// Refreshed every 10 minutes from the published files (plan §11.3).
export const revalidate = 600;

export default async function TdhVerificationPage() {
  const locale = DEFAULT_LOCALE;
  const indexLoad = await loadVerificationIndex();
  const latest =
    indexLoad.status === "ok" ? latestIndexDay(indexLoad.index) : null;
  const dayLoad =
    latest === null
      ? null
      : await loadVerificationDay(
          latest.cycleDay,
          LATEST_DAY_REVALIDATE_SECONDS
        );

  return (
    <TdhPageShell
      locale={locale}
      current="/network/tdh/verification"
      dropdownHref="/network/tdh/verification"
      documentTitle={t(locale, "network.tdh.verify.pageTitle")}
      title={t(locale, "network.tdh.verify.title")}
      lede={<VerificationLede locale={locale} />}
    >
      <VerificationDashboard
        locale={locale}
        indexLoad={indexLoad}
        dayLoad={dayLoad}
        selected={latest}
        now={new Date()}
      />
    </TdhPageShell>
  );
}

export function generateMetadata() {
  return getAppMetadata(
    {
      title: t(DEFAULT_LOCALE, "network.tdh.verify.pageTitle"),
      description: t(DEFAULT_LOCALE, "network.tdh.verify.metadataDescription"),
    },
    { canonicalPath: "/network/tdh/verification" }
  );
}
