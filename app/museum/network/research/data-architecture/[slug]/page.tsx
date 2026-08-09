import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dataArchitecturePublicationIsComplete } from "@/components/museum/DataArchitectureReadingRoom";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";

interface DataArchitectureProfileMetadataProps {
  readonly params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: DataArchitectureProfileMetadataProps): Promise<Metadata> {
  const { slug } = await params;
  const publication = (await getMuseumPublicationState()).publication;
  const fallback = () =>
    getAppMetadata({
      title: t(DEFAULT_LOCALE, "museum.network.dataArchitecture.shortTitle"),
      description: t(
        DEFAULT_LOCALE,
        "museum.network.dataArchitecture.profilePageDescription"
      ),
    });
  if (!dataArchitecturePublicationIsComplete(publication)) return fallback();
  const document =
    slug === "casey-reas-implementation"
      ? publication.dataArchitecture.caseyImplementation
      : publication.dataArchitecture.standards.find(
          (standard) => standard.slug === slug
        )?.document;
  if (document === undefined) notFound();
  return {
    ...getAppMetadata({
      title: document.title,
      description: t(
        DEFAULT_LOCALE,
        "museum.network.dataArchitecture.profilePageDescription"
      ),
    }),
    alternates: {
      canonical: `/museum/network/research/data-architecture/${encodeURIComponent(slug)}`,
    },
  };
}

export { renderMuseumDataArchitectureProfilePage as default } from "@/app/museum/network/methodology/data-architecture/[slug]/page";
