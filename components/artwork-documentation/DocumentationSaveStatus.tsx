"use client";

import { useState } from "react";
import type {
  DraftSnapshot,
  DocumentationDraftController,
} from "@/lib/artwork-documentation/draft-controller";
import {
  MODULE_IDS,
  type DocumentationSection,
} from "@/lib/artwork-documentation/registry";
import { documentationFieldSection } from "@/lib/artwork-documentation/catalogue";
import { validDocumentationOperation } from "@/lib/artwork-documentation/validation";
import { readAnswer } from "@/lib/artwork-documentation/answers";
import { documentationErrorMessageKey } from "@/lib/artwork-documentation/errors";
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
  onNavigateSection,
  onNavigateField,
}: {
  readonly snapshot: DraftSnapshot;
  readonly onNavigateField?:
    | ((moduleId: string, fieldId: string) => void)
    | undefined;
  readonly controller: DocumentationDraftController;
  readonly onNavigateSection?:
    | ((section: DocumentationSection) => void)
    | undefined;
}) {
  const { msg } = useDocumentationMessages();
  const { requestAuth } = useAuth();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  const explanation = documentationErrorMessageKey(snapshot.errorCode);
  const blocked = ["offline", "invalid", "auth_expired", "conflict"].includes(
    snapshot.state
  );
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
    <div
      className={`tw-min-w-0 tw-max-w-full tw-space-y-3 ${["conflict", "offline", "invalid", "auth_expired"].includes(snapshot.state) ? "tw-basis-full" : ""}`}
    >
      <p
        role="status"
        aria-live="polite"
        className="tw-m-0 tw-text-xs tw-leading-6 tw-text-iron-400"
      >
        {msg(
          ["invalid", "offline"].includes(snapshot.state) && !snapshot.dirty
            ? "save.actionUnverified"
            : `save.${snapshot.state}`
        )}
      </p>
      {explanation && snapshot.state === "invalid" && (
        <p
          role="status"
          className="tw-m-0 tw-text-sm tw-leading-7 tw-text-amber-200"
        >
          {msg(explanation)}
        </p>
      )}
      {blocked && snapshot.dirty && (
        <div className="tw-space-y-2">
          <p className="tw-m-0 tw-text-sm tw-leading-7 tw-text-iron-300">
            {msg("save.pendingFields")}
          </p>
          <ul className="tw-m-0 tw-list-none tw-p-0 tw-text-sm tw-text-iron-300">
            {snapshot.edits.map((edit) => {
              const fieldModule = MODULE_IDS.find((id) => id === edit.moduleId);
              const label = documentationFieldLabel(edit.operation.field);
              const invalid = !validDocumentationOperation(
                snapshot.context,
                edit.moduleId,
                edit.operation
              );
              let guidance = "save.answerGuidance";
              if (edit.moduleId === "rights") {
                if (edit.operation.field === "intended_license")
                  guidance = "save.licenseGuidance";
                else if (
                  ["rights_basis", "third_party_material"].includes(
                    edit.operation.field
                  )
                )
                  guidance = "save.rightsGuidance";
              }
              return (
                <li key={`${edit.moduleId}.${edit.operation.field}`}>
                  {onNavigateSection && fieldModule ? (
                    <button
                      type="button"
                      className="tw-min-h-11 tw-border-0 tw-bg-transparent tw-py-2 tw-text-left tw-text-primary-300 tw-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
                      onClick={() =>
                        onNavigateField
                          ? onNavigateField(edit.moduleId, edit.operation.field)
                          : onNavigateSection(
                              documentationFieldSection(
                                snapshot.context.profile,
                                fieldModule,
                                edit.operation.field
                              )
                            )
                      }
                    >
                      {label}
                    </button>
                  ) : (
                    label
                  )}
                  {invalid && (
                    <p className="tw-mb-3 tw-mt-0 tw-max-w-prose tw-text-sm tw-leading-6 tw-text-amber-200">
                      {msg(guidance)}
                    </p>
                  )}
                </li>
              );
            })}
            {snapshot.contentEdits.length > 0 && <li>{msg("fileDetails")}</li>}
          </ul>
        </div>
      )}
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
