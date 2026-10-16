import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { loadFormalManifest } from "@/lib/tdh/formal/loadFormalManifest.server";
import { loadVerificationSummary } from "@/lib/tdh/verification/summary.server";
import { loadTdhRules } from "./loadTdhRules.server";
import TDHMainPage from "./page.client";

// The "Verified daily" strip reads the daily verification files (plan §5.5).
export const revalidate = 600;

export default async function TDH() {
  const [verification, manifest, rules] = await Promise.all([
    loadVerificationSummary(),
    loadFormalManifest(),
    loadTdhRules(),
  ]);
  return (
    <TDHMainPage
      verification={verification}
      manifestUrl={manifest.status === "published" ? manifest.url : null}
      rules={rules}
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
