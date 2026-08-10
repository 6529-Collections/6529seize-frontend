import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { MuseumAcquisitionRecordPage } from "@/components/museum/MuseumAcquisitionRecordPage";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  buildMuseumAcquisitionContext,
  type MuseumAcquisitionViewModel,
} from "@/lib/museum/publication/ia";
import {
  museumAcquisitionHref,
  resolveMuseumAcquisitionSlug,
} from "@/lib/museum/publication/routes";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";

interface MuseumAcquisitionRouteProps {
  readonly params: Promise<{ slug: string }>;
}

function acquisitionDescription(
  acquisition: MuseumAcquisitionViewModel | null
): string {
  return (
    acquisition?.thesis ??
    t(DEFAULT_LOCALE, "museum.network.acquisitions.description")
  );
}

export async function generateMetadata({
  params,
}: MuseumAcquisitionRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const { publicationState, view } = await getMuseumPublicationBundle();
  const canonicalSlug =
    publicationState.publication === null
      ? null
      : resolveMuseumAcquisitionSlug(publicationState.publication, slug);
  const acquisition =
    publicationState.publication === null || canonicalSlug === null
      ? null
      : buildMuseumAcquisitionContext(
          publicationState.publication,
          canonicalSlug,
          view
        );
  return {
    ...getAppMetadata({
      title:
        acquisition?.title ??
        t(DEFAULT_LOCALE, "museum.network.acquisitions.title"),
      description: acquisitionDescription(acquisition),
    }),
    ...(canonicalSlug === null
      ? {}
      : { alternates: { canonical: museumAcquisitionHref(canonicalSlug) } }),
  };
}

export default async function MuseumAcquisitionRoute({
  params,
}: MuseumAcquisitionRouteProps) {
  const { slug } = await params;
  const { publicationState, view } = await getMuseumPublicationBundle();
  const publication = publicationState.publication;
  if (publication === null) {
    return <MuseumPublicationUnavailable />;
  }
  const canonicalSlug = resolveMuseumAcquisitionSlug(publication, slug);
  if (canonicalSlug === null) notFound();
  if (canonicalSlug !== slug) {
    permanentRedirect(museumAcquisitionHref(canonicalSlug));
  }
  const acquisition = buildMuseumAcquisitionContext(
    publication,
    canonicalSlug,
    view
  );
  if (acquisition === null) notFound();

  return (
    <MuseumAcquisitionRecordPage
      acquisition={acquisition}
      publication={publication}
      view={view}
      sourceCommit={publication.identity.commit}
    />
  );
}
