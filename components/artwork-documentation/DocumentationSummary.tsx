"use client";

import type { ReactNode } from "react";
import type { ApiArtworkDocumentationProfile } from "@/generated/models/ApiArtworkDocumentationProfile";
import {
  ApiArtworkDocumentationAnswerStatusEnum,
  ApiArtworkDocumentationAnswerIntendedVisibilityEnum,
} from "@/generated/models/ApiArtworkDocumentationAnswer";
import type { ApiArtworkDocumentationAnswer } from "@/generated/models/ApiArtworkDocumentationAnswer";
import {
  documentationFieldLabel,
  documentationOptionLabel,
} from "@/i18n/messages/artwork-documentation-fields";
import { isRedacted } from "@/lib/artwork-documentation/answers";
import {
  MODULE_FIELDS,
  type ModuleId,
} from "@/lib/artwork-documentation/registry";
import { useDocumentationMessages } from "./DocumentationControls";
import DocumentationRecordValue from "./DocumentationRecordValue";

export { default as DocumentationValueSummary } from "./DocumentationRecordValue";

interface RecordContext {
  readonly profile?: ApiArtworkDocumentationProfile | undefined;
  readonly assets?:
    | readonly { readonly id: string; readonly filename: string }[]
    | undefined;
  readonly modules: Record<
    string,
    { readonly answers: Record<string, ApiArtworkDocumentationAnswer> }
  >;
}

const RECORD_ORDER: readonly ModuleId[] = [
  "artwork",
  "context",
  "identity",
  "process",
  "preservation",
  "rights",
  "files",
  "interview",
];
const LEAD_FACTS = ["capture_date", "completion_date", "medium"] as const;

const narrativeFields = new Set([
  "biography",
  "caption",
  "artist_statement",
  "making_context",
  "process_description",
  "construction_note",
  "significant_properties",
  "visual_description",
  "misunderstandings",
  "q1",
  "q2",
  "q3",
  "q4",
  "q5",
  "q6",
  "q7",
  "q8",
]);

function providedText(
  context: RecordContext,
  module: string,
  field: string
): string | null {
  const answer = context.modules[module]?.answers[field];
  return answer &&
    !isRedacted(answer) &&
    answer.status === ApiArtworkDocumentationAnswerStatusEnum.Provided &&
    typeof answer.value === "string" &&
    answer.value.trim()
    ? answer.value
    : null;
}

function RecordAnswer({
  answer,
  moduleId,
  field,
  context,
}: {
  readonly answer: ApiArtworkDocumentationAnswer;
  readonly moduleId: ModuleId;
  readonly field: string;
  readonly context: RecordContext;
}) {
  const { msg } = useDocumentationMessages();
  if (isRedacted(answer))
    return <span className="tw-text-iron-400">{msg("redacted")}</span>;
  const editor = MODULE_FIELDS[moduleId].find(
    (item) => item.id === field
  )?.editor;
  const translateEnum =
    editor?.kind === "choice" ||
    (editor?.kind === "list" && editor.item.kind === "choice");
  const displayValue =
    editor?.kind === "asset"
      ? (Array.isArray(answer.value) ? answer.value : [answer.value]).map(
          (id) =>
            context.assets?.find((asset) => asset.id === id)?.filename ?? id
        )
      : answer.value;
  return (
    <>
      <DocumentationRecordValue
        translateEnum={
          answer.status === ApiArtworkDocumentationAnswerStatusEnum.Provided &&
          translateEnum
        }
        value={
          answer.status === ApiArtworkDocumentationAnswerStatusEnum.Provided
            ? displayValue
            : documentationOptionLabel(answer.status ?? "unknown")
        }
      />
      {answer.explanation && (
        <p className="tw-mb-0 tw-mt-3 tw-whitespace-pre-wrap tw-break-words tw-text-sm tw-leading-7 tw-text-iron-300">
          {answer.explanation}
        </p>
      )}
      {answer.intended_visibility ===
        ApiArtworkDocumentationAnswerIntendedVisibilityEnum.Restricted && (
        <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-iron-400">
          {msg("restricted")}
        </p>
      )}
    </>
  );
}

function RecordSection({
  id,
  context,
  profile,
  consumed,
}: {
  readonly id: ModuleId;
  readonly context: RecordContext;
  readonly profile?: ApiArtworkDocumentationProfile | undefined;
  readonly consumed: ReadonlySet<string>;
}) {
  const { msg } = useDocumentationMessages();
  const order = MODULE_FIELDS[id].map((field) => field.id);
  const entries = Object.entries(context.modules[id]?.answers ?? {})
    .filter(([field]) => !consumed.has(id + "." + field))
    .sort(([first], [second]) => {
      const a = order.indexOf(first);
      const b = order.indexOf(second);
      return (a < 0 ? order.length : a) - (b < 0 ? order.length : b);
    });
  if (!entries.length) return null;
  return (
    <section className="tw-grid tw-gap-6 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-10 lg:tw-grid-cols-[11rem_minmax(0,1fr)] lg:tw-gap-12">
      <h3 className="tw-m-0 tw-font-serif tw-text-2xl tw-font-normal tw-leading-tight tw-text-iron-100">
        {msg("catalogue.section." + id)}
      </h3>
      <dl className="tw-m-0 tw-grid tw-min-w-0 tw-grid-cols-1 tw-gap-x-8 tw-gap-y-8 sm:tw-grid-cols-2">
        {entries.map(([field, answer]) => {
          const narrative = narrativeFields.has(field);
          const label =
            (id === "interview"
              ? (profile ?? context.profile)?.interview_instrument.prompts.find(
                  (prompt) => prompt.id === field
                )?.text
              : undefined) ?? documentationFieldLabel(field);
          return (
            <div
              key={field}
              className={
                narrative ? "tw-min-w-0 sm:tw-col-span-2" : "tw-min-w-0"
              }
            >
              <dt className="tw-mb-2 tw-text-sm tw-font-medium tw-leading-6 tw-text-iron-400">
                {label}
              </dt>
              <dd className="tw-m-0 tw-max-w-prose tw-text-base tw-leading-8 tw-text-iron-200">
                <RecordAnswer
                  answer={answer}
                  moduleId={id}
                  field={field}
                  context={context}
                />
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

/** A reading view of the supplied projection, never a separate publication filter. */
export default function DocumentationSummary({
  context,
  profile,
  modules = RECORD_ORDER,
  showHeading = true,
  media,
}: {
  readonly profile?: ApiArtworkDocumentationProfile | undefined;
  readonly context: RecordContext;
  readonly modules?: readonly ModuleId[];
  readonly showHeading?: boolean;
  readonly media?: ReactNode;
}) {
  const { msg } = useDocumentationMessages();
  const title = providedText(context, "artwork", "title");
  const credit =
    providedText(context, "identity", "preferred_credit") ??
    providedText(context, "identity", "display_name");
  const consumed = new Set<string>();
  const consumeSimpleText = (moduleId: ModuleId, field: string) => {
    const answer = context.modules[moduleId]?.answers[field];
    if (
      answer &&
      providedText(context, moduleId, field) &&
      !answer.explanation &&
      answer.intended_visibility !==
        ApiArtworkDocumentationAnswerIntendedVisibilityEnum.Restricted
    )
      consumed.add(moduleId + "." + field);
  };
  if (showHeading) {
    consumeSimpleText("artwork", "title");
    consumeSimpleText(
      "identity",
      providedText(context, "identity", "preferred_credit")
        ? "preferred_credit"
        : "display_name"
    );
    for (const field of LEAD_FACTS) {
      if (context.modules["artwork"]?.answers[field])
        consumed.add("artwork." + field);
    }
    if (context.modules["context"]?.answers["caption"])
      consumed.add("context.caption");
  }
  const hasAnswers = modules.some(
    (id) => Object.keys(context.modules[id]?.answers ?? {}).length > 0
  );
  return (
    <article aria-label={msg("catalogue.label")} className="tw-min-w-0">
      {media && <div className="tw-mb-10">{media}</div>}
      {showHeading && (
        <header className="tw-pb-10 tw-pt-4">
          <p className="tw-mb-5 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.18em] tw-text-iron-400">
            {msg("catalogue.eyebrow")}
          </p>
          <h2 className="tw-m-0 tw-max-w-3xl tw-break-words tw-font-serif tw-text-4xl tw-font-normal tw-leading-[1.1] tw-text-iron-50 sm:tw-text-5xl">
            {title ?? msg("untitled")}
          </h2>
          {credit && (
            <p className="tw-mb-0 tw-mt-5 tw-whitespace-pre-wrap tw-break-words tw-text-lg tw-leading-7 tw-text-iron-200">
              {credit}
            </p>
          )}
          <dl className="tw-mb-0 tw-mt-8 tw-flex tw-flex-wrap tw-gap-x-12 tw-gap-y-5">
            {LEAD_FACTS.map((field) => {
              const answer = context.modules["artwork"]?.answers[field];
              return answer ? (
                <div key={field} className="tw-min-w-0 tw-max-w-prose">
                  <dt className="tw-mb-1 tw-text-sm tw-leading-6 tw-text-iron-400">
                    {documentationFieldLabel(field)}
                  </dt>
                  <dd className="tw-m-0 tw-text-base tw-leading-7 tw-text-iron-200">
                    <RecordAnswer
                      answer={answer}
                      moduleId="artwork"
                      field={field}
                      context={context}
                    />
                  </dd>
                </div>
              ) : null;
            })}
          </dl>
        </header>
      )}
      {showHeading && context.modules["context"]?.answers["caption"] && (
        <div className="tw-max-w-prose tw-pb-12 tw-text-lg tw-leading-8 tw-text-iron-200">
          <RecordAnswer
            answer={context.modules["context"].answers["caption"]}
            moduleId="context"
            field="caption"
            context={context}
          />
        </div>
      )}
      {!hasAnswers && (
        <p className="tw-max-w-prose tw-text-base tw-leading-8 tw-text-iron-400">
          {msg("catalogue.empty")}
        </p>
      )}
      {modules.map((id) => (
        <RecordSection
          key={id}
          id={id}
          context={context}
          profile={profile}
          consumed={consumed}
        />
      ))}
    </article>
  );
}
