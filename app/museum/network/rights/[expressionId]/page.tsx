import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { MuseumPublicationUnavailable } from "@/components/museum/MuseumPublicationUnavailable";
import { MuseumRightsExpressionPage } from "@/components/museum/MuseumRightsReadingRoom";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";

interface MuseumRightsExpressionRouteProps {
  readonly params: Promise<{ expressionId: string }>;
}

export async function generateMetadata({
  params,
}: MuseumRightsExpressionRouteProps): Promise<Metadata> {
  const { expressionId } = await params;
  const publicationState = await getMuseumPublicationState();
  const expression =
    publicationState.publication?.rightsHandbook.expressions.find(
      (candidate) => candidate.id === expressionId
    );
  return getAppMetadata({
    title:
      expression?.label ?? t(DEFAULT_LOCALE, "museum.network.rights.title"),
    description:
      expression?.summary ??
      t(DEFAULT_LOCALE, "museum.network.rights.description"),
  });
}

export async function renderMuseumRightsExpressionRoute({
  params,
}: MuseumRightsExpressionRouteProps) {
  const { expressionId } = await params;
  const publicationState = await getMuseumPublicationState();
  const publication = publicationState.publication;
  if (publication === null) {
    return <MuseumPublicationUnavailable />;
  }
  const expression = publication.rightsHandbook.expressions.find(
    (candidate) => candidate.id === expressionId
  );
  if (expression === undefined) {
    notFound();
  }

  return (
    <MuseumRightsExpressionPage
      expression={expression}
      sourceCommit={publication.identity.commit}
    />
  );
}

export default async function MuseumRightsExpressionLegacyRoute({
  params,
}: MuseumRightsExpressionRouteProps) {
  const { expressionId } = await params;
  const publication = (await getMuseumPublicationState()).publication;
  if (
    publication === null ||
    publication.rightsHandbook.expressions.every(
      (expression) => expression.id !== expressionId
    )
  ) {
    notFound();
  }
  permanentRedirect(
    `/museum/network/research/rights/${encodeURIComponent(expressionId)}`
  );
}
