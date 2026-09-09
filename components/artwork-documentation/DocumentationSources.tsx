"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import type { DocumentationDraftController } from "@/lib/artwork-documentation/draft-controller";
import {
  getDocumentationSourcePreview,
  importDocumentationSource,
} from "@/services/api/artwork-documentation-api";
import { documentationQueryKey } from "@/hooks/artwork-documentation/useArtworkDocumentationAccess";
import { documentationFieldLabel } from "@/i18n/messages/artwork-documentation-fields";
import { useDocumentationActor } from "./DocumentationAuthGate";
import { DocumentationValueSummary } from "./DocumentationSummary";
import { readAnswer } from "@/lib/artwork-documentation/answers";
import {
  DocumentationButton,
  DocumentationNotice,
  panelClass,
  useDocumentationMessages,
} from "./DocumentationControls";

export default function DocumentationSources({
  context,
  controller,
}: {
  readonly context: ApiArtworkDocumentationContext;
  readonly controller: DocumentationDraftController;
}) {
  const { msg } = useDocumentationMessages();
  if (
    !context.source_links.length ||
    !context.capabilities.read_source_receipts
  )
    return null;
  return (
    <details className={panelClass}>
      <summary className="tw-cursor-pointer tw-py-2 tw-text-base tw-font-semibold">
        {msg("sourceTitle")}
      </summary>
      <p className="tw-text-sm tw-leading-relaxed tw-text-iron-300">
        {msg("sourceHelp")}
      </p>
      {context.source_links.map((source) => (
        <SourceReceipt
          key={source.source_receipt_id}
          context={context}
          receiptId={source.source_receipt_id}
          controller={controller}
        />
      ))}
    </details>
  );
}

function SourceReceipt({
  context,
  receiptId,
  controller,
}: {
  readonly context: ApiArtworkDocumentationContext;
  readonly receiptId: string;
  readonly controller: DocumentationDraftController;
}) {
  const { msg } = useDocumentationMessages();
  const { connectedProfile, actorKey } = useDocumentationActor();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const query = useQuery({
    queryKey: documentationQueryKey(
      connectedProfile?.id,
      context.id,
      "source",
      receiptId,
      actorKey
    ),
    queryFn: ({ signal }) =>
      getDocumentationSourcePreview(context.id, receiptId, signal),
    retry: false,
    gcTime: 0,
    meta: { persist: false },
  });
  if (query.isError)
    return (
      <DocumentationNotice>{msg("sourceUnavailable")}</DocumentationNotice>
    );
  const apply = async () => {
    setBusy(true);
    try {
      if (controller.snapshot().dirty) {
        if (!(await controller.flush())) return;
        await query.refetch();
        setSelected([]);
        return;
      }
      const success = await controller.mutate((current, signal) =>
        importDocumentationSource(
          current,
          receiptId,
          query.data?.fields
            .filter((field) => selected.includes(field.target_field))
            .map(({ source_path, target_field }) => ({
              source_path,
              target_field,
            })) ?? [],
          signal
        )
      );
      if (success) setSelected([]);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="tw-space-y-4">
      <details>
        <summary className="tw-cursor-pointer tw-py-2 tw-text-sm tw-text-iron-300">
          {msg("sourceOriginal")}
        </summary>
        <p className="tw-whitespace-pre-wrap tw-break-words tw-text-sm tw-text-iron-300">
          {query.data?.receipt_text}
        </p>
      </details>
      {query.data?.fields.map((field) => (
        <div
          key={field.target_field}
          className="tw-space-y-2 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-3"
        >
          <label className="tw-flex tw-items-center tw-gap-3 tw-text-sm">
            <input
              type="checkbox"
              className="tw-h-5 tw-w-5 tw-accent-primary-400"
              checked={selected.includes(field.target_field)}
              disabled={
                !context.capabilities.edit_modules.some(
                  (module) => module === field.target_field.split(".")[0]
                )
              }
              onChange={(event) =>
                setSelected(
                  event.target.checked
                    ? [...selected, field.target_field]
                    : selected.filter((path) => path !== field.target_field)
                )
              }
            />
            {documentationFieldLabel(
              field.target_field.split(".").at(-1) ?? field.target_field
            )}
          </label>
          <div className="tw-grid tw-gap-4 sm:tw-grid-cols-2">
            <div>
              <p className="tw-text-xs tw-font-medium tw-text-iron-400">
                {msg("conflict.base")}
              </p>
              <DocumentationValueSummary
                value={
                  readAnswer(
                    context,
                    field.target_field.split(".")[0] ?? "",
                    field.target_field.split(".")[1] ?? ""
                  )?.value as unknown
                }
              />
            </div>
            <div>
              <p className="tw-text-xs tw-font-medium tw-text-iron-400">
                {msg("sourceProposal")}
              </p>
              <DocumentationValueSummary
                value={field.answer.value as unknown}
              />
            </div>
          </div>
          {field.will_overwrite && (
            <p className="tw-text-xs tw-text-amber-200">
              {msg("sourceReplace")}
            </p>
          )}
        </div>
      ))}
      <DocumentationButton
        secondary
        disabled={busy || !selected.length}
        onClick={() => {
          void apply();
        }}
      >
        {msg("sourceApply")}
      </DocumentationButton>
    </div>
  );
}
