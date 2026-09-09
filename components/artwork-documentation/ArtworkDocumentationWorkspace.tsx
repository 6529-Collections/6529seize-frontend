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
import { documentationTitle } from "@/lib/artwork-documentation/answers";
import {
  parseSection,
  SECTIONS,
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
  panelClass,
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
  const [section, setSection] = useState(initialSection);
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
  const navigateSection = (next: DocumentationSection) => {
    setSection(next);
    const url = new URL(globalThis.location.href);
    url.searchParams.set("section", next);
    globalThis.history.replaceState(null, "", url);
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
        // This synchronous native prompt must cancel captured link navigation before private unsaved edits are lost.
        // eslint-disable-next-line no-alert
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
    if (await controller.flush()) router.push("/artwork-documentation");
  };
  return (
    <div className="tw-space-y-6">
      <Link
        href="/artwork-documentation"
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-text-iron-300 hover:tw-text-white"
      >
        ← {msg("back")}
      </Link>
      <header>
        <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-widest tw-text-iron-400">
          {documentationOptionLabel(
            context.program_id ?? context.profile.profile_id
          )}
        </p>
        <h1 className="tw-m-0 tw-break-words tw-text-3xl tw-font-semibold tw-tracking-tight sm:tw-text-4xl">
          {documentationTitle(context) ?? msg("untitled")}
        </h1>
        <p className="tw-mt-3 tw-text-sm tw-text-iron-400">
          {msg("savedAt", { date: formatDate(locale, context.updated_at) })} ·{" "}
          {documentationOptionLabel(context.confirmation_status)}
        </p>
      </header>
      <DocumentationSaveStatus snapshot={draft} controller={controller} />
      {context.confirmation_status ===
        ApiArtworkDocumentationContextConfirmationStatusEnum.NewerDraft && (
        <DocumentationNotice>{msg("newerDraft")}</DocumentationNotice>
      )}
      <details className="tw-rounded-lg tw-bg-iron-900 tw-p-4">
        <summary className="tw-cursor-pointer tw-text-sm tw-font-medium">
          {context.program_id === "6529NM-AP-01"
            ? msg("keysTitle")
            : msg("intro")}
        </summary>
        <p className="tw-mt-3 tw-text-sm tw-leading-relaxed tw-text-iron-300">
          {context.program_id === "6529NM-AP-01"
            ? msg("keysHelp")
            : msg("description")}
        </p>
        <p className="tw-m-0 tw-text-xs tw-leading-relaxed tw-text-iron-400">
          {msg("privacy")}
        </p>
      </details>
      <DocumentationSources context={context} controller={controller} />
      <div className="tw-grid tw-gap-6 lg:tw-grid-cols-[220px_minmax(0,1fr)]">
        <aside>
          <nav
            aria-label={msg("section")}
            className="tw-hidden tw-space-y-1 lg:tw-block"
          >
            {SECTIONS.map((item) => (
              <button
                key={item}
                type="button"
                aria-current={section === item ? "step" : undefined}
                className={`tw-w-full tw-rounded-lg tw-border-0 tw-px-3 tw-py-3 tw-text-left tw-text-sm tw-font-medium focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 ${section === item ? "tw-bg-iron-800 tw-text-white" : "tw-bg-transparent tw-text-iron-400 hover:tw-bg-iron-900 hover:tw-text-white"}`}
                onClick={() => navigateSection(item)}
              >
                {msg(`section.${item}`)}
              </button>
            ))}
          </nav>
          <label className="tw-block tw-text-sm tw-text-iron-300 lg:tw-hidden">
            {msg("section")}
            <select
              className={`${inputClass} tw-mt-2`}
              value={section}
              onChange={(event) =>
                navigateSection(parseSection(event.target.value))
              }
            >
              {SECTIONS.map((item) => (
                <option key={item} value={item}>
                  {msg(`section.${item}`)}
                </option>
              ))}
            </select>
          </label>
          <p className="tw-mt-4 tw-text-xs tw-leading-relaxed tw-text-iron-400">
            {msg("progress", counts)}
          </p>
        </aside>
        <div className="tw-min-w-0 tw-space-y-5">
          <div>
            <h2 className="tw-m-0 tw-text-xl tw-font-semibold">
              {msg(`section.${section}`)}
            </h2>
            <p className="tw-mt-2 tw-text-sm tw-leading-relaxed tw-text-iron-300">
              {msg(`intro.${section}`)}
            </p>
            <details className="tw-text-sm tw-text-iron-400">
              <summary className="tw-cursor-pointer tw-py-2">
                {msg("why")}
              </summary>
              <p className="tw-mt-2 tw-leading-relaxed">
                {msg(`why.${section}`)}
              </p>
            </details>
          </div>
          {section === "artwork" && (
            <>
              <DocumentationArtworkPreview context={context} />
              <DocumentationUpload context={context} controller={controller} />
            </>
          )}
          {section === "artist" && (
            <DocumentationArtistPin context={context} controller={controller} />
          )}
          {section === "rights" && (
            <DocumentationNotice>
              {msg("cc0")}{" "}
              <a
                href="https://creativecommons.org/publicdomain/zero/1.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="tw-text-primary-300"
              >
                {msg("cc0Link")}
              </a>
            </DocumentationNotice>
          )}
          {section === "preservation" && (
            <DocumentationNotice>{msg("interviewHelp")}</DocumentationNotice>
          )}
          {section === "review" ? (
            <>
              <DocumentationReview
                context={context}
                controller={controller}
                saveState={draft.state}
              />
              <DocumentationFeedback context={context} />
              <DocumentationAccess context={context} />
              <DocumentationNewContext
                context={context}
                controller={controller}
              />
            </>
          ) : (
            <DocumentationModules
              context={context}
              edits={draft.edits}
              section={section}
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
          <div className="tw-flex tw-flex-wrap tw-justify-between tw-gap-3 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-5">
            <DocumentationButton
              secondary
              onClick={() => {
                void saveExit();
              }}
            >
              {msg("saveExit")}
            </DocumentationButton>
            {section !== "review" && (
              <DocumentationButton
                onClick={() =>
                  navigateSection(
                    SECTIONS[SECTIONS.indexOf(section) + 1] ?? "review"
                  )
                }
              >
                {msg("next")}
              </DocumentationButton>
            )}
          </div>
          {context.capabilities.manage_context && (
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
              {context.lifecycle ===
              ApiArtworkDocumentationContextLifecycleEnum.Active
                ? msg("archive")
                : msg("restore")}
            </DocumentationButton>
          )}
        </div>
      </div>
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
    <div className="tw-space-y-5">
      <DocumentationNotice>
        {msg("snapshot")} ·{" "}
        {msg("revision", { number: revision.revision_number })} ·{" "}
        {formatDate(locale, revision.created_at)}
      </DocumentationNotice>
      <Link
        href={documentationWorkspacePath(context.work_id, context.id)}
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-text-primary-300"
      >
        {msg("currentDraft")}
      </Link>
      <h1 className="tw-break-words tw-text-3xl tw-font-semibold">
        {documentationTitle(historical) ?? msg("untitled")}
      </h1>
      <DocumentationSummary context={historical} />
      <section className="tw-space-y-3" aria-label={msg("reviewScope")}>
        {revision.reviews.map((review) => (
          <div key={review.lane} className={panelClass}>
            <h2 className="tw-text-base tw-font-semibold">
              {msg(`lane.${review.lane}`)}
            </h2>
            <p className="tw-text-sm tw-text-iron-300">
              {msg(`review.${review.status}`)}
            </p>
            {review.reason && (
              <p className="tw-whitespace-pre-wrap tw-text-sm tw-text-iron-300">
                {review.reason}
              </p>
            )}
          </div>
        ))}
      </section>
      <p className="tw-text-sm tw-leading-relaxed tw-text-iron-300">
        {revision.confirmation.accepted_copy}
      </p>
      <details className="tw-text-xs tw-text-iron-400">
        <summary className="tw-cursor-pointer tw-py-2">
          {msg("fileDetails")}
        </summary>
        <p className="tw-break-all">SHA-256: {revision.sha256}</p>
      </details>
    </div>
  );
}
