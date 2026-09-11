import type { Metadata } from "next";
import { getAppMetadata } from "@/components/providers/metadata";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";

interface MuseumRightsExpressionMetadataProps {
  readonly params: Promise<{ expressionId: string }>;
}

export async function generateMetadata({
  params,
}: MuseumRightsExpressionMetadataProps): Promise<Metadata> {
  const { expressionId } = await params;
  const expression = (
    await getMuseumPublicationState()
  ).publication?.rightsHandbook.expressions.find(
    (candidate) => candidate.id === expressionId
  );
  const metadata = getAppMetadata({
    title:
      expression?.label ?? t(DEFAULT_LOCALE, "museum.network.rights.title"),
    description:
      expression?.summary ??
      t(DEFAULT_LOCALE, "museum.network.rights.description"),
  });
  return expression === undefined
    ? metadata
    : {
        ...metadata,
        alternates: {
          canonical: `/museum/network/research/rights/${encodeURIComponent(expression.id)}`,
        },
      };
}

export { renderMuseumRightsExpressionRoute as default } from "@/app/museum/network/rights/[expressionId]/page";
