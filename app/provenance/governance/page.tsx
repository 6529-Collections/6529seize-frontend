import type { Metadata } from "next";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import GovernanceConsole from "./_components/GovernanceConsole";

// An unlinked tool for signers of a provenance registry's owner Safe. It stays
// out of search, the sitemap and site navigation.
export const metadata: Metadata = getAppMetadata(
  {
    title: t(DEFAULT_LOCALE, "provenance.governance.title"),
    description: t(DEFAULT_LOCALE, "provenance.governance.description"),
  },
  { robots: { index: false, follow: false } }
);

export default function ProvenanceGovernancePage() {
  return <GovernanceConsole />;
}
