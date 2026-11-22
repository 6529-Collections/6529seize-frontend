import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { onchainMuseumMetadata } from "./_components/metadata";
import { OnchainFrame } from "./_components/OnchainParts";

// An unlinked test of the Museum read from the Sepolia ProvenanceRegistry. It
// stays out of search, the sitemap and site navigation until it replaces
// /museum/network.
export const metadata: Metadata = onchainMuseumMetadata(
  t(DEFAULT_LOCALE, "museum.onchain.title"),
  t(DEFAULT_LOCALE, "museum.onchain.description")
);

export default function OnchainMuseumLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <OnchainFrame>{children}</OnchainFrame>;
}
