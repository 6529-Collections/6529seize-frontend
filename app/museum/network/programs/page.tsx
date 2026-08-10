import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { museumAcquisitionProgramsHref } from "@/lib/museum/publication/routes";

export const metadata: Metadata = getAppMetadata({
  title: t(DEFAULT_LOCALE, "museum.network.programs.title"),
  description: t(DEFAULT_LOCALE, "museum.network.programs.description"),
});

export default async function MuseumProgramsPage() {
  permanentRedirect(museumAcquisitionProgramsHref());
}
