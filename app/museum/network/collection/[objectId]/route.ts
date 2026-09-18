import { applyMuseumCollectionSemantics } from "@/lib/museum/publication/collectionSemantics";
import { museumCollectionWorkHrefForSourceId } from "@/lib/museum/publication/routes";
import { getMuseumPublicationBundle } from "@/lib/museum/publication/runtimeBundle";

interface MuseumCollectionAliasContext {
  readonly params: Promise<{ objectId: string }>;
}

export async function GET(
  _request: Request,
  { params }: MuseumCollectionAliasContext
): Promise<Response> {
  const { objectId } = await params;
  const { publicationState, view } = await getMuseumPublicationBundle();
  const publication = publicationState.publication;
  const href =
    publication === null
      ? null
      : museumCollectionWorkHrefForSourceId(
          applyMuseumCollectionSemantics(publication),
          objectId,
          view
        );

  if (href === null) {
    return new Response("Not found", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  // A page under the Museum's Suspense boundary can stream a 200 shell before
  // permanentRedirect emits a meta refresh. Redirect before rendering so the
  // abandoned shell cannot start and then cancel settings/country requests.
  return new Response(null, {
    status: 308,
    headers: { Location: href, "Cache-Control": "no-store" },
  });
}
