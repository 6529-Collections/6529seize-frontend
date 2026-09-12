"use client";
import { ApiArtworkDocumentationContextLifecycleEnum } from "@/generated/models/ApiArtworkDocumentationContext";
import type { useDocumentationDraft } from "@/hooks/artwork-documentation/useDocumentationDraft";
import { documentationDraftRecord } from "@/lib/artwork-documentation/record";
import { mutationCapabilities } from "@/lib/artwork-documentation/capabilities";
import { isMuseumRecord } from "@/lib/artwork-documentation/catalogue";
import {
  MODULE_FIELDS,
  type DocumentationSection,
} from "@/lib/artwork-documentation/registry";
import { isPublicationOnly } from "@/lib/artwork-documentation/intake";
import { changeDocumentationLifecycle } from "@/services/api/artwork-documentation-api";
import {
  DocumentationButton,
  useDocumentationMessages,
} from "./DocumentationControls";
import DocumentationModules from "./DocumentationModules";
import DocumentationUpload from "./DocumentationUpload";
import DocumentationReview from "./DocumentationReview";
import DocumentationSummary from "./DocumentationSummary";
import DocumentationFeedback from "./DocumentationFeedback";
import DocumentationAccess from "./DocumentationAccess";
import DocumentationSources from "./DocumentationSources";
import DocumentationArtistPin from "./DocumentationArtistPin";
import DocumentationArtworkPreview from "./DocumentationArtworkPreview";
import DocumentationNewContext from "./DocumentationNewContext";
import DocumentationWorkedExample from "./DocumentationWorkedExample";
import DocumentationProfileUpgrade from "./DocumentationProfileUpgrade";
interface Props {
  readonly draft: ReturnType<typeof useDocumentationDraft>;
  readonly section: DocumentationSection;
}
const FILE_FIELDS = [
  "artwork.canonical_asset_id",
  "artwork.declared_dimensions",
  ...MODULE_FIELDS.files.map((field) => `files.${field.id}`),
];
export function DocumentationWritingChapter({ draft, section }: Props) {
  const { context, controller } = draft;
  const draftRecord = documentationDraftRecord(context, draft.edits);
  const museum = isMuseumRecord(context.profile);
  const publicationOnly = isPublicationOnly(context.profile);
  const { msg } = useDocumentationMessages();
  const assets = context.assets
    .filter((asset) => asset.state === "ready")
    .map((asset) => ({ id: asset.id, label: asset.filename }));
  return (
    <>
      {section === "artwork" && (
        <DocumentationArtworkPreview
          context={draftRecord}
          allowSubmissionReference
        />
      )}
      {section === "artwork" && !museum && (
        <DocumentationProfileUpgrade
          context={context}
          controller={controller}
        />
      )}
      <DocumentationWorkedExample
        key={`${context.id}-${section}`}
        context={context}
        edits={draft.edits}
        section={section}
      />
      <div
        id={`documentation-answers-${context.id}-${section}`}
        tabIndex={-1}
        className="tw-min-w-0 tw-space-y-10 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        {section === "artwork" && (
          <DocumentationSources context={context} controller={controller} />
        )}
        {(section === "artist" || (museum && section === "rights")) && (
          <DocumentationArtistPin context={context} controller={controller} />
        )}
        {museum &&
          section === "rights" &&
          context.profile.program_rules?.fixed_artwork_license && (
            <section
              className="tw-max-w-prose tw-space-y-3 tw-border-0 tw-border-y tw-border-solid tw-border-iron-700 tw-py-6"
              aria-labelledby="documentation-program-terms"
            >
              <h3
                id="documentation-program-terms"
                className="tw-m-0 tw-font-serif tw-text-2xl tw-font-normal"
              >
                {msg("museum.programTerms")}
              </h3>
              <p className="tw-m-0 tw-text-base tw-text-iron-100">
                {context.profile.program_rules.fixed_artwork_license.label}
              </p>
              <p className="tw-m-0 tw-text-sm tw-leading-7 tw-text-iron-400">
                {msg("museum.programTermsHelp")}
              </p>
            </section>
          )}
        {section === "rights" && !museum && (
          <details className="tw-text-sm tw-leading-6 tw-text-iron-400">
            <summary className="tw-min-h-11 tw-cursor-pointer tw-py-2">
              {msg("why")}
            </summary>
            <p>
              {msg(publicationOnly ? "publication.whyRights" : "why.rights")}
            </p>
            <p>
              {msg("cc0")}{" "}
              <a
                href="https://creativecommons.org/publicdomain/zero/1.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="tw-text-primary-300"
              >
                {msg("cc0Link")}
              </a>
            </p>
          </details>
        )}
        {section === "review" ? (
          <>
            <DocumentationReview
              context={context}
              controller={controller}
              saveState={draft.state}
              edits={draft.edits}
            />
            {museum && (
              <DocumentationModules
                context={context}
                edits={draft.edits}
                section="review"
                onChange={(moduleId, operation) =>
                  controller.edit(moduleId, operation)
                }
                onBlur={() => {
                  void controller.flush();
                }}
                readOnly={
                  context.lifecycle ===
                  ApiArtworkDocumentationContextLifecycleEnum.Archived
                }
                assets={assets}
              />
            )}
            <DocumentationFeedback context={context} />
            {(mutationCapabilities(context).manage_assignments ||
              mutationCapabilities(context).manage_context) && (
              <details className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-5">
                <summary className="tw-min-h-11 tw-cursor-pointer tw-py-2 tw-text-sm tw-text-iron-400">
                  {msg("chapters.recordManagement")}
                </summary>
                <div className="tw-mt-5 tw-space-y-6">
                  <DocumentationAccess context={context} />
                  <DocumentationNewContext
                    context={context}
                    controller={controller}
                  />
                  {mutationCapabilities(context).manage_context && (
                    <DocumentationButton
                      secondary
                      onClick={() => {
                        void controller.mutate((current, signal) =>
                          changeDocumentationLifecycle(
                            current,
                            current.lifecycle ===
                              ApiArtworkDocumentationContextLifecycleEnum.Active
                              ? "archived"
                              : "active",
                            signal
                          )
                        );
                      }}
                    >
                      {msg(
                        context.lifecycle ===
                          ApiArtworkDocumentationContextLifecycleEnum.Active
                          ? "archive"
                          : "restore"
                      )}
                    </DocumentationButton>
                  )}
                </div>
              </details>
            )}
          </>
        ) : (
          <>
            {museum && section === "materials" && (
              <DocumentationFilesSection draft={draft} />
            )}
            <DocumentationModules
              key={`${context.id}-${section}`}
              context={context}
              edits={draft.edits}
              section={section}
              excludeFields={
                section === "artwork" || section === "materials"
                  ? FILE_FIELDS
                  : undefined
              }
              onChange={(moduleId, operation) =>
                controller.edit(moduleId, operation)
              }
              onBlur={() => {
                void controller.flush();
              }}
              readOnly={
                context.lifecycle ===
                ApiArtworkDocumentationContextLifecycleEnum.Archived
              }
              assets={assets}
            />
            {!museum && section === "artwork" && (
              <DocumentationFilesSection draft={draft} />
            )}
          </>
        )}
      </div>
    </>
  );
}
function DocumentationFilesSection({ draft }: Pick<Props, "draft">) {
  const { context, controller } = draft;
  const { msg } = useDocumentationMessages();
  const assets = context.assets
    .filter((asset) => asset.state === "ready")
    .map((asset) => ({ id: asset.id, label: asset.filename }));
  return (
    <section
      className="tw-space-y-6 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8"
      aria-labelledby="documentation-files-title"
    >
      <h3
        id="documentation-files-title"
        className="tw-m-0 tw-font-serif tw-text-2xl tw-font-normal"
      >
        {msg("chapters.files")}
      </h3>
      <p className="tw-m-0 tw-max-w-prose tw-text-sm tw-leading-6 tw-text-iron-400">
        {msg("chapters.filesHelp")}
      </p>
      <DocumentationUpload context={context} controller={controller} />
      <DocumentationModules
        context={context}
        edits={draft.edits}
        inlineFields={FILE_FIELDS}
        onChange={(moduleId, operation) => controller.edit(moduleId, operation)}
        onBlur={() => {
          void controller.flush();
        }}
        readOnly={
          context.lifecycle ===
          ApiArtworkDocumentationContextLifecycleEnum.Archived
        }
        assets={assets}
      />
    </section>
  );
}
export function DocumentationReadingChapter({ draft, section }: Props) {
  const { context, controller } = draft;
  const museum = isMuseumRecord(context.profile);
  return section === "review" ? (
    <>
      <DocumentationReview
        context={context}
        controller={controller}
        saveState={draft.state}
      />
      <DocumentationFeedback context={context} />
    </>
  ) : (
    <>
      {section === "artwork" && (
        <DocumentationArtworkPreview
          context={context}
          allowSubmissionReference
        />
      )}
      {museum && section === "materials" && (
        <DocumentationUpload context={context} controller={controller} />
      )}
      <DocumentationSummary
        context={context}
        section={section}
        showHeading={false}
      />
      {section === "artwork" && (
        <>
          <DocumentationSources context={context} controller={controller} />
          {!museum && (
            <DocumentationUpload context={context} controller={controller} />
          )}
        </>
      )}
    </>
  );
}
