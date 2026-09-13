"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ApiArtworkDocumentationContextConfirmationStatusEnum } from "@/generated/models/ApiArtworkDocumentationContext";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import { useDocumentationDraft } from "@/hooks/artwork-documentation/useDocumentationDraft";
import { documentationQueryKey } from "@/hooks/artwork-documentation/useArtworkDocumentationAccess";
import {
  documentationWorkspacePath,
  getDocumentationContext,
  getDocumentationRevision,
} from "@/services/api/artwork-documentation-api";
import { documentationDraftRecord } from "@/lib/artwork-documentation/record";
import {
  canWriteDocumentation,
  mutationCapabilities,
} from "@/lib/artwork-documentation/capabilities";
import {
  parseSection,
  type DocumentationSection,
} from "@/lib/artwork-documentation/registry";
import {
  documentationChapterKey,
  documentationSections,
  isMuseumRecord,
} from "@/lib/artwork-documentation/catalogue";
import { formatDate, formatNumber } from "@/i18n/format";
import DocumentationAuthGate, {
  useDocumentationActor,
} from "./DocumentationAuthGate";
import {
  DocumentationButton,
  DocumentationNotice,
  inputClass,
  useDocumentationMessages,
} from "./DocumentationControls";
import DocumentationSaveStatus from "./DocumentationSaveStatus";
import DocumentationSummary from "./DocumentationSummary";
import DocumentationArtworkPreview from "./DocumentationArtworkPreview";
import {
  DocumentationWritingChapter,
  DocumentationReadingChapter,
} from "./DocumentationRecordChapters";
import DocumentationDossier from "./DocumentationDossier";
import DocumentationMuseumJournal from "./DocumentationMuseumJournal";
import DocumentationRecordHeader from "./DocumentationRecordHeader";

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
  const draft = useDocumentationDraft(initial);
  return (
    <ArtworkDocumentationRecordView
      draft={draft}
      initialSection={initialSection}
    />
  );
}

export function ArtworkDocumentationRecordView({
  draft,
  initialSection = "artwork",
  embedded = false,
  onExit,
}: {
  readonly draft: ReturnType<typeof useDocumentationDraft>;
  readonly initialSection?: DocumentationSection;
  readonly embedded?: boolean;
  readonly onExit?: (() => void) | undefined;
}) {
  const { msg, locale } = useDocumentationMessages();
  const router = useRouter();
  const { context, controller } = draft;
  const sections = documentationSections(context.profile);
  const museum = isMuseumRecord(context.profile);
  const draftRecord = documentationDraftRecord(context, draft.edits);
  const canWrite = canWriteDocumentation(mutationCapabilities(context));
  const listPath = context.program_id
    ? `/artwork-documentation/programs/${encodeURIComponent(context.program_id)}`
    : "/artwork-documentation";
  const viewOnlyBackLabel = context.program_id ? "backToResults" : "backToList";
  const backLabel =
    context.program_id || !canWrite ? viewOnlyBackLabel : "back";
  const [section, setSection] = useState(
    sections.includes(initialSection) ? initialSection : "artwork"
  );
  const [reading, setReading] = useState(false);
  const counts = Object.values(context.modules).reduce(
    (total, module) => ({
      required: total.required + module.completeness.required,
      addressed: total.addressed + module.completeness.addressed,
    }),
    { required: 0, addressed: 0 }
  );
  const focusHeading = (id: string) => {
    requestAnimationFrame(() => document.getElementById(id)?.focus());
  };
  const navigateSection = (next: DocumentationSection) => {
    setSection(next);
    setReading(false);
    if (!embedded) {
      const url = new URL(globalThis.location.href);
      url.searchParams.set("section", next);
      globalThis.history.replaceState(null, "", url);
    }
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
        target.getAttribute("target") !== "_blank" &&
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
    if (await controller.flush()) {
      if (onExit) onExit();
      else if (!embedded) router.push(listPath);
    }
  };
  const showWriting = () => {
    setReading(false);
    focusHeading("documentation-chapter-title");
  };
  return (
    <div className="tw-space-y-10 sm:tw-space-y-14">
      <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-4">
        {!embedded && (
          <Link
            href={listPath}
            className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-text-iron-400 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            ← {msg(backLabel)}
          </Link>
        )}
        {canWrite && (
          <DocumentationSaveStatus snapshot={draft} controller={controller} />
        )}
      </div>
      <DocumentationRecordHeader
        context={context}
        draftRecord={draftRecord}
        canWrite={canWrite}
        reading={reading}
        headingLevel={embedded ? 2 : 1}
        onToggleReading={() => {
          if (reading) showWriting();
          else {
            setReading(true);
            focusHeading("documentation-reading-title");
          }
        }}
      />
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
                {sections.map((item, index) => (
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
                        {formatNumber(locale, index + 1, {
                          minimumIntegerDigits: 2,
                        })}
                      </span>
                      {msg(documentationChapterKey(context.profile, item))}
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
                {sections.map((item) => (
                  <option key={item} value={item}>
                    {msg(documentationChapterKey(context.profile, item))}
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
                  number: formatNumber(locale, sections.indexOf(section) + 1),
                })}
              </p>
              <h2
                id="documentation-chapter-title"
                tabIndex={-1}
                className="tw-m-0 tw-font-serif tw-text-4xl tw-font-normal tw-leading-tight focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
              >
                {msg(documentationChapterKey(context.profile, section))}
              </h2>
              {canWrite && (
                <p className="tw-mb-0 tw-mt-4 tw-text-base tw-leading-7 tw-text-iron-300">
                  {msg(
                    `${museum ? "museum.purpose" : "chapters.purpose"}.${section}`
                  )}
                </p>
              )}
            </div>
            {canWrite ? (
              <DocumentationWritingChapter
                draft={draft}
                section={section}
                onNavigateSection={navigateSection}
              />
            ) : (
              <DocumentationReadingChapter
                draft={draft}
                section={section}
                onNavigateSection={navigateSection}
              />
            )}
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
                      sections[sections.indexOf(section) + 1] ?? "review"
                    )
                  }
                >
                  {msg("chapters.nextChapter", {
                    chapter: msg(
                      documentationChapterKey(
                        context.profile,
                        sections[sections.indexOf(section) + 1] ?? "review"
                      )
                    ),
                  })}
                </DocumentationButton>
              )}
            </div>
          </div>
        </div>
      )}
      {museum && (
        <div hidden={section !== "review" || reading} className="tw-space-y-10">
          <DocumentationDossier
            context={context}
            controller={controller}
            active={section === "review"}
          />
          <DocumentationMuseumJournal
            context={context}
            controller={controller}
            active={section === "review" && !reading}
          />
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
            number: formatNumber(locale, revision.revision_number),
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
