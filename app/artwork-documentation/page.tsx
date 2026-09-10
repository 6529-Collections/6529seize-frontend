import ArtworkDocumentationList from "@/components/artwork-documentation/ArtworkDocumentationList";
export default async function ArtworkDocumentationPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ sourceDropId?: string | string[] }>;
}) {
  const { sourceDropId } = await searchParams;
  return (
    <ArtworkDocumentationList
      sourceDropId={
        Array.isArray(sourceDropId) ? sourceDropId[0] : sourceDropId
      }
    />
  );
}
