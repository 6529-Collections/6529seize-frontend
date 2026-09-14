"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { mutationCapabilities } from "@/lib/artwork-documentation/capabilities";

import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import type { DocumentationDraftController } from "@/lib/artwork-documentation/draft-controller";
import {
  getDocumentationArtistRecord,
  pinDocumentationArtistRecord,
} from "@/services/api/artwork-documentation-api";
import type { ApiArtworkDocumentationAvailableArtistRecord } from "@/generated/models/ApiArtworkDocumentationAvailableArtistRecord";
import { documentationQueryKey } from "@/hooks/artwork-documentation/useArtworkDocumentationAccess";
import { useDocumentationActor } from "./DocumentationAuthGate";
import { DocumentationValueSummary } from "./DocumentationSummary";
import {
  canImportDocumentationAnswer,
  isPublicationOnly,
} from "@/lib/artwork-documentation/intake";
import { isRedacted } from "@/lib/artwork-documentation/answers";
import {
  DocumentationButton,
  DocumentationNotice,
  useDocumentationMessages,
} from "./DocumentationControls";

interface Props {
  readonly context: ApiArtworkDocumentationContext;
  readonly controller: DocumentationDraftController;
}
export default function DocumentationArtistPin({ context, controller }: Props) {
  const candidate = context.available_artist_record;
  const revisionId = candidate?.id;
  if (
    !mutationCapabilities(context).confirm_as_artist ||
    !candidate ||
    typeof revisionId !== "string" ||
    revisionId === context.artist_record_revision_id
  )
    return null;
  return (
    <ArtistRecordComparison
      key={`${context.id}-${revisionId}`}
      context={context}
      controller={controller}
      available={candidate}
    />
  );
}

function ArtistRecordComparison({
  context,
  controller,
  available,
}: Props & {
  readonly available: ApiArtworkDocumentationAvailableArtistRecord;
}) {
  const { msg } = useDocumentationMessages();
  const { connectedProfile, actorKey } = useDocumentationActor();
  const [opened, setOpened] = useState(false);
  const query = useQuery({
    queryKey: documentationQueryKey(
      connectedProfile?.id,
      context.id,
      "artist-record-comparison",
      actorKey,
      available.id
    ),
    queryFn: async ({ signal }) => {
      const result = await getDocumentationArtistRecord(
        context.id,
        available.id,
        signal
      );
      if (
        result.id !== available.id ||
        result.record_version !== available.record_version ||
        result.deferred === true
      )
        throw new Error("Artist revision is incomplete");
      return result;
    },
    enabled: opened && available.deferred === true,
    retry: false,
    gcTime: 0,
    meta: { persist: false },
  });
  const candidate = available.deferred === true ? query.data : available;
  const blocked =
    !!candidate &&
    isPublicationOnly(context.profile) &&
    Object.entries(candidate.answers).some(
      ([field, answer]) =>
        isRedacted(answer) ||
        !canImportDocumentationAnswer(
          context.profile,
          `identity.${field}`,
          answer
        )
    );
  return (
    <details
      className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-4"
      onToggle={(event) => setOpened(event.currentTarget.open)}
    >
      <summary className="tw-min-h-11 tw-cursor-pointer tw-py-2 tw-text-sm tw-font-medium focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
        {msg("pin")}
      </summary>
      <p className="tw-text-sm tw-leading-relaxed tw-text-iron-400">
        {msg("pinHelp")}
      </p>
      {opened && !candidate && query.isPending && (
        <p role="status">{msg("loading")}</p>
      )}
      {opened && query.isError && (
        <DocumentationNotice error>
          <p>{msg("museum.artistComparisonUnavailable")}</p>
          <DocumentationButton
            secondary
            onClick={() => {
              void query.refetch();
            }}
          >
            {msg("retry")}
          </DocumentationButton>
        </DocumentationNotice>
      )}
      {blocked && (
        <p className="tw-text-sm tw-leading-relaxed tw-text-iron-300">
          {msg("publication.pinBlocked")}
        </p>
      )}
      {candidate && !blocked && (
        <>
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
                pinDocumentationArtistRecord(current, candidate.id, signal)
              );
            }}
          >
            {msg("pin")}
          </DocumentationButton>
        </>
      )}
    </details>
  );
}
