import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { resolveMuseumAcquisitionProgramSlug } from "@/lib/museum/publication/routes";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";

interface ProgramDetailProps {
  readonly params: Promise<{ programId: string }>;
}

export async function generateMetadata({
  params,
}: ProgramDetailProps): Promise<Metadata> {
  const { programId } = await params;
  const { publicationState } = await getMuseumPublicationBundle();
  const typedProgram = publicationState.publication?.acquisitionPrograms?.find(
    (item) =>
      item.slug === programId ||
      item.id === programId ||
      item.sourceAliases?.includes(programId) === true
  );
  return getAppMetadata({
    title:
      typedProgram?.title ??
      t(DEFAULT_LOCALE, "museum.network.programs.title"),
    description: t(DEFAULT_LOCALE, "museum.network.programs.description"),
  });
}

export default async function MuseumProgramDetailPage({
  params,
}: ProgramDetailProps) {
  const { programId } = await params;
  const { publicationState: bundlePublicationState } =
    await getMuseumPublicationBundle();
  const publication = bundlePublicationState.publication;
  if (publication === null) notFound();
  const programSlug = resolveMuseumAcquisitionProgramSlug(
    publication,
    programId
  );
  if (programSlug !== null) {
    return permanentRedirect(
      `/museum/network/acquisition-programs/${encodeURIComponent(programSlug)}`
    );
  }
  notFound();
}
