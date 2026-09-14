"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { ApiArtworkDocumentationCreateWorkStartModeEnum } from "@/generated/models/ApiArtworkDocumentationCreateWork";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import { createDocumentationWork } from "@/services/api/artwork-documentation-api";
import DocumentationAuthGate from "./DocumentationAuthGate";
import ArtworkDocumentationRecord, {
  type ArtworkDocumentationInfo,
  type ArtworkDocumentationRecordHandle,
} from "./ArtworkDocumentationRecord";
import {
  DocumentationButton,
  DocumentationNotice,
  panelClass,
  useDocumentationMessages,
} from "./DocumentationControls";

export type ArtworkDocumentationInlineHandle = ArtworkDocumentationRecordHandle;
interface ArtworkDocumentationInlineProps {
  readonly profileId: string;
  readonly profileVersion: number;
  readonly programId?: string | undefined;
  readonly initialMediaProfiles?: readonly string[] | undefined;
  readonly sourceProposal?: ArtworkDocumentationInfo | undefined;
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
        <ArtworkDocumentationRecord
          ref={ref}
          context={context}
          artworkInfo={props.sourceProposal}
          initialMediaProfiles={props.initialMediaProfiles}
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
