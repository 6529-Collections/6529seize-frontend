import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { loadFormalManifest } from "@/lib/tdh/formal/loadFormalManifest.server";
import { loadVerificationSummary } from "@/lib/tdh/verification/summary.server";
import TDHMainPage from "./page.client";

// The "Verified daily" strip reads the daily verification files (plan §5.5).
export const revalidate = 600;

export default async function TDH() {
  const [verification, manifest] = await Promise.all([
    loadVerificationSummary(),
    loadFormalManifest(),
  ]);
  return (
    <TDHMainPage
      verification={verification}
      manifestUrl={manifest.status === "published" ? manifest.url : null}
    />
  );
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
