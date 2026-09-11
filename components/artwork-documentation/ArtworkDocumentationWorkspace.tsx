"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ApiArtworkDocumentationContextConfirmationStatusEnum,
  ApiArtworkDocumentationContextLifecycleEnum,
} from "@/generated/models/ApiArtworkDocumentationContext";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import { useDocumentationDraft } from "@/hooks/artwork-documentation/useDocumentationDraft";
import { documentationQueryKey } from "@/hooks/artwork-documentation/useArtworkDocumentationAccess";
import {
  changeDocumentationLifecycle,
  documentationWorkspacePath,
  getDocumentationContext,
  getDocumentationRevision,
} from "@/services/api/artwork-documentation-api";
import {
  documentationTitle,
  readAnswer,
} from "@/lib/artwork-documentation/answers";
import { documentationDraftRecord } from "@/lib/artwork-documentation/record";
import {
  canWriteDocumentation,
  mutationCapabilities,
} from "@/lib/artwork-documentation/capabilities";
import {
  parseSection,
  SECTIONS,
  MODULE_FIELDS,
  type DocumentationSection,
} from "@/lib/artwork-documentation/registry";
import { documentationOptionLabel } from "@/i18n/messages/artwork-documentation-fields";
import { formatDate } from "@/i18n/format";
import DocumentationAuthGate, {
  useDocumentationActor,
} from "./DocumentationAuthGate";
import {
  DocumentationButton,
  DocumentationNotice,
  inputClass,
  useDocumentationMessages,
} from "./DocumentationControls";
import DocumentationModules from "./DocumentationModules";
import DocumentationUpload from "./DocumentationUpload";
import DocumentationSaveStatus from "./DocumentationSaveStatus";
import DocumentationReview from "./DocumentationReview";
import DocumentationSummary from "./DocumentationSummary";
import DocumentationFeedback from "./DocumentationFeedback";
import DocumentationAccess from "./DocumentationAccess";
import DocumentationSources from "./DocumentationSources";
import DocumentationArtistPin from "./DocumentationArtistPin";
import DocumentationArtworkPreview from "./DocumentationArtworkPreview";
import DocumentationNewContext from "./DocumentationNewContext";
import DocumentationWorkedExample from "./DocumentationWorkedExample";
import { isPublicationOnly } from "@/lib/artwork-documentation/intake";

const FILE_FIELDS = [
  "artwork.canonical_asset_id",
  "artwork.declared_dimensions",
  ...MODULE_FIELDS.files.map((field) => `files.${field.id}`),
];

interface Props {
  readonly workId: string;
  readonly contextId: string;
  readonly section?: string | undefined;
  readonly revisionId?: string | undefined;
}
export default function ArtworkDocumentationWorkspace(props: Props) {
  return (
    <DocumentationAuthGate>
      <WorkspaceLoader {...props} />
    </DocumentationAuthGate>
  );
}

function WorkspaceLoader(props: Props) {
  const { msg } = useDocumentationMessages();
  const { connectedProfile, actorKey } = useDocumentationActor();
  const query = useQuery({
    queryKey: documentationQueryKey(
      connectedProfile?.id,
      props.contextId,
      "context",
      actorKey
    ),
    queryFn: ({ signal }) => getDocumentationContext(props.contextId, signal),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
    gcTime: 0,
    meta: { persist: false },
  });
  if (query.isLoading)
    return <DocumentationNotice>{msg("loading")}</DocumentationNotice>;
  if (!query.data || query.isError || query.data.work_id !== props.workId)
    return (
      <DocumentationNotice error>
        <p>{msg("unavailable")}</p>
        <DocumentationButton
          secondary
          onClick={() => {
            void query.refetch();
          }}
        >
          {msg("retry")}
        </DocumentationButton>
      </DocumentationNotice>
    );
  if (props.revisionId)
    return (
      <HistoricalDocumentation
        context={query.data}
        revisionId={props.revisionId}
      />
    );
  return (
    <WorkspaceEditor
      initial={query.data}
      initialSection={parseSection(props.section)}
    />
  );
}

function WorkspaceEditor({
  initial,
  initialSection,
}: {
  readonly initial: ApiArtworkDocumentationContext;
  readonly initialSection: DocumentationSection;
}) {
  const { msg, locale } = useDocumentationMessages();
  const router = useRouter();
  const draft = useDocumentationDraft(initial);
  const { context, controller } = draft;
  const draftRecord = documentationDraftRecord(context, draft.edits);
  const canWrite = canWriteDocumentation(mutationCapabilities(context));
  const listPath = context.program_id
    ? `/artwork-documentation/programs/${encodeURIComponent(context.program_id)}`
    : "/artwork-documentation";
  const viewOnlyBackLabel = context.program_id ? "backToResults" : "backToList";
  const backLabel =
    context.program_id || !canWrite ? viewOnlyBackLabel : "back";
  const publicationOnly = isPublicationOnly(context.profile);
  const [section, setSection] = useState(initialSection);
  const [reading, setReading] = useState(false);
  const credit: unknown = readAnswer(
    draftRecord,
    "identity",
    "preferred_credit"
  )?.value;
  const counts = Object.values(context.modules).reduce(
    (total, module) => ({
      required: total.required + module.completeness.required,
      addressed: total.addressed + module.completeness.addressed,
    }),
    { required: 0, addressed: 0 }
  );
  const assets = context.assets
    .filter((asset) => asset.state === "ready")
    .map((asset) => ({ id: asset.id, label: asset.filename }));
  const focusHeading = (id: string) => {
    requestAnimationFrame(() => document.getElementById(id)?.focus());
  };
  const navigateSection = (next: DocumentationSection) => {
    setSection(next);
    setReading(false);
    const url = new URL(globalThis.location.href);
    url.searchParams.set("section", next);
    globalThis.history.replaceState(null, "", url);
    focusHeading("documentation-chapter-title");
  };
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (
        target &&
        controller.snapshot().dirty &&
        // Cancel captured navigation before unsaved edits are lost.
        !globalThis.confirm(msg("leave"))
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [controller, msg]);
  const saveExit = async () => {
    if (await controller.flush()) router.push(listPath);
  };
  const showWriting = () => {
    setReading(false);
    focusHeading("documentation-chapter-title");
  };
  const writingChapter = (
    <>
      {section === "artwork" && (
        <DocumentationArtworkPreview
          context={draftRecord}
          allowSubmissionReference
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
        {section === "artist" && (
          <DocumentationArtistPin context={context} controller={controller} />
        )}
        {section === "rights" && (
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
            <DocumentationModules
              key={`${context.id}-${section}`}
              context={context}
              edits={draft.edits}
              section={section}
              excludeFields={section === "artwork" ? FILE_FIELDS : undefined}
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
            {section === "artwork" && (
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
                <DocumentationUpload
                  context={context}
                  controller={controller}
                />
                <DocumentationModules
                  context={context}
                  edits={draft.edits}
                  inlineFields={FILE_FIELDS}
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
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
  const readingChapter =
    section === "review" ? (
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
        <DocumentationSummary
          context={context}
          section={section}
          showHeading={false}
        />
        {section === "artwork" && (
          <>
            <DocumentationSources context={context} controller={controller} />
            <DocumentationUpload context={context} controller={controller} />
          </>
        )}
      </>
    );
  return (
    <div className="tw-space-y-10 sm:tw-space-y-14">
      <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-4">
        <Link
          href={listPath}
          className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-text-iron-400 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          ← {msg(backLabel)}
        </Link>
        {canWrite && (
          <DocumentationSaveStatus snapshot={draft} controller={controller} />
        )}
      </div>
      <header className="tw-space-y-6">
        <div className="tw-max-w-3xl">
          <p className="tw-mb-4 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.16em] tw-text-iron-400">
            {documentationOptionLabel(
              context.program_id ?? context.profile.profile_id
            )}
          </p>
          <h1 className="tw-m-0 tw-break-words tw-font-serif tw-text-4xl tw-font-normal tw-leading-[1.08] tw-tracking-tight sm:tw-text-6xl">
            {documentationTitle(draftRecord) ??
              msg(canWrite && !reading ? "chapters.beginRecord" : "untitled")}
          </h1>
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
                {msg("chapters.welcome")}
              </p>
              <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-400">
                {msg(
                  publicationOnly
                    ? "chapters.publication"
                    : "publication.legacy"
                )}
              </p>
              <details className="tw-text-sm tw-leading-6 tw-text-iron-400">
                <summary className="tw-min-h-11 tw-cursor-pointer tw-py-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
                  {msg("chapters.aboutRecord")}
                </summary>
                <div className="tw-space-y-3 tw-pb-3">
                  <p className="tw-m-0">
                    {context.program_id === "6529NM-AP-01"
                      ? msg("keysHelp")
                      : msg("description")}
                  </p>
                  <p className="tw-m-0">
                    {msg(publicationOnly ? "publication.draft" : "privacy")}
                  </p>
                </div>
              </details>
            </div>
            <DocumentationButton
              secondary
              onClick={() => {
                if (reading) showWriting();
                else {
                  setReading(true);
                  focusHeading("documentation-reading-title");
                }
              }}
            >
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
      {context.confirmation_status ===
        ApiArtworkDocumentationContextConfirmationStatusEnum.NewerDraft && (
        <DocumentationNotice>{msg("newerDraft")}</DocumentationNotice>
      )}
      {reading ? (
        <section
          aria-labelledby="documentation-reading-title"
          className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-10"
        >
          <h2
            id="documentation-reading-title"
            tabIndex={-1}
            className="tw-mb-4 tw-font-serif tw-text-3xl tw-font-normal focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            {msg("chapters.draftReading")}
          </h2>
          <p className="tw-mb-10 tw-max-w-prose tw-text-sm tw-leading-6 tw-text-iron-400">
            {msg(
              draft.dirty
                ? "editorial.unsavedRecordPreview"
                : "editorial.savedRecordPreview"
            )}
          </p>
          <DocumentationSummary
            context={draftRecord}
            media={<DocumentationArtworkPreview context={draftRecord} />}
          />
          <div className="tw-mt-10">
            <DocumentationButton secondary onClick={showWriting}>
              {msg("chapters.returnToWriting")}
            </DocumentationButton>
          </div>
        </section>
      ) : (
        <div className="tw-grid tw-gap-8 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8 lg:tw-grid-cols-[200px_minmax(0,1fr)] lg:tw-gap-12 lg:tw-pt-12">
          <aside className="lg:tw-sticky lg:tw-top-24 lg:tw-self-start">
            <nav
              aria-label={msg("chapters.index")}
              className="tw-hidden lg:tw-block"
            >
              <ol className="tw-m-0 tw-list-none tw-space-y-1 tw-p-0">
                {SECTIONS.map((item, index) => (
                  <li key={item}>
                    <button
                      type="button"
                      aria-current={section === item ? "step" : undefined}
                      className={`tw-flex tw-min-h-11 tw-w-full tw-items-baseline tw-gap-3 tw-border-0 tw-bg-transparent tw-py-3 tw-text-left tw-text-sm tw-leading-6 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 ${section === item ? "tw-font-semibold tw-text-white" : "tw-text-iron-400 hover:tw-text-white"}`}
                      onClick={() => navigateSection(item)}
                    >
                      <span
                        aria-hidden="true"
                        className="tw-w-5 tw-shrink-0 tw-text-xs tw-tabular-nums tw-text-iron-500"
                      >
                        {new Intl.NumberFormat(locale, {
                          minimumIntegerDigits: 2,
                        }).format(index + 1)}
                      </span>
                      {msg(`chapters.${item}`)}
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
            <label className="tw-block tw-text-sm tw-text-iron-400 lg:tw-hidden">
              {msg("chapters.index")}
              <select
                className={`${inputClass} tw-mt-2`}
                value={section}
                onChange={(event) =>
                  navigateSection(parseSection(event.target.value))
                }
              >
                {SECTIONS.map((item) => (
                  <option key={item} value={item}>
                    {msg(`chapters.${item}`)}
                  </option>
                ))}
              </select>
            </label>
            {canWrite && (
              <p className="tw-mb-0 tw-mt-5 tw-text-xs tw-leading-5 tw-text-iron-400">
                {msg("progress", counts)}
              </p>
            )}
          </aside>
          <div className="tw-min-w-0 tw-space-y-10">
            <div className="tw-max-w-prose">
              <p className="tw-mb-3 tw-text-xs tw-uppercase tw-tracking-widest tw-text-iron-400">
                {msg("chapters.number", {
                  number: new Intl.NumberFormat(locale).format(
                    SECTIONS.indexOf(section) + 1
                  ),
                })}
              </p>
              <h2
                id="documentation-chapter-title"
                tabIndex={-1}
                className="tw-m-0 tw-font-serif tw-text-4xl tw-font-normal tw-leading-tight focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
              >
                {msg(`chapters.${section}`)}
              </h2>
              {canWrite && (
                <p className="tw-mb-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-300">
                  {msg(`chapters.purpose.${section}`)}
                </p>
              )}
            </div>
            {canWrite ? writingChapter : readingChapter}
            <div className="tw-flex tw-flex-wrap tw-justify-between tw-gap-3 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-6">
              <DocumentationButton
                secondary
                onClick={() => {
                  if (canWrite) void saveExit();
                  else router.push(listPath);
                }}
              >
                {msg(canWrite ? "saveExit" : backLabel)}
              </DocumentationButton>
              {section !== "review" && (
                <DocumentationButton
                  onClick={() =>
                    navigateSection(
                      SECTIONS[SECTIONS.indexOf(section) + 1] ?? "review"
                    )
                  }
                >
                  {msg("chapters.nextChapter", {
                    chapter: msg(
                      `chapters.${SECTIONS[SECTIONS.indexOf(section) + 1] ?? "review"}`
                    ),
                  })}
                </DocumentationButton>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoricalDocumentation({
  context,
  revisionId,
}: {
  readonly context: ApiArtworkDocumentationContext;
  readonly revisionId: string;
}) {
  const { msg, locale } = useDocumentationMessages();
  const { actorKey, connectedProfile } = useDocumentationActor();
  const query = useQuery({
    queryKey: documentationQueryKey(
      connectedProfile?.id,
      context.id,
      "revision",
      revisionId,
      actorKey
    ),
    queryFn: ({ signal }) =>
      getDocumentationRevision(context.id, revisionId, signal),
    retry: false,
    gcTime: 0,
    meta: { persist: false },
  });
  if (!query.data)
    return (
      <DocumentationNotice error={query.isError}>
        {msg(query.isError ? "unavailable" : "loading")}
      </DocumentationNotice>
    );
  const revision = query.data;
  const historical = {
    ...context,
    modules: revision.snapshot.modules,
    profile: revision.snapshot.profile,
    asset_links: revision.snapshot.asset_links,
  };
  return (
    <article className="tw-space-y-10 sm:tw-space-y-14">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-4">
        <Link
          href={documentationWorkspacePath(context.work_id, context.id)}
          className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-text-iron-400 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          ← {msg("currentDraft")}
        </Link>
        <p className="tw-m-0 tw-text-xs tw-leading-6 tw-text-iron-400">
          {msg("revision", {
            number: new Intl.NumberFormat(locale).format(
              revision.revision_number
            ),
          })}{" "}
          · {formatDate(locale, revision.created_at)}
        </p>
      </div>
      <DocumentationSummary
        context={historical}
        headingLevel={1}
        media={<DocumentationArtworkPreview context={historical} />}
      />
      <section
        className="tw-space-y-6 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8"
        aria-labelledby="documentation-confirmed-title"
      >
        <h2
          id="documentation-confirmed-title"
          className="tw-m-0 tw-font-serif tw-text-2xl tw-font-normal"
        >
          {msg("snapshot")}
        </h2>
        <p className="tw-m-0 tw-max-w-prose tw-whitespace-pre-wrap tw-text-base tw-leading-7 tw-text-iron-300">
          {revision.confirmation.accepted_copy}
        </p>
        <details className="tw-text-sm tw-text-iron-400">
          <summary className="tw-min-h-11 tw-cursor-pointer tw-py-2 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
            {msg("chapters.revisionDetails")}
          </summary>
          <p className="tw-mt-3 tw-break-all tw-text-xs">
            SHA-256: {revision.sha256}
          </p>
        </details>
      </section>
      {revision.reviews.length > 0 && (
        <section
          className="tw-grid tw-gap-6 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8 sm:tw-grid-cols-3"
          aria-label={msg("reviewScope")}
        >
          {revision.reviews.map((review) => (
            <div key={review.lane}>
              <h2 className="tw-mb-2 tw-mt-0 tw-text-sm tw-font-medium tw-text-iron-400">
                {msg(`lane.${review.lane}`)}
              </h2>
              <p className="tw-m-0 tw-text-base tw-leading-7 tw-text-iron-200">
                {msg(`review.${review.status}`)}
              </p>
              {review.reason && (
                <p className="tw-mb-0 tw-mt-3 tw-whitespace-pre-wrap tw-text-sm tw-leading-6 tw-text-iron-300">
                  {review.reason}
                </p>
              )}
            </div>
          ))}
        </section>
      )}
    </article>
  );
}
