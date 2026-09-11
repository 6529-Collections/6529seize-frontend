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
  useDocumentationMessages,
} from "./DocumentationControls";
import DocumentationValueEditor, {
  type AssetChoice,
} from "./DocumentationValueEditor";
import { validDocumentationOperation } from "@/lib/artwork-documentation/validation";
import {
  documentationChoiceEditor,
  isPublicationOnly,
} from "@/lib/artwork-documentation/intake";
import DocumentationFieldExample from "./DocumentationFieldExample";
import { DocumentationRecordedAnswer } from "./DocumentationSummary";
import {
  canEditDocumentationField,
  canReferenceDocumentationAssetLink,
} from "@/lib/artwork-documentation/capabilities";

interface Props {
  readonly context: ApiArtworkDocumentationContext;
  readonly edits: readonly PendingEdit[];
  readonly section?: DocumentationSection | undefined;
  readonly inlineFields?: readonly string[] | undefined;
  readonly excludeFields?: readonly string[] | undefined;
  readonly onChange: (
    moduleId: string,
    operation: ApiArtworkDocumentationOperation
  ) => void;
  readonly onBlur?: (() => void) | undefined;
  readonly readOnly?: boolean | undefined;
  readonly assets?: readonly AssetChoice[] | undefined;
}

export default function DocumentationModules(props: Props) {
  const { msg, locale } = useDocumentationMessages();
  const required = requiredPaths(props.context, props.edits);
  // Keep optional answers in their current group while typing and autosaving.
  // A fresh chapter visit promotes previously recorded answers into the open view.
  const [initiallyAnswered] = useState(
    () =>
      new Set(
        MODULE_IDS.flatMap((moduleId) =>
          MODULE_FIELDS[moduleId]
            .filter(
              (field) =>
                !!readAnswer(props.context, moduleId, field.id, props.edits) ||
                isRedacted(props.context.modules[moduleId]?.answers[field.id])
            )
            .map((field) => `${moduleId}.${field.id}`)
        )
      )
  );
  const fields = MODULE_IDS.flatMap((moduleId) => {
    const policy = props.context.profile.modules.find(
      (module) => String(module.id) === moduleId
    );
    if (policy?.version !== 1) return [];
    return MODULE_FIELDS[moduleId]
      .filter(
        (field) =>
          (props.inlineFields
            ? props.inlineFields.includes(`${moduleId}.${field.id}`)
            : fieldSection(moduleId, field.id) === props.section) &&
          !props.excludeFields?.includes(`${moduleId}.${field.id}`) &&
          policy.fields.some((entry) => entry.id === field.id) &&
          visibleField(props.context, moduleId, field.id, props.edits)
      )
      .map((field) => ({ moduleId, field }));
  });
  const isPrimary = ({ moduleId, field }: (typeof fields)[number]) =>
    !!props.inlineFields ||
    required.has(`${moduleId}.${field.id}`) ||
    initiallyAnswered.has(`${moduleId}.${field.id}`);
  const renderField = ({ moduleId, field }: (typeof fields)[number]) => (
    <DocumentationAnswerField
      key={`${moduleId}.${field.id}`}
      {...props}
      moduleId={moduleId}
      field={field}
      required={required.has(`${moduleId}.${field.id}`)}
    />
  );
  const mainFields = fields.filter(({ moduleId }) => moduleId !== "interview");
  const optional = mainFields.filter((field) => !isPrimary(field));
  const interview = fields.filter(({ moduleId }) => moduleId === "interview");
  const interviewMode: unknown = readAnswer(
    props.context,
    "interview",
    "mode",
    props.edits
  )?.value;
  const isInterviewPrimary = (entry: (typeof fields)[number]) =>
    isPrimary(entry) ||
    entry.field.id === "mode" ||
    interviewMode === "written" ||
    interviewMode === "recording";
  return (
    <div className="tw-space-y-10" onBlur={props.onBlur}>
      {props.context.profile.modules
        .filter((module) => module.version !== 1)
        .map((module) => (
          <p role="alert" key={String(module.id)}>
            {msg("upgrade")}
          </p>
        ))}
      <div className="tw-grid tw-grid-cols-1 tw-gap-x-8 tw-gap-y-8 sm:tw-grid-cols-2">
        {mainFields.filter(isPrimary).map(renderField)}
      </div>
      {optional.length > 0 && (
        <details className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-4">
          <summary className="tw-min-h-11 tw-cursor-pointer tw-py-2 tw-text-base tw-font-medium tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
            {msg(`chapters.additional.${props.section ?? "review"}`, {
              count: new Intl.NumberFormat(locale).format(optional.length),
            })}
          </summary>
          <p className="tw-mb-8 tw-mt-3 tw-max-w-prose tw-text-sm tw-leading-6 tw-text-iron-400">
            {msg("chapters.additionalHelp")}
          </p>
          <div className="tw-grid tw-grid-cols-1 tw-gap-x-8 tw-gap-y-8 sm:tw-grid-cols-2">
            {optional.map(renderField)}
          </div>
        </details>
      )}
      {interview.length > 0 && (
        <section
          className="tw-space-y-8 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8"
          aria-labelledby="documentation-interview-title"
        >
          <div className="tw-max-w-prose">
            <h3
              id="documentation-interview-title"
              className="tw-m-0 tw-font-serif tw-text-2xl tw-font-normal"
            >
              {msg("chapters.interview")}
            </h3>
            <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
              {msg("chapters.interviewHelp")}
            </p>
          </div>
          <div className="tw-grid tw-grid-cols-1 tw-gap-x-8 tw-gap-y-8 sm:tw-grid-cols-2">
            {interview.filter(isInterviewPrimary).map(renderField)}
          </div>
          {interview.some((entry) => !isInterviewPrimary(entry)) && (
            <details>
              <summary className="tw-min-h-11 tw-cursor-pointer tw-py-2 tw-text-sm tw-text-iron-300">
                {msg("chapters.interviewDetails")}
              </summary>
              <div className="tw-mt-6 tw-grid tw-grid-cols-1 tw-gap-x-8 tw-gap-y-8 sm:tw-grid-cols-2">
                {interview
                  .filter((entry) => !isInterviewPrimary(entry))
                  .map(renderField)}
              </div>
            </details>
          )}
        </section>
      )}
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
    !canEditDocumentationField(
      context,
      `${moduleId}.${field.id}`,
      (answer?.intended_visibility ?? definition?.default_visibility) ===
        "restricted"
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
  const selectedAssetIds = Array.isArray(answer?.value)
    ? answer.value
    : [answer?.value];
  const choices = props.assets?.filter((asset) =>
    context.asset_links.some(
      (link) =>
        link.asset_id === asset.id &&
        (!assetRole || link.role === assetRole) &&
        (selectedAssetIds.includes(asset.id) ||
          canReferenceDocumentationAssetLink(context, link))
    )
  );
  if (!definition) return null;
  const visibility =
    answer?.intended_visibility ?? definition.default_visibility;
  const status =
    answer?.status ?? ApiArtworkDocumentationAnswerStatusEnum.Provided;
  const publicationOnly = isPublicationOnly(context.profile);
  const update = (next: Partial<ApiArtworkDocumentationAnswer>) => {
    if (
      disabled ||
      !canEditDocumentationField(
        context,
        `${moduleId}.${field.id}`,
        (next.intended_visibility ?? visibility) === "restricted"
      )
    )
      return;
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
  const fullWidth =
    field.id === "title" ||
    (field.editor.kind === "text" && field.editor.multiline === true) ||
    (["object", "list", "localized"].includes(field.editor.kind) &&
      field.id !== "declared_dimensions");
  const fieldClass = `tw-min-w-0 ${fullWidth ? "sm:tw-col-span-2" : ""}`;
  if (disabled)
    return (
      <section className={fieldClass} aria-labelledby={`${id}-label`}>
        <h3
          id={`${id}-label`}
          className="tw-mb-3 tw-mt-0 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-400"
        >
          {label}
        </h3>
        {answer ? (
          <DocumentationRecordedAnswer
            answer={answer}
            moduleId={moduleId}
            field={field.id}
            context={context}
          />
        ) : (
          <p className="tw-m-0 tw-text-base tw-leading-7 tw-text-iron-400">
            {msg(redacted ? "redacted" : "chapters.notRecorded")}
          </p>
        )}
      </section>
    );
  return (
    <section className={fieldClass} aria-labelledby={`${id}-label`}>
      <div className="tw-mb-3 tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-2">
        <h3
          id={`${id}-label`}
          className="tw-m-0 tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100"
        >
          {label}
        </h3>
        {required && (
          <span className="tw-text-xs tw-text-iron-400">
            {msg("chapters.essential")}
          </span>
        )}
      </div>
      {field.help && (
        <p
          id={`${id}-help`}
          className="tw-mb-4 tw-text-sm tw-leading-relaxed tw-text-iron-300"
        >
          {msg(fieldHelpKey(field.help, publicationOnly))}
        </p>
      )}
      {redacted ? (
        <p className="tw-m-0 tw-text-sm tw-text-iron-400">{msg("redacted")}</p>
      ) : (
        <>
          <DocumentationFieldExample
            profile={context.profile}
            moduleId={moduleId}
            field={field}
            label={label}
            disabled={disabled}
            hasAnswer={!!answer}
            validate={(value) =>
              validDocumentationOperation(context, moduleId, {
                op: "set",
                field: field.id,
                answer: {
                  status: ApiArtworkDocumentationAnswerStatusEnum.Provided,
                  value,
                  intended_visibility: visibility,
                },
              } as ApiArtworkDocumentationOperation)
            }
            onApply={(value) =>
              update({
                status: ApiArtworkDocumentationAnswerStatusEnum.Provided,
                value,
              })
            }
          />
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
          {status === ApiArtworkDocumentationAnswerStatusEnum.Provided ? (
            <DocumentationValueEditor
              id={id}
              label={label}
              hideLabel
              editor={documentationChoiceEditor(
                field.editor,
                definition.value_schema
              )}
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
            <div className="tw-space-y-2">
              <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-300">
                {msg(`status.${status}`)}
              </p>
              {answer?.explanation && (
                <p className="tw-m-0 tw-whitespace-pre-wrap tw-break-words tw-text-base tw-leading-7 tw-text-iron-200">
                  {answer.explanation}
                </p>
              )}
            </div>
          )}
          {(!!answer ||
            definition.allowed_statuses.length > 1 ||
            !publicationOnly) && (
            <details className="tw-mt-2">
              <summary className="tw-min-h-11 tw-cursor-pointer tw-py-2 tw-text-xs tw-text-iron-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
                {msg(
                  answer
                    ? "chapters.answerOptions"
                    : "chapters.answerAlternatives"
                )}
              </summary>
              <div className="tw-space-y-4 tw-py-3">
                {definition.allowed_statuses.length > 1 && (
                  <label className="tw-block tw-text-sm tw-text-iron-300">
                    {msg("answerStatus")}
                    <select
                      className={`${inputClass} tw-mt-2`}
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
                {status !==
                  ApiArtworkDocumentationAnswerStatusEnum.Provided && (
                  <label className="tw-block tw-text-sm tw-text-iron-300">
                    {msg("explanation")}
                    <textarea
                      id={id}
                      className={`${inputClass} tw-mt-2`}
                      rows={3}
                      value={answer?.explanation ?? ""}
                      onChange={(event) =>
                        update({ explanation: event.target.value })
                      }
                    />
                  </label>
                )}
                {!publicationOnly && (
                  <AnswerVisibility
                    publicationOnly={false}
                    lockedRestricted={definition.locked_restricted}
                    disabled={!answer}
                    canRestrict={canEditDocumentationField(
                      context,
                      `${moduleId}.${field.id}`,
                      true
                    )}
                    value={visibility}
                    onChange={(intended_visibility) =>
                      update({ intended_visibility })
                    }
                  />
                )}
                {answer && (
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
            </details>
          )}
          {invalid && (
            <p role="status" className="tw-mt-3 tw-text-xs tw-text-amber-200">
              {msg("invalidField")}
            </p>
          )}
        </>
      )}
    </section>
  );
}

function fieldHelpKey(help: string, publicationOnly: boolean): string {
  return publicationOnly &&
    ["locationHelp", "masterHelp", "interviewEvidenceHelp"].includes(help)
    ? `publication.${help}`
    : help;
}

function AnswerVisibility({
  publicationOnly,
  lockedRestricted,
  disabled,
  canRestrict,
  value,
  onChange,
}: {
  readonly publicationOnly: boolean;
  readonly lockedRestricted: boolean;
  readonly disabled: boolean;
  readonly canRestrict: boolean;
  readonly value: string;
  readonly onChange: (
    value: NonNullable<ApiArtworkDocumentationAnswer["intended_visibility"]>
  ) => void;
}) {
  const { msg } = useDocumentationMessages();
  if (publicationOnly)
    return (
      <span className="tw-text-xs tw-text-iron-400">
        {msg("publication.field")}
      </span>
    );
  if (lockedRestricted)
    return (
      <span
        className="tw-text-xs tw-text-iron-400"
        title={msg("restrictedHelp")}
      >
        {msg("restricted")}
      </span>
    );
  return (
    <label className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-xs tw-text-iron-400">
      {msg("visibility")}
      <select
        className={`${inputClass} !tw-w-auto !tw-max-w-full !tw-py-2 !tw-text-xs`}
        disabled={disabled}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value as NonNullable<
              ApiArtworkDocumentationAnswer["intended_visibility"]
            >
          )
        }
      >
        <option value="public_record">{msg("publicIntent")}</option>
        <option value="restricted" disabled={!canRestrict}>
          {msg("restricted")}
        </option>
      </select>
    </label>
  );
}
