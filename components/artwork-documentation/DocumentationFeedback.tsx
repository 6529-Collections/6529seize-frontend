"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import type { ApiArtworkDocumentationThread } from "@/generated/models/ApiArtworkDocumentationThread";
import { documentationQueryKey } from "@/hooks/artwork-documentation/useArtworkDocumentationAccess";
import {
  commentDocumentationThread,
  createDocumentationThread,
  getDocumentationThreads,
  resolveDocumentationThread,
} from "@/services/api/artwork-documentation-api";
import { documentationOptionLabel } from "@/i18n/messages/artwork-documentation-fields";
import { formatDate } from "@/i18n/format";
import { getIdentityQueryOptions } from "@/services/api/identity-query";
import { isPublicationOnly } from "@/lib/artwork-documentation/intake";
import {
  canWriteDocumentation,
  canParticipateInDocumentationThread,
  mutationCapabilities,
} from "@/lib/artwork-documentation/capabilities";
import {
  ApiArtworkDocumentationThreadAudienceEnum,
  ApiArtworkDocumentationThreadRestrictedClassEnum,
} from "@/generated/models/ApiArtworkDocumentationThread";
import { useDocumentationActor } from "./DocumentationAuthGate";
import {
  DocumentationButton,
  DocumentationNotice,
  inputClass,
  useDocumentationMessages,
} from "./DocumentationControls";

export default function DocumentationFeedback({
  context,
}: {
  readonly context: ApiArtworkDocumentationContext;
}) {
  const { msg } = useDocumentationMessages();
  const questions = isPublicationOnly(context.profile);
  const canParticipate = canWriteDocumentation(mutationCapabilities(context));
  const { connectedProfile, actorKey } = useDocumentationActor();
  const [text, setText] = useState("");
  const [audience, setAudience] = useState("artist_and_reviewers");
  const [restrictedClass, setRestrictedClass] = useState("ordinary");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const canCreate = canParticipateInDocumentationThread(context, {
    audience: questions ? "artist_and_reviewers" : audience,
    restricted_class: questions ? "ordinary" : restrictedClass,
  });
  const query = useQuery({
    queryKey: documentationQueryKey(
      connectedProfile?.id,
      context.id,
      "threads",
      actorKey
    ),
    queryFn: ({ signal }) => getDocumentationThreads(context.id, signal),
    retry: false,
    gcTime: 0,
    meta: { persist: false },
  });
  const create = async () => {
    if (!canCreate) return;
    setBusy(true);
    setError(false);
    try {
      await createDocumentationThread(context.id, {
        text,
        audience: questions ? "artist_and_reviewers" : audience,
        restricted_class: questions ? "ordinary" : restrictedClass,
        ...(!questions && context.latest_revision_id
          ? { revision_id: context.latest_revision_id }
          : {}),
      });
      setText("");
      await query.refetch();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  const threads =
    query.data?.data.filter(
      (thread) =>
        !questions ||
        (!thread.field_path &&
          !thread.revision_id &&
          thread.audience ===
            ApiArtworkDocumentationThreadAudienceEnum.ArtistAndReviewers &&
          thread.restricted_class ===
            ApiArtworkDocumentationThreadRestrictedClassEnum.Ordinary)
    ) ?? [];
  return (
    <section className="tw-min-w-0 tw-space-y-6 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8">
      <h3 className="tw-m-0 tw-font-serif tw-text-3xl tw-font-normal">
        {msg(questions ? "questions.title" : "feedback")}
      </h3>
      {questions && (
        <p className="tw-text-sm tw-leading-relaxed tw-text-iron-300">
          {msg("chapters.questionsHelp")}
        </p>
      )}
      {(error || query.isError) && (
        <DocumentationNotice error>{msg("error")}</DocumentationNotice>
      )}
      {threads.map((thread) => (
        <FeedbackThread
          key={thread.id}
          contextId={context.id}
          thread={thread}
          canParticipate={canParticipateInDocumentationThread(context, thread)}
          refresh={() => {
            void query.refetch();
          }}
        />
      ))}
      {!query.isLoading && threads.length === 0 && (
        <p className="tw-text-sm tw-text-iron-400">
          {msg(questions ? "questions.empty" : "noFeedback")}
        </p>
      )}
      {canParticipate && (
        <>
          <label className="tw-block tw-text-sm tw-text-iron-300">
            {msg(questions ? "questions.label" : "comment")}
            <textarea
              rows={3}
              className={`${inputClass} tw-mt-2`}
              value={text}
              disabled={busy}
              aria-describedby={
                questions ? "documentation-question-help" : undefined
              }
              onChange={(event) => setText(event.target.value)}
            />
          </label>
          {questions && (
            <p
              id="documentation-question-help"
              className="tw-text-sm tw-leading-relaxed tw-text-iron-400"
            >
              {msg("questions.hint")}
            </p>
          )}
          {!questions && (
            <label className="tw-block tw-text-sm tw-text-iron-300">
              {msg("audience")}
              <select
                className={`${inputClass} tw-mt-2`}
                value={audience}
                onChange={(event) => setAudience(event.target.value)}
              >
                <option value="artist_and_reviewers">
                  {msg("artistReviewers")}
                </option>
                {canParticipateInDocumentationThread(context, {
                  audience: "reviewers_only",
                  restricted_class: "ordinary",
                }) && (
                  <option value="reviewers_only">{msg("reviewersOnly")}</option>
                )}
              </select>
            </label>
          )}
          {!questions && mutationCapabilities(context).read_rights_evidence && (
            <label className="tw-block tw-text-sm tw-text-iron-300">
              {msg("visibility")}
              <select
                className={`${inputClass} tw-mt-2`}
                value={restrictedClass}
                onChange={(event) => setRestrictedClass(event.target.value)}
              >
                <option value="ordinary">{msg("artistReviewers")}</option>
                <option value="rights">{msg("lane.rights")}</option>
              </select>
            </label>
          )}
          <DocumentationButton
            disabled={
              !canCreate ||
              busy ||
              !text.trim() ||
              Array.from(text).length > 4000
            }
            onClick={() => {
              void create();
            }}
          >
            {msg(questions ? "questions.send" : "sendComment")}
          </DocumentationButton>
        </>
      )}
    </section>
  );
}

function FeedbackThread({
  contextId,
  thread,
  canParticipate,
  refresh,
}: {
  readonly contextId: string;
  readonly thread: ApiArtworkDocumentationThread;
  readonly canParticipate: boolean;
  readonly refresh: () => void;
}) {
  const { msg, locale } = useDocumentationMessages();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const action = async (
    operation: () => Promise<unknown>,
    clearDraft = false
  ) => {
    if (!canParticipate) return;
    const submittedText = text;
    setBusy(true);
    setError(false);
    try {
      await operation();
      if (clearDraft)
        setText((current) => (current === submittedText ? "" : current));
      refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="tw-space-y-4 tw-border-0 tw-border-l tw-border-solid tw-border-iron-700 tw-pl-5">
      <p className="tw-m-0 tw-text-xs tw-text-iron-400">
        {documentationOptionLabel(thread.audience)} ·{" "}
        {thread.resolved ? msg("resolved") : msg("feedback")}
      </p>
      {thread.comments.map((comment) => (
        <div key={comment.id}>
          <p className="tw-m-0 tw-whitespace-pre-wrap tw-break-words tw-text-base tw-leading-7 tw-text-iron-200">
            {comment.text}
          </p>
          <p className="tw-mt-1 tw-text-xs tw-text-iron-400">
            <CommentAuthor profileId={comment.actor_profile_id} /> ·{" "}
            {formatDate(locale, comment.created_at)}
          </p>
        </div>
      ))}
      {error && <DocumentationNotice error>{msg("error")}</DocumentationNotice>}
      {canParticipate && (
        <>
          <label className="tw-block tw-text-sm tw-text-iron-300">
            {msg("comment")}
            <textarea
              rows={2}
              className={`${inputClass} tw-mt-2`}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </label>
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            <DocumentationButton
              secondary
              disabled={busy || !text.trim() || Array.from(text).length > 4000}
              onClick={() => {
                void action(
                  () => commentDocumentationThread(contextId, thread.id, text),
                  true
                );
              }}
            >
              {msg("sendComment")}
            </DocumentationButton>
            <DocumentationButton
              secondary
              disabled={busy}
              onClick={() => {
                void action(() =>
                  resolveDocumentationThread(
                    contextId,
                    thread.id,
                    thread.thread_version,
                    !thread.resolved
                  )
                );
              }}
            >
              {thread.resolved ? msg("reopen") : msg("resolve")}
            </DocumentationButton>
          </div>
        </>
      )}
    </div>
  );
}

function CommentAuthor({ profileId }: { readonly profileId: string }) {
  const { msg } = useDocumentationMessages();
  const profile = useQuery({
    ...getIdentityQueryOptions({ handleOrWallet: profileId }),
    retry: false,
    staleTime: 60_000,
  });
  return (
    <span>
      {profile.data?.handle ? `@${profile.data.handle}` : msg("participant")}
    </span>
  );
}
