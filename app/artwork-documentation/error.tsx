"use client";
import {
  DocumentationButton,
  DocumentationNotice,
  useDocumentationMessages,
} from "@/components/artwork-documentation/DocumentationControls";
export default function ArtworkDocumentationError({
  reset,
}: {
  readonly reset: () => void;
}) {
  const { msg } = useDocumentationMessages();
  return (
    <DocumentationNotice error>
      <p>{msg("error")}</p>
      <DocumentationButton onClick={reset}>{msg("retry")}</DocumentationButton>
    </DocumentationNotice>
  );
}
