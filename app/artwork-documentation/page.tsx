import ArtworkDocumentationList from "@/components/artwork-documentation/ArtworkDocumentationList";
export default async function ArtworkDocumentationPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ sourceDropId?: string }>;
}) {
  const { sourceDropId } = await searchParams;
  return <ArtworkDocumentationList sourceDropId={sourceDropId} />;
}
