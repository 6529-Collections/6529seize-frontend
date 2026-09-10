import ArtworkDocumentationWorkspace from "@/components/artwork-documentation/ArtworkDocumentationWorkspace";
export default async function DocumentationWorkspacePage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ workId: string; contextId: string }>;
  readonly searchParams: Promise<{ section?: string }>;
}) {
  const ids = await params;
  const query = await searchParams;
  return <ArtworkDocumentationWorkspace {...ids} section={query.section} />;
}
