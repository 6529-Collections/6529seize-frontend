import ArtworkDocumentationList from "@/components/artwork-documentation/ArtworkDocumentationList";
export default async function DocumentationProgramPage({
  params,
}: {
  readonly params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  return <ArtworkDocumentationList programId={programId} />;
}
