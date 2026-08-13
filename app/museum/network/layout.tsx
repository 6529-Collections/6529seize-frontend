import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { getAppMetadata } from "@/components/providers/metadata";
import { MuseumShell } from "@/components/museum/MuseumShell";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import { buildMuseumPageSourceCatalog } from "@/lib/museum/publication/pageSources";
import type { MuseumSourceState } from "@/lib/museum/types";
import MuseumNetworkLoading from "./loading";

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "museum.network.title"),
  description: t(DEFAULT_LOCALE, "museum.network.description"),
});

function museumSourceState(
  status: "current" | "stale" | "unavailable"
): MuseumSourceState {
  if (status === "current") {
    return "fresh";
  }
  return status;
}

async function MuseumNetworkLayoutContent({
  children,
}: Readonly<{ children: ReactNode }>) {
  await connection();
  const publicationState = await getMuseumPublicationState();
  const sourceState = museumSourceState(publicationState.status);

  return (
    <MuseumShell
      view={{
        sourceState,
        publicationIdentity: publicationState.publication?.identity ?? null,
        pageSources:
          publicationState.publication === null
            ? []
            : buildMuseumPageSourceCatalog(publicationState.publication),
      }}
    >
      {children}
    </MuseumShell>
  );
}

export default function MuseumNetworkLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <Suspense fallback={<MuseumNetworkLoading />}>
      <MuseumNetworkLayoutContent>{children}</MuseumNetworkLayoutContent>
    </Suspense>
  );
}
