import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MuseumGenerativeSystemStudyPage } from "@/components/museum/MuseumGenerativeSystemStudyPage";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { tryCaseyArtworksFromPublication } from "@/lib/museum/casey";
import { getGenerativeStudyByProjectSlug } from "@/lib/museum/generative-studies";
import { getMintedProjectIndex } from "@/lib/museum/generative-studies/minted";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";

interface MuseumGenerativeSystemPageProps {
  readonly params: Promise<{ slug: string }>;
  readonly searchParams?: Promise<{
    readonly work?: string | readonly string[] | undefined;
  }>;
}

export async function generateMetadata({
  params,
}: MuseumGenerativeSystemPageProps): Promise<Metadata> {
  const { slug } = await params;
  const study = getGenerativeStudyByProjectSlug(slug);
  return getAppMetadata({
    title:
      study === null
        ? t(DEFAULT_LOCALE, "museum.network.insideSystem.title")
        : t(DEFAULT_LOCALE, "museum.network.insideSystem.metadataTitle", {
            project: study.projectTitle,
          }),
    description:
      study?.thesis ??
      t(DEFAULT_LOCALE, "museum.network.insideSystem.description"),
  });
}

export default async function MuseumGenerativeSystemPage({
  params,
  searchParams,
}: MuseumGenerativeSystemPageProps) {
  const { slug } = await params;
  const requestedWork = (await searchParams)?.work;
  const requestedWorkId =
    typeof requestedWork === "string" ? requestedWork : requestedWork?.[0];
  const publicationState = await getMuseumPublicationState();
  if (publicationState.publication === null) {
    return <MuseumPublicationUnavailable />;
  }
  const project = publicationState.publication.projects.find(
    (item) => item.slug === slug
  );
  const study = getGenerativeStudyByProjectSlug(slug);
  if (project === undefined || study === null) {
    notFound();
  }
  if (project.id !== study.projectId && project.slug !== study.projectSlug) {
    notFound();
  }
  const caseyArtworks = tryCaseyArtworksFromPublication(
    publicationState.publication
  );
  if (caseyArtworks === null) {
    return <MuseumPublicationUnavailable />;
  }
  const artworks = caseyArtworks.filter((artwork) =>
    project.artworkIds.includes(artwork.objectId)
  );
  const mintedIndex = getMintedProjectIndex(slug);
  if (mintedIndex === null) {
    notFound();
  }

  const initialWorkId = study.heldPositions.some(
    (position) => position.objectId === requestedWorkId
  )
    ? requestedWorkId
    : undefined;

  return (
    <MuseumGenerativeSystemStudyPage
      study={study}
      artworks={artworks}
      mintedIndex={mintedIndex}
      initialWorkId={initialWorkId}
    />
  );
}
