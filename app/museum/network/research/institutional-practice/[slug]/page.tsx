import type { Metadata } from "next";
import { getAppMetadata } from "@/components/providers/metadata";
import { institutionalPracticePublicationIsComplete } from "@/components/museum/InstitutionalPracticeReadingRoom";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";

interface MuseumInstitutionProfileMetadataProps {
  readonly params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: MuseumInstitutionProfileMetadataProps): Promise<Metadata> {
  const { slug } = await params;
  const publication = (await getMuseumPublicationState()).publication;
  const profile = institutionalPracticePublicationIsComplete(publication)
    ? publication.institutionalPractice.profiles.find(
        (candidate) => candidate.slug === slug
      )
    : undefined;
  const metadata = getAppMetadata({
    title:
      profile?.document.title ??
      t(DEFAULT_LOCALE, "museum.network.institutionalPractice.title"),
    description: t(
      DEFAULT_LOCALE,
      "museum.network.institutionalPractice.profileDescription"
    ),
  });
  return profile === undefined
    ? metadata
    : {
        ...metadata,
        alternates: {
          canonical: `/museum/network/research/institutional-practice/${encodeURIComponent(profile.slug)}`,
        },
      };
}

export { renderMuseumInstitutionProfilePage as default } from "@/app/museum/network/stories/a-field-of-practice/[slug]/page";
