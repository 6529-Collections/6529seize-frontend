"use client";

import { mutationCapabilities } from "@/lib/artwork-documentation/capabilities";

import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import type { DocumentationDraftController } from "@/lib/artwork-documentation/draft-controller";
import { pinDocumentationArtistRecord } from "@/services/api/artwork-documentation-api";
import { DocumentationValueSummary } from "./DocumentationSummary";
import {
  canImportDocumentationAnswer,
  isPublicationOnly,
} from "@/lib/artwork-documentation/intake";
import { isRedacted } from "@/lib/artwork-documentation/answers";
import {
  DocumentationButton,
  useDocumentationMessages,
} from "./DocumentationControls";

export default function DocumentationArtistPin({
  context,
  controller,
}: {
  readonly context: ApiArtworkDocumentationContext;
  readonly controller: DocumentationDraftController;
}) {
  const { msg } = useDocumentationMessages();
  const candidate = context.available_artist_record;
  const revisionId = candidate?.id;
  if (
    !mutationCapabilities(context).confirm_as_artist ||
    !candidate ||
    typeof revisionId !== "string" ||
    revisionId === context.artist_record_revision_id
  )
    return null;
  if (
    isPublicationOnly(context.profile) &&
    Object.entries(candidate.answers).some(
      ([field, answer]) =>
        isRedacted(answer) ||
        !canImportDocumentationAnswer(
          context.profile,
          `identity.${field}`,
          answer
        )
    )
  )
    return (
      <p className="tw-text-sm tw-leading-relaxed tw-text-iron-300">
        {msg("publication.pinBlocked")}
      </p>
    );
  return (
    <details className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-4">
      <summary className="tw-min-h-11 tw-cursor-pointer tw-py-2 tw-text-sm tw-font-medium focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
        {msg("pin")}
      </summary>
      <p className="tw-text-sm tw-leading-relaxed tw-text-iron-400">
        {msg("pinHelp")}
      </p>
      <div className="tw-mb-4 tw-grid tw-gap-5 sm:tw-grid-cols-2">
        <div>
          <h3 className="tw-text-sm tw-font-semibold">
            {msg("conflict.base")}
          </h3>
          <DocumentationValueSummary
            value={context.modules["identity"]?.answers}
          />
        </div>
        <div>
          <h3 className="tw-text-sm tw-font-semibold">
            {msg("conflict.server")}
          </h3>
          <DocumentationValueSummary value={candidate.answers} />
        </div>
      </div>
      <DocumentationButton
        secondary
        onClick={() => {
          void controller.mutate((current, signal) =>
            pinDocumentationArtistRecord(current, revisionId, signal)
          );
        }}
      >
        {msg("pin")}
      </DocumentationButton>
    </details>
  );
}
