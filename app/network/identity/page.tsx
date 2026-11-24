import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ChainIdentityPage from "@/components/chain-identity/ChainIdentityPage";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { isChainIdentityEnabled } from "@/lib/chain-identity/config";

/** The connected wallet's identity on the 6529 Network (chain flows only). */
export default function NetworkIdentityPage() {
  if (!isChainIdentityEnabled()) {
    notFound();
  }
  return <ChainIdentityPage />;
}

export function generateMetadata(): Metadata {
  return getAppMetadata({
    title: t(DEFAULT_LOCALE, "chainIdentity.metadata.title"),
    description: t(DEFAULT_LOCALE, "chainIdentity.metadata.description"),
  });
}
