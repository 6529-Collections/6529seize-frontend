import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getAppMetadata } from "@/components/providers/metadata";
import { MuseumShell } from "@/components/museum/MuseumShell";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumView } from "@/lib/museum/normalize";

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "museum.network.title"),
  description: t(DEFAULT_LOCALE, "museum.network.description"),
});

export default async function MuseumNetworkLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const view = await getMuseumView();

  return <MuseumShell view={view}>{children}</MuseumShell>;
}
