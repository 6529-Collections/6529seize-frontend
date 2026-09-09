"use client";

import { useState } from "react";

import { ApiArtworkDocumentationAnswerStatusEnum } from "@/generated/models/ApiArtworkDocumentationAnswer";
import type { ApiArtworkDocumentationAnswer } from "@/generated/models/ApiArtworkDocumentationAnswer";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import type { ApiArtworkDocumentationOperation } from "@/generated/models/ApiArtworkDocumentationOperation";
import { documentationFieldLabel } from "@/i18n/messages/artwork-documentation-fields";
import {
  isRedacted,
  readAnswer,
  requiredPaths,
  visibleField,
} from "@/lib/artwork-documentation/answers";
import type { PendingEdit } from "@/lib/artwork-documentation/draft-controller";
import {
  fieldSection,
  initialValue,
  MODULE_FIELDS,
  MODULE_IDS,
  type DocumentationField,
  type DocumentationSection,
  type ModuleId,
  type FieldValue,
} from "@/lib/artwork-documentation/registry";
import {
  DocumentationButton,
  inputClass,
  panelClass,
  useDocumentationMessages,
} from "./DocumentationControls";
import DocumentationValueEditor, {
  type AssetChoice,
} from "./DocumentationValueEditor";
import { validDocumentationOperation } from "@/lib/artwork-documentation/validation";

interface Props {
  readonly context: ApiArtworkDocumentationContext;
  readonly edits: readonly PendingEdit[];
  readonly section?: DocumentationSection | undefined;
  readonly inlineFields?: readonly string[] | undefined;
  readonly onChange: (
    moduleId: string,
    operation: ApiArtworkDocumentationOperation
  ) => void;
  readonly onBlur?: (() => void) | undefined;
  readonly readOnly?: boolean | undefined;
  readonly assets?: readonly AssetChoice[] | undefined;
}

export default function DocumentationModules(props: Props) {
  const { msg } = useDocumentationMessages();
  const required = requiredPaths(props.context, props.edits);
  return (
    <div className="tw-space-y-5" onBlur={props.onBlur}>
      {MODULE_IDS.flatMap((moduleId) => {
        const policy = props.context.profile.modules.find(
          (module) => String(module.id) === moduleId
        );
        if (!policy) return [];
        if (policy.version !== 1)
          return [
            <p role="alert" key={moduleId}>
              {msg("upgrade")}
            </p>,
          ];
        return MODULE_FIELDS[moduleId]
          .filter(
            (field) =>
              (props.inlineFields
                ? props.inlineFields.includes(`${moduleId}.${field.id}`)
                : fieldSection(moduleId, field.id) === props.section) &&
              policy.fields.some((entry) => entry.id === field.id) &&
              visibleField(props.context, moduleId, field.id, props.edits)
          )
          .map((field) => (
            <DocumentationAnswerField
              key={`${moduleId}.${field.id}`}
              {...props}
              moduleId={moduleId}
              field={field}
              required={required.has(`${moduleId}.${field.id}`)}
            />
          ));
      })}
    </div>
  );
}

function DocumentationAnswerField(
  props: Props & {
    readonly moduleId: ModuleId;
    readonly field: DocumentationField;
    readonly required: boolean;
  }
) {
  const { context, moduleId, field, onChange, edits, required } = props;
  const { msg } = useDocumentationMessages();
  const definition = context.profile.modules
    .find((module) => String(module.id) === moduleId)
    ?.fields.find((entry) => entry.id === field.id);
  const answer = readAnswer(context, moduleId, field.id, edits);
  const redacted = isRedacted(context.modules[moduleId]?.answers[field.id]);
  const disabled =
    (props.readOnly ?? false) ||
    !context.capabilities.edit_modules.some(
      (module) => String(module) === moduleId
    ) ||
    redacted;
  const id = `documentation-${moduleId}-${field.id}`;
  const label =
    (moduleId === "interview"
      ? context.profile.interview_instrument.prompts.find(
          (prompt) => prompt.id === field.id
        )?.text
      : undefined) ?? documentationFieldLabel(field.id);
  const [replacementReason, setReplacementReason] = useState("");
  const pending = edits.find(
    (edit) => edit.moduleId === moduleId && edit.operation.field === field.id
  );
  const invalid = pending
    ? !validDocumentationOperation(context, moduleId, pending.operation)
    : false;
  const assetRole = (
    {
      canonical_asset_id: "artwork_final",
      consent_asset_ids: "consent_instrument",
      recording_asset_id: "interview_recording",
      transcript_asset_id: "interview_transcript",
    } as Record<string, string>
  )[field.id];
  const choices = assetRole
    ? props.assets?.filter((asset) =>
        context.asset_links.some(
          (link) => link.asset_id === asset.id && link.role === assetRole
        )
      )
    : props.assets;
  if (!definition) return null;
  const visibility =
    answer?.intended_visibility ?? definition.default_visibility;
  const status =
    answer?.status ?? ApiArtworkDocumentationAnswerStatusEnum.Provided;
  const update = (next: Partial<ApiArtworkDocumentationAnswer>) => {
    const merged = {
      status,
      intended_visibility: visibility,
      ...answer,
      ...next,
    } as ApiArtworkDocumentationAnswer;
    if (merged.status !== ApiArtworkDocumentationAnswerStatusEnum.Provided)
      delete merged.value;
    if (merged.explanation === "") delete merged.explanation;
    onChange(moduleId, {
      op: "set",
      field: field.id,
      answer: merged,
      ...(field.id === "canonical_asset_id" && context.latest_revision_id
        ? { replacementReason }
        : {}),
    } as ApiArtworkDocumentationOperation);
  };
  return (
    <section className={panelClass} aria-labelledby={`${id}-label`}>
      <div className="tw-mb-3 tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-2">
        <h3
          id={`${id}-label`}
          className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100"
        >
          {label}
        </h3>
        <span className="tw-text-xs tw-text-iron-400">
          {required ? msg("required") : msg("recommended")}
        </span>
      </div>
      {field.help && (
        <p
          id={`${id}-help`}
          className="tw-mb-4 tw-text-sm tw-leading-relaxed tw-text-iron-300"
        >
          {msg(field.help)}
        </p>
      )}
      {redacted ? (
        <p className="tw-m-0 tw-text-sm tw-text-iron-400">{msg("redacted")}</p>
      ) : (
        <>
          {field.id === "canonical_asset_id" &&
            context.latest_revision_id &&
            !disabled && (
              <label className="tw-mb-4 tw-block tw-text-sm tw-text-iron-300">
                {msg("canonicalReason")}
                <textarea
                  className={`${inputClass} tw-mt-2`}
                  rows={3}
                  value={replacementReason}
                  onChange={(event) => {
                    const reason = event.target.value;
                    setReplacementReason(reason);
                    if (pending)
                      onChange(moduleId, {
                        ...pending.operation,
                        replacementReason: reason,
                      } as ApiArtworkDocumentationOperation);
                  }}
                />
              </label>
            )}
          {definition.allowed_statuses.length > 1 && (
            <label className="tw-mb-4 tw-block tw-text-sm tw-text-iron-300">
              {msg("answerStatus")}
              <select
                className={`${inputClass} tw-mt-2`}
                disabled={disabled}
                value={status}
                onChange={(event) =>
                  update({
                    status: event.target.value as NonNullable<
                      ApiArtworkDocumentationAnswer["status"]
                    >,
                  })
                }
              >
                {definition.allowed_statuses.map((item) => (
                  <option key={item} value={item}>
                    {msg(`status.${item}`)}
                  </option>
                ))}
              </select>
            </label>
          )}
          {status === ApiArtworkDocumentationAnswerStatusEnum.Provided ? (
            <DocumentationValueEditor
              id={id}
              label={label}
              editor={field.editor}
              value={
                (answer?.value as FieldValue | undefined) ??
                initialValue(field.editor)
              }
              disabled={disabled}
              assets={choices}
              describedBy={field.help ? `${id}-help` : undefined}
              onChange={(value) => update({ value })}
            />
          ) : (
            <label className="tw-block tw-text-sm tw-text-iron-300">
              {msg("explanation")}
              <textarea
                id={id}
                className={`${inputClass} tw-mt-2`}
                rows={3}
                disabled={disabled}
                value={answer?.explanation ?? ""}
                onChange={(event) =>
                  update({ explanation: event.target.value })
                }
              />
            </label>
          )}
          {invalid && (
            <p role="status" className="tw-mt-3 tw-text-xs tw-text-amber-200">
              {msg("invalidField")}
            </p>
          )}
          <div className="tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
            {definition.locked_restricted ? (
              <span
                className="tw-text-xs tw-text-iron-400"
                title={msg("restrictedHelp")}
              >
                {msg("restricted")}
              </span>
            ) : (
              <label className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-xs tw-text-iron-400">
                {msg("visibility")}
                <select
                  className={`${inputClass} !tw-w-auto !tw-max-w-full !tw-py-2 !tw-text-xs`}
                  disabled={disabled || !answer}
                  value={visibility}
                  onChange={(event) =>
                    update({
                      intended_visibility: event.target.value as NonNullable<
                        ApiArtworkDocumentationAnswer["intended_visibility"]
                      >,
                    })
                  }
                >
                  <option value="public_record">{msg("publicIntent")}</option>
                  <option value="restricted">{msg("restricted")}</option>
                </select>
              </label>
            )}
            {answer && !disabled && (
              <DocumentationButton
                secondary
                onClick={() =>
                  onChange(moduleId, {
                    op: "unset",
                    field: field.id,
                  } as ApiArtworkDocumentationOperation)
                }
              >
                {msg("clear")}
              </DocumentationButton>
            )}
          </div>
        </>
      )}
    </section>
  );
}
