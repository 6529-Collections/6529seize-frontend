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
import { isPublicationOnly } from "@/lib/artwork-documentation/intake";
import {
  ApiArtworkDocumentationThreadAudienceEnum,
  ApiArtworkDocumentationThreadRestrictedClassEnum,
} from "@/generated/models/ApiArtworkDocumentationThread";
import { useDocumentationActor } from "./DocumentationAuthGate";
import {
  DocumentationButton,
  DocumentationNotice,
  inputClass,
  panelClass,
  useDocumentationMessages,
} from "./DocumentationControls";

export default function DocumentationFeedback({
  context,
}: {
  readonly context: ApiArtworkDocumentationContext;
}) {
  const { msg } = useDocumentationMessages();
  const questions = isPublicationOnly(context.profile);
  const { connectedProfile, actorKey } = useDocumentationActor();
  const [text, setText] = useState("");
  const [audience, setAudience] = useState("artist_and_reviewers");
  const [restrictedClass, setRestrictedClass] = useState("ordinary");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
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
    <section className={`${panelClass} tw-space-y-4`}>
      <h3 className="tw-m-0 tw-text-lg tw-font-semibold">
        {msg(questions ? "questions.title" : "feedback")}
      </h3>
      {questions && (
        <p className="tw-text-sm tw-leading-relaxed tw-text-iron-300">
          {msg("questions.help")}
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
          {msg("questions.hint")} {msg("questions.notSaved")}
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
            {context.capabilities.review_lanes.length > 0 && (
              <option value="reviewers_only">{msg("reviewersOnly")}</option>
            )}
          </select>
        </label>
      )}
      {!questions && context.capabilities.read_rights_evidence && (
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
        disabled={busy || !text.trim() || Array.from(text).length > 4000}
        onClick={() => {
          void create();
        }}
      >
        {msg(questions ? "questions.send" : "sendComment")}
      </DocumentationButton>
    </section>
  );
}

function FeedbackThread({
  contextId,
  thread,
  refresh,
}: {
  readonly contextId: string;
  readonly thread: ApiArtworkDocumentationThread;
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
    <div className="tw-space-y-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-p-4">
      <p className="tw-m-0 tw-text-xs tw-text-iron-400">
        {documentationOptionLabel(thread.audience)} ·{" "}
        {thread.resolved ? msg("resolved") : msg("feedback")}
      </p>
      {thread.comments.map((comment) => (
        <div key={comment.id}>
          <p className="tw-m-0 tw-whitespace-pre-wrap tw-break-words tw-text-sm tw-text-iron-200">
            {comment.text}
          </p>
          <p className="tw-mt-1 tw-text-xs tw-text-iron-400">
            {comment.actor_profile_id} ·{" "}
            {formatDate(locale, comment.created_at)}
          </p>
        </div>
      ))}
      {error && <DocumentationNotice error>{msg("error")}</DocumentationNotice>}
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
    </div>
  );
}
