"use client";

import Link from "next/link";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ApiArtworkDocumentationCreateWorkStartModeEnum } from "@/generated/models/ApiArtworkDocumentationCreateWork";
import { ApiArtworkDocumentationOperationOpEnum } from "@/generated/models/ApiArtworkDocumentationOperation";
import {
  ApiArtworkDocumentationAnswerStatusEnum,
  ApiArtworkDocumentationAnswerIntendedVisibilityEnum,
} from "@/generated/models/ApiArtworkDocumentationAnswer";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import { useDocumentationDraft } from "@/hooks/artwork-documentation/useDocumentationDraft";
import {
  associateDocumentationSource,
  createDocumentationWork,
  documentationWorkspacePath,
} from "@/services/api/artwork-documentation-api";
import DocumentationAuthGate from "./DocumentationAuthGate";
import DocumentationModules from "./DocumentationModules";
import DocumentationSaveStatus from "./DocumentationSaveStatus";
import {
  DocumentationButton,
  DocumentationNotice,
  panelClass,
  useDocumentationMessages,
} from "./DocumentationControls";

export interface ArtworkDocumentationInlineHandle {
  onDropSubmitted(
    dropId: string
  ): Promise<{ linked: boolean; contextId: string; workId: string }>;
  flush(): Promise<boolean>;
}
interface ArtworkDocumentationInlineProps {
  readonly profileId: string;
  readonly profileVersion: number;
  readonly programId?: string | undefined;
  readonly sourceProposal?:
    | {
        readonly title?: string | undefined;
        readonly caption?: string | undefined;
        readonly description?: string | undefined;
        readonly preferredCredit?: string | undefined;
      }
    | undefined;
  readonly onContextCreated?:
    | ((context: ApiArtworkDocumentationContext) => void)
    | undefined;
}

export const ArtworkDocumentationInline = forwardRef<
  ArtworkDocumentationInlineHandle,
  ArtworkDocumentationInlineProps
>((props, ref) => {
  return (
    <DocumentationAuthGate>
      <InlineStart {...props} ref={ref} />
    </DocumentationAuthGate>
  );
});

ArtworkDocumentationInline.displayName = "ArtworkDocumentationInline";

const InlineStart = forwardRef<
  ArtworkDocumentationInlineHandle,
  ArtworkDocumentationInlineProps
>((props, ref) => {
  const { msg } = useDocumentationMessages();
  const [context, setContext] = useState<ApiArtworkDocumentationContext | null>(
    null
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const key = useRef(crypto.randomUUID());
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  const start = async () => {
    setBusy(true);
    setError(false);
    abort.current = new AbortController();
    try {
      const created = await createDocumentationWork(
        {
          profile_id: props.profileId,
          profile_version: props.profileVersion,
          ...(props.programId ? { program_id: props.programId } : {}),
          start_mode:
            ApiArtworkDocumentationCreateWorkStartModeEnum.DuringSubmission,
        },
        key.current,
        abort.current.signal
      );
      if (!abort.current.signal.aborted) {
        setContext(created);
        props.onContextCreated?.(created);
      }
    } catch {
      if (!abort.current.signal.aborted) setError(true);
    } finally {
      if (!abort.current.signal.aborted) setBusy(false);
    }
  };
  return (
    <details className={panelClass} open={context ? true : undefined}>
      <summary className="tw-cursor-pointer tw-py-2 tw-text-base tw-font-semibold">
        {msg("inlineTitle")}
      </summary>
      <p className="tw-mt-3 tw-text-sm tw-leading-relaxed tw-text-iron-300">
        {msg("inlineHelp")}
      </p>
      <p className="tw-text-xs tw-leading-relaxed tw-text-iron-400">
        {msg("inlineOptional")}
      </p>
      {error && <DocumentationNotice error>{msg("error")}</DocumentationNotice>}
      {context ? (
        <InlineEditor
          ref={ref}
          initial={context}
          sourceProposal={props.sourceProposal}
        />
      ) : (
        <DocumentationButton
          secondary
          disabled={busy}
          onClick={() => {
            void start();
          }}
        >
          {busy ? msg("loading") : msg("inlineStart")}
        </DocumentationButton>
      )}
    </details>
  );
});

InlineStart.displayName = "ArtworkDocumentationInlineStart";

const InlineEditor = forwardRef<
  ArtworkDocumentationInlineHandle,
  {
    readonly initial: ApiArtworkDocumentationContext;
    readonly sourceProposal: ArtworkDocumentationInlineProps["sourceProposal"];
  }
>(({ initial, sourceProposal }, ref) => {
  const { msg } = useDocumentationMessages();
  const draft = useDocumentationDraft(initial);
  const { controller } = draft;
  const seeded = useRef(false);
  const sourceSeed = useRef(sourceProposal).current;
  useEffect(() => {
    if (seeded.current || !sourceSeed) return;
    seeded.current = true;
    const answer = (value: unknown) => ({
      status: ApiArtworkDocumentationAnswerStatusEnum.Provided,
      value,
      intended_visibility:
        ApiArtworkDocumentationAnswerIntendedVisibilityEnum.PublicRecord,
    });
    if (sourceSeed.title)
      controller.edit("artwork", {
        op: ApiArtworkDocumentationOperationOpEnum.Set,
        field: "title",
        answer: answer(sourceSeed.title),
      });
    if (sourceSeed.preferredCredit)
      controller.edit("identity", {
        op: ApiArtworkDocumentationOperationOpEnum.Set,
        field: "preferred_credit",
        answer: answer(sourceSeed.preferredCredit),
      });
    const caption = sourceSeed.caption ?? sourceSeed.description;
    if (caption)
      controller.edit("context", {
        op: ApiArtworkDocumentationOperationOpEnum.Set,
        field: "caption",
        answer: answer({
          primary_language: "en",
          versions: [
            {
              language: "en",
              text: caption,
              authorship: "original",
              approved_by_artist: false,
            },
          ],
        }),
      });
    return () => {
      seeded.current = false;
    };
  }, [controller, sourceSeed]);
  useImperativeHandle(
    ref,
    () => ({
      flush: () => controller.flush(),
      onDropSubmitted: async (dropId) => {
        const linked = await controller.mutate((current, signal) =>
          associateDocumentationSource(
            current.id,
            dropId,
            current.draft_version,
            signal
          )
        );
        const current = controller.snapshot().context;
        return { linked, contextId: current.id, workId: current.work_id };
      },
    }),
    [controller]
  );
  return (
    <div className="tw-space-y-4">
      <DocumentationNotice>{msg("privacy")}</DocumentationNotice>
      <p className="tw-text-xs tw-text-iron-400">{msg("sourceProposal")}</p>
      <DocumentationSaveStatus snapshot={draft} controller={controller} />
      <DocumentationModules
        context={draft.context}
        edits={draft.edits}
        inlineFields={[
          "context.caption",
          "process.process_description",
          "identity.preferred_credit",
        ]}
        onChange={(moduleId, operation) => controller.edit(moduleId, operation)}
        onBlur={() => {
          void controller.flush();
        }}
      />
      <Link
        href={documentationWorkspacePath(
          draft.context.work_id,
          draft.context.id
        )}
        className="tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-font-semibold tw-text-primary-300"
        onClick={(event) => {
          if (draft.dirty) {
            event.preventDefault();
            void controller.flush().then((saved) => {
              if (saved)
                globalThis.location.assign(
                  documentationWorkspacePath(
                    draft.context.work_id,
                    draft.context.id
                  )
                );
            });
          }
        }}
      >
        {msg("inlineOpen")}
      </Link>
    </div>
  );
});
InlineEditor.displayName = "ArtworkDocumentationInlineEditor";
