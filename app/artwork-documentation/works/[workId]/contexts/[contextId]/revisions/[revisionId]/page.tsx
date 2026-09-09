import ArtworkDocumentationWorkspace from "@/components/artwork-documentation/ArtworkDocumentationWorkspace";
export default async function DocumentationRevisionPage({
  params,
}: {
  readonly params: Promise<{
    workId: string;
    contextId: string;
    revisionId: string;
  }>;
}) {
  return <ArtworkDocumentationWorkspace {...await params} />;
}
