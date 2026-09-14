"use client";

import Link from "next/link";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import type { PendingEdit } from "@/lib/artwork-documentation/draft-controller";
import type { DocumentationSection } from "@/lib/artwork-documentation/registry";
import { AN_ALTERATION_EXAMPLE_PATH } from "@/lib/artwork-documentation/an-alteration";
import { useDocumentationMessages } from "./DocumentationControls";

export default function DocumentationWorkedExample({
  section,
}: {
  readonly context: ApiArtworkDocumentationContext;
  readonly edits: readonly PendingEdit[];
  readonly section: DocumentationSection;
}) {
  const { msg } = useDocumentationMessages();
  return (
    <Link
      id={`documentation-sample-${section}`}
      href={AN_ALTERATION_EXAMPLE_PATH}
      target="_blank"
      rel="noopener noreferrer"
      className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
    >
      {msg("museum.sample")}
    </Link>
  );
}
