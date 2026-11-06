import SanctionsPolicyPage from "@/components/sanctions/SanctionsPolicyPage";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { buildSanctionsPageModel } from "@/lib/sanctions/sanctions-page-model";
import { loadSanctionsSnapshot } from "@/lib/sanctions/sanctions-snapshot.server";
import type { Metadata } from "next";

/**
 * Re-render at most hourly so that orders with an end date move to the
 * "lapsed" group on the right day without a deploy.
 */
export const revalidate = 3600;

export default function SanctionsPage() {
  const loaded = loadSanctionsSnapshot();
  const asOf = new Date().toISOString().slice(0, 10);
  return (
    <SanctionsPolicyPage
      locale={DEFAULT_LOCALE}
      model={buildSanctionsPageModel(loaded.list, asOf)}
      sha256={loaded.sha256}
      cid={loaded.cid}
      builtOn={loaded.builtOn}
      preview={loaded.preview}
    />
  );
}

export function generateMetadata(): Metadata {
  return getAppMetadata(
    {
      title: t(DEFAULT_LOCALE, "sanctions.pageTitle"),
      description: t(DEFAULT_LOCALE, "sanctions.metadataDescription"),
    },
    { canonicalPath: "/sanctions" }
  );
}
