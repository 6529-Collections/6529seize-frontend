import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { loadVerificationSummary } from "@/lib/tdh/verification/summary.server";
import TDHMainPage from "./page.client";

// The "Verified daily" strip reads the daily verification files (plan §5.5).
export const revalidate = 600;

export default async function TDH() {
  const verification = await loadVerificationSummary();
  return <TDHMainPage verification={verification} />;
}

export const generateMetadata = () => {
  return getAppMetadata(
    {
      title: t(DEFAULT_LOCALE, "network.tdh.explainer.pageTitle"),
      description: t(
        DEFAULT_LOCALE,
        "network.tdh.explainer.metadataDescription"
      ),
    },
    { canonicalPath: "/network/tdh" }
  );
};
