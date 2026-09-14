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
  documentationFields,
  documentationFieldSection,
  isMuseumRecord,
} from "@/lib/artwork-documentation/catalogue";
import type {
  ModuleId,
  DocumentationSection,
} from "@/lib/artwork-documentation/registry";
import { useDocumentationMessages } from "./DocumentationControls";
import DocumentationCatalogueValue, {
  documentationVisibleLabels,
} from "./DocumentationCatalogueValue";
import DocumentationRecordValue, {
  documentationLanguageName,
} from "./DocumentationRecordValue";

export { default as DocumentationValueSummary } from "./DocumentationRecordValue";

interface RecordContext {
  readonly work_id?: string | undefined;
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

export function DocumentationRecordedAnswer({
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
  const { msg, locale } = useDocumentationMessages();
  if (isRedacted(answer))
    return <span className="tw-text-iron-400">{msg("redacted")}</span>;
  const editor = documentationFields(context.profile, moduleId).find(
    (item) => item.id === field
  )?.editor;
  const translateEnum =
    editor?.kind === "choice" ||
    editor?.kind === "multi_choice" ||
    (editor?.kind === "list" && editor.item.kind === "choice");
  const provided =
    answer.status === ApiArtworkDocumentationAnswerStatusEnum.Provided;
  const value: unknown = answer.value;
  let readableValue = provided
    ? value
    : documentationOptionLabel(answer.status ?? "unknown");
  if (provided && ["title_language", "record_language"].includes(field))
    readableValue = documentationLanguageName(value, locale);
  else if (provided && field === "languages" && Array.isArray(value))
    readableValue = value.map((language: unknown) =>
      documentationLanguageName(language, locale)
    );
  let content = (
    <DocumentationRecordValue
      translateEnum={provided && translateEnum}
      value={readableValue}
    />
  );
  if (provided && editor?.kind === "asset")
    content = <RecordFiles value={value} assets={context.assets} />;
  if (provided && editor && context.profile && isMuseumRecord(context.profile))
    content = (
      <DocumentationCatalogueValue
        value={value}
        editor={editor}
        labels={documentationVisibleLabels(
          context.modules,
          context.assets,
          context.work_id
        )}
      />
    );
  return (
    <>
      {content}
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

function RecordFiles({
  value,
  assets,
}: {
  readonly value: unknown;
  readonly assets: RecordContext["assets"];
}) {
  const { msg } = useDocumentationMessages();
  const ids = (Array.isArray(value) ? value : [value]).filter(
    (id): id is string => typeof id === "string"
  );
  return (
    <ul className="tw-m-0 tw-list-none tw-space-y-4 tw-p-0">
      {ids.map((id) => {
        const asset = assets?.find((item) => item.id === id);
        return (
          <li key={id} className="tw-break-words">
            {asset?.filename ?? msg("catalogue.fileRecorded")}
            <details className="tw-mt-1 tw-text-sm tw-text-iron-400">
              <summary className="tw-min-h-11 tw-cursor-pointer tw-py-3 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
                {msg("catalogue.fileReference")}
              </summary>
              <code className="tw-break-all tw-text-xs tw-text-iron-400">
                {id}
              </code>
            </details>
          </li>
        );
      })}
    </ul>
  );
}

function RecordSection({
  id,
  context,
  profile,
  consumed,
  section,
}: {
  readonly id: ModuleId;
  readonly context: RecordContext;
  readonly profile?: ApiArtworkDocumentationProfile | undefined;
  readonly consumed: ReadonlySet<string>;
  readonly section?: DocumentationSection | undefined;
}) {
  const { msg } = useDocumentationMessages();
  const fields = documentationFields(profile ?? context.profile, id);
  const order = fields.map((field) => field.id);
  const entries = Object.entries(context.modules[id]?.answers ?? {})
    .filter(
      ([field]) =>
        !consumed.has(id + "." + field) &&
        (!section ||
          documentationFieldSection(profile ?? context.profile, id, field) ===
            section)
    )
    .sort(([first], [second]) => {
      const a = order.indexOf(first);
      const b = order.indexOf(second);
      return (a < 0 ? order.length : a) - (b < 0 ? order.length : b);
    });
  if (!entries.length) return null;
  const references = entries.filter(([field]) => !order.includes(field));
  return (
    <section className="tw-grid tw-gap-6 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-10 lg:tw-grid-cols-[11rem_minmax(0,1fr)] lg:tw-gap-12">
      <h3 className="tw-m-0 tw-font-serif tw-text-2xl tw-font-normal tw-leading-tight tw-text-iron-100">
        {msg("catalogue.section." + id)}
      </h3>
      <div className="tw-min-w-0">
        <dl className="tw-m-0 tw-grid tw-min-w-0 tw-grid-cols-1 tw-gap-x-8 tw-gap-y-8 sm:tw-grid-cols-2">
          {entries
            .filter(([field]) => order.includes(field))
            .map(([field, answer]) => {
              const definition = fields.find((entry) => entry.id === field);
              const narrative =
                narrativeFields.has(field) ||
                ["object", "list", "localized"].includes(
                  definition?.editor.kind ?? ""
                );
              const label =
                (id === "interview"
                  ? (
                      profile ?? context.profile
                    )?.interview_instrument.prompts.find(
                      (prompt) => prompt.id === field
                    )?.text
                  : undefined) ??
                definition?.label ??
                documentationFieldLabel(field);
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
                    <DocumentationRecordedAnswer
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
        {references.length > 0 && (
          <details className="tw-mt-6 tw-text-sm tw-text-iron-400">
            <summary className="tw-min-h-11 tw-cursor-pointer tw-py-3 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
              {msg("catalogue.references")}
            </summary>
            <dl className="tw-m-0 tw-space-y-5">
              {references.map(([field, answer]) => (
                <div key={field}>
                  <dt className="tw-mb-2">{documentationFieldLabel(field)}</dt>
                  <dd className="tw-m-0 tw-break-words tw-leading-7">
                    <DocumentationRecordedAnswer
                      answer={answer}
                      moduleId={id}
                      field={field}
                      context={context}
                    />
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        )}
      </div>
    </section>
  );
}

/** A reading view of the supplied projection, never a separate publication filter. */
export default function DocumentationSummary({
  context,
  profile,
  modules = RECORD_ORDER,
  showHeading = true,
  headingLevel = 2,
  media,
  section,
}: {
  readonly profile?: ApiArtworkDocumentationProfile | undefined;
  readonly context: RecordContext;
  readonly modules?: readonly ModuleId[];
  readonly showHeading?: boolean;
  readonly headingLevel?: 1 | 2;
  readonly media?: ReactNode;
  readonly section?: DocumentationSection | undefined;
}) {
  const { msg } = useDocumentationMessages();
  const Heading = headingLevel === 1 ? "h1" : "h2";
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
  const hasAnswers = modules.some((id) =>
    Object.keys(context.modules[id]?.answers ?? {}).some(
      (field) =>
        !section ||
        documentationFieldSection(profile ?? context.profile, id, field) ===
          section
    )
  );
  return (
    <article aria-label={msg("catalogue.label")} className="tw-min-w-0">
      {media !== undefined && media !== null && media !== false && (
        <div className="tw-mb-10 empty:tw-hidden">{media}</div>
      )}
      {showHeading && (
        <header className="tw-pb-10 tw-pt-4">
          <p className="tw-mb-5 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.18em] tw-text-iron-400">
            {msg("catalogue.eyebrow")}
          </p>
          <Heading className="tw-m-0 tw-max-w-3xl tw-break-words tw-font-serif tw-text-4xl tw-font-normal tw-leading-[1.1] tw-text-iron-50 sm:tw-text-5xl">
            {title ?? msg("untitled")}
          </Heading>
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
                    <DocumentationRecordedAnswer
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
          <DocumentationRecordedAnswer
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
          section={section}
        />
      ))}
    </article>
  );
}
