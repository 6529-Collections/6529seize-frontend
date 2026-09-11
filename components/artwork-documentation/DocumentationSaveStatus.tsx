"use client";

import { useState } from "react";
import type {
  DraftSnapshot,
  DocumentationDraftController,
} from "@/lib/artwork-documentation/draft-controller";
import { readAnswer } from "@/lib/artwork-documentation/answers";
import { documentationFieldLabel } from "@/i18n/messages/artwork-documentation-fields";
import { useAuth } from "@/components/auth/Auth";
import { DocumentationValueSummary } from "./DocumentationSummary";
import {
  DocumentationButton,
  DocumentationNotice,
  useDocumentationMessages,
} from "./DocumentationControls";

export default function DocumentationSaveStatus({
  snapshot,
  controller,
}: {
  readonly snapshot: DraftSnapshot;
  readonly controller: DocumentationDraftController;
}) {
  const { msg } = useDocumentationMessages();
  const { requestAuth } = useAuth();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const recover = async (mine: boolean) => {
    setError(false);
    try {
      await controller.resolveConflict(mine);
    } catch {
      setError(true);
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        [
          ...snapshot.edits.map(
            (edit) =>
              `${documentationFieldLabel(edit.operation.field)}\n${JSON.stringify(edit.operation.answer ?? null, null, 2)}`
          ),
          ...snapshot.contentEdits.map(
            (edit) =>
              `${msg("fileDetails")}\n${JSON.stringify(edit.value, null, 2)}`
          ),
        ].join("\n\n")
      );
      setCopied(true);
    } catch {
      setError(true);
    }
  };
  return (
    <div className="tw-space-y-3">
      <p
        role="status"
        aria-live="polite"
        className="tw-m-0 tw-text-sm tw-text-iron-300"
      >
        {msg(`save.${snapshot.state}`)}
      </p>
      {snapshot.state === "conflict" && (
        <DocumentationNotice>
          <div className="tw-space-y-4">
            {snapshot.edits.map((edit) => (
              <details key={`${edit.moduleId}.${edit.operation.field}`}>
                <summary className="tw-cursor-pointer tw-py-2 tw-font-medium">
                  {documentationFieldLabel(edit.operation.field)}
                </summary>
                <div className="tw-grid tw-gap-4 sm:tw-grid-cols-3">
                  {[
                    [
                      msg("conflict.base"),
                      readAnswer(
                        snapshot.context,
                        edit.moduleId,
                        edit.operation.field
                      ),
                    ],
                    [
                      msg("conflict.server"),
                      snapshot.latest
                        ? readAnswer(
                            snapshot.latest,
                            edit.moduleId,
                            edit.operation.field
                          )
                        : undefined,
                    ],
                    [msg("conflict.local"), edit.operation.answer],
                  ].map(([label, value], index) => (
                    <div key={index}>
                      <p className="tw-text-xs tw-font-semibold">
                        {typeof label === "string" ? label : ""}
                      </p>
                      <DocumentationValueSummary value={value} />
                    </div>
                  ))}
                </div>
              </details>
            ))}
            {snapshot.contentEdits.map((edit) => (
              <details key={edit.id}>
                <summary className="tw-cursor-pointer tw-py-2 tw-font-medium">
                  {msg("fileDetails")}
                </summary>
                <p className="tw-text-xs">{msg("conflict.local")}</p>
                <DocumentationValueSummary value={edit.value} />
              </details>
            ))}
            <div className="tw-flex tw-flex-wrap tw-gap-3">
              <DocumentationButton
                secondary
                onClick={() => {
                  void recover(false);
                }}
              >
                {msg("conflict.latest")}
              </DocumentationButton>
              <DocumentationButton
                onClick={() => {
                  void recover(true);
                }}
              >
                {msg("conflict.mine")}
              </DocumentationButton>
            </div>
          </div>
        </DocumentationNotice>
      )}
      {["offline", "invalid", "auth_expired"].includes(snapshot.state) && (
        <div className="tw-flex tw-flex-wrap tw-gap-3">
          <DocumentationButton
            secondary
            onClick={() => {
              if (snapshot.state === "auth_expired")
                void requestAuth({ serverRejected: true }).then((result) => {
                  if (result.success) void controller.retry();
                });
              else void controller.retry();
            }}
          >
            {snapshot.state === "auth_expired" ? msg("connect") : msg("retry")}
          </DocumentationButton>
          <DocumentationButton
            secondary
            onClick={() => {
              void copy();
            }}
          >
            {copied ? msg("copied") : msg("copy")}
          </DocumentationButton>
        </div>
      )}
      {error && <DocumentationNotice error>{msg("error")}</DocumentationNotice>}
    </div>
  );
}
