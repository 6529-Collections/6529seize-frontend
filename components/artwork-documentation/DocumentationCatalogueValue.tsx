"use client";

import { documentationFieldLabel } from "@/i18n/messages/artwork-documentation-fields";
import {
  recordValue,
  type ValueEditor,
} from "@/lib/artwork-documentation/registry";
import DocumentationRecordValue, {
  documentationLanguageName,
} from "./DocumentationRecordValue";
import { useDocumentationMessages } from "./DocumentationControls";

interface Props {
  readonly value: unknown;
  readonly editor: ValueEditor;
  readonly labels: ReadonlyMap<string, string>;
}

/** Read with the record's schema and visible identities, retaining the complete text and relationships. */
export default function DocumentationCatalogueValue({
  value,
  editor,
  labels,
}: Props) {
  const { msg, locale } = useDocumentationMessages();
  if (editor.kind === "identity") return null;
  if (editor.kind === "language" && typeof value === "string")
    return <span>{documentationLanguageName(value, locale)}</span>;
  if (editor.kind === "asset" || editor.kind === "reference") {
    const values = (Array.isArray(value) ? value : [value]).filter(
      (item): item is string => typeof item === "string"
    );
    return (
      <ul className="tw-m-0 tw-list-none tw-space-y-2 tw-p-0">
        {values.map((id) => (
          <li key={id}>
            {labels.get(id) ?? msg("museum.unresolvedReference", { id })}
          </li>
        ))}
      </ul>
    );
  }
  if (editor.kind === "multi_choice" && Array.isArray(value))
    return (
      <p className="tw-m-0">
        {value
          .map(
            (item: unknown) =>
              editor.options.find((option) => option.id === item)?.label ??
              String(item)
          )
          .join(" · ")}
      </p>
    );
  if (editor.kind === "object")
    return <CatalogueObject value={value} editor={editor} labels={labels} />;
  if (editor.kind === "list" && Array.isArray(value))
    return (
      <div className="tw-space-y-8">
        {value.map((item: unknown, index) => (
          <div
            key={index}
            className="tw-min-w-0 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-5"
          >
            <DocumentationCatalogueValue
              value={item}
              editor={editor.item}
              labels={labels}
            />
          </div>
        ))}
      </div>
    );
  if (editor.kind === "text" && editor.multiline && typeof value === "string")
    return (
      <div
        className="tw-max-w-prose tw-whitespace-pre-wrap tw-break-words tw-font-serif tw-text-lg tw-leading-8 tw-text-iron-200"
        dir="auto"
      >
        {value}
      </div>
    );
  return (
    <DocumentationRecordValue
      value={value}
      translateEnum={editor.kind === "choice"}
    />
  );
}

function CatalogueObject({
  value,
  editor,
  labels,
}: Props & { readonly editor: Extract<ValueEditor, { kind: "object" }> }) {
  const { msg } = useDocumentationMessages();
  const record = recordValue(value);
  const title = record["title"] ?? record["name"];
  const titleKey = record["title"] === title ? "title" : "name";
  const fields = Object.entries(record).filter(
    ([key]) => key !== "id" && (typeof title !== "string" || key !== titleKey)
  );
  return (
    <div className="tw-min-w-0 tw-space-y-5">
      {typeof title === "string" && (
        <h4 className="tw-m-0 tw-font-serif tw-text-2xl tw-font-normal tw-leading-8">
          {title}
        </h4>
      )}
      <dl className="tw-m-0 tw-space-y-5">
        {fields.map(([key, item]) => (
          <div key={key} className="tw-min-w-0">
            <dt className="tw-mb-2 tw-text-sm tw-text-iron-400">
              {editor.fields[key]?.label ?? documentationFieldLabel(key)}
            </dt>
            <dd className="tw-m-0 tw-min-w-0">
              {editor.fields[key] ? (
                <DocumentationCatalogueValue
                  value={item}
                  editor={editor.fields[key]}
                  labels={labels}
                />
              ) : (
                <DocumentationRecordValue
                  value={item}
                  translateEnum={key === "kind"}
                />
              )}
            </dd>
          </div>
        ))}
      </dl>
      {typeof record["id"] === "string" && (
        <details className="tw-text-xs tw-text-iron-500">
          <summary className="tw-min-h-11 tw-cursor-pointer tw-py-3">
            {msg("museum.recordIdentifier")}
          </summary>
          <code className="tw-break-all">{record["id"]}</code>
        </details>
      )}
    </div>
  );
}

export function documentationVisibleLabels(
  modules: Readonly<
    Record<
      string,
      {
        readonly answers: Readonly<
          Record<string, { readonly value?: unknown }>
        >;
      }
    >
  >,
  assets: readonly { readonly id: string; readonly filename: string }[] = [],
  workId?: string
): ReadonlyMap<string, string> {
  const labels = new Map(assets.map((asset) => [asset.id, asset.filename]));
  const workTitle: unknown = modules["artwork"]?.answers["title"]?.value;
  if (workId && typeof workTitle === "string") labels.set(workId, workTitle);
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const record = recordValue(value);
    const label =
      record["title"] ?? record["name"] ?? record["label"] ?? record["text"];
    if (typeof record["id"] === "string" && typeof label === "string")
      labels.set(record["id"], label);
    Object.values(record)
      .filter((item) => typeof item === "object" && item !== null)
      .forEach(visit);
  };
  Object.values(modules).forEach((module) =>
    Object.values(module.answers).forEach((answer) => visit(answer.value))
  );
  return labels;
}
