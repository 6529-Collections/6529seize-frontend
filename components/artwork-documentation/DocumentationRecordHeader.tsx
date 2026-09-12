"use client";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import {
  documentationTitle,
  readAnswer,
} from "@/lib/artwork-documentation/answers";
import { isMuseumRecord } from "@/lib/artwork-documentation/catalogue";
import { isPublicationOnly } from "@/lib/artwork-documentation/intake";
import { documentationOptionLabel } from "@/i18n/messages/artwork-documentation-fields";
import { formatDate } from "@/i18n/format";
import {
  DocumentationButton,
  useDocumentationMessages,
} from "./DocumentationControls";
export default function DocumentationRecordHeader({
  context,
  draftRecord,
  canWrite,
  reading,
  onToggleReading,
  headingLevel,
}: {
  readonly context: ApiArtworkDocumentationContext;
  readonly draftRecord: ApiArtworkDocumentationContext;
  readonly canWrite: boolean;
  readonly reading: boolean;
  readonly onToggleReading: () => void;
  readonly headingLevel: 1 | 2;
}) {
  const { msg, locale } = useDocumentationMessages();
  const museum = isMuseumRecord(context.profile);
  const publicationOnly = isPublicationOnly(context.profile);
  const credit: unknown = readAnswer(
    draftRecord,
    "identity",
    "preferred_credit"
  )?.value;
  const Heading = headingLevel === 1 ? "h1" : "h2";
  let aboutKey =
    context.program_id === "6529NM-AP-01" ? "keysHelp" : "description";
  if (museum) aboutKey = "museum.aboutRecord";
  return (
    <header className="tw-space-y-6">
      <div className="tw-max-w-3xl">
        <p className="tw-mb-4 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-iron-400">
          {documentationOptionLabel(
            context.program_id ?? context.profile.profile_id
          )}
        </p>
        <Heading className="tw-m-0 tw-break-words tw-font-serif tw-text-4xl tw-font-normal tw-leading-[1.08] tw-tracking-tight sm:tw-text-6xl">
          {documentationTitle(draftRecord) ??
            msg(canWrite && !reading ? "chapters.beginRecord" : "untitled")}
        </Heading>
        {typeof credit === "string" && credit.trim() && (
          <p className="tw-mb-0 tw-mt-4 tw-text-lg tw-leading-7 tw-text-iron-200">
            {credit}
          </p>
        )}
        <p className="tw-mb-0 tw-mt-5 tw-text-xs tw-leading-5 tw-text-iron-400">
          {msg("savedAt", { date: formatDate(locale, context.updated_at) })} ·{" "}
          {documentationOptionLabel(context.confirmation_status)}
        </p>
      </div>
      {canWrite ? (
        <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-6">
          <div className="tw-max-w-prose tw-space-y-3">
            <p className="tw-m-0 tw-text-base tw-leading-7 tw-text-iron-200">
              {msg(museum ? "museum.welcome" : "chapters.welcome")}
            </p>
            <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400">
              {msg(
                publicationOnly ? "chapters.publication" : "publication.legacy"
              )}
            </p>
            <details className="tw-text-sm tw-leading-6 tw-text-iron-400">
              <summary className="tw-min-h-11 tw-cursor-pointer tw-py-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
                {msg("chapters.aboutRecord")}
              </summary>
              <div className="tw-space-y-3 tw-pb-3">
                <p className="tw-m-0">{msg(aboutKey)}</p>
                <p className="tw-m-0">
                  {msg(publicationOnly ? "publication.draft" : "privacy")}
                </p>
              </div>
            </details>
          </div>
          <DocumentationButton secondary onClick={onToggleReading}>
            {msg(reading ? "chapters.returnToWriting" : "chapters.readDraft")}
          </DocumentationButton>
        </div>
      ) : (
        <p
          role="status"
          className="tw-m-0 tw-text-base tw-leading-7 tw-text-iron-300"
        >
          {msg("viewOnly")}
        </p>
      )}
    </header>
  );
}
