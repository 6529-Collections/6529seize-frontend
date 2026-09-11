import { notFound, permanentRedirect } from "next/navigation";
import { getMuseumView } from "@/lib/museum/normalize";
import { museumSlugMatches } from "@/lib/museum/presentation";

export default async function MuseumGovernanceLegacyDetailPage({
  params,
}: {
  readonly params: Promise<{ decisionId: string }>;
}) {
  const { decisionId } = await params;
  const view = await getMuseumView();
  const decision = view.governance.find((item) =>
    museumSlugMatches(item.decisionId, decisionId)
  );
  if (decision === undefined) notFound();
  permanentRedirect(
    `/museum/network/about/governance/${encodeURIComponent(decisionId)}`
  );
}
