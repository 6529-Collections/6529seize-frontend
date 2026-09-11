"use client";

import {
  documentationFieldLabel,
  documentationOptionLabel,
} from "@/i18n/messages/artwork-documentation-fields";
import { useDocumentationMessages } from "./DocumentationControls";

interface Props {
  readonly value: unknown;
  readonly translateEnum?: boolean;
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function languageName(language: unknown, locale: string): string {
  if (typeof language !== "string" || !language) return "";
  try {
    return (
      new Intl.DisplayNames([locale], { type: "language" }).of(language) ??
      language
    );
  } catch {
    return language;
  }
}

function NarrativeValue({
  record,
}: {
  readonly record: Record<string, unknown>;
}) {
  const { msg, locale } = useDocumentationMessages();
  const versions = (record["versions"] as unknown[])
    .map(objectValue)
    .filter(
      (version): version is Record<string, unknown> =>
        !!version && typeof version["text"] === "string"
    );
  const primary =
    versions.find(
      (version) => version["language"] === record["primary_language"]
    ) ?? versions[0];
  if (!primary) return null;
  const translations = versions.filter((version) => version !== primary);
  return (
    <div>
      <div
        lang={
          typeof primary["language"] === "string"
            ? primary["language"]
            : undefined
        }
        className="tw-whitespace-pre-wrap tw-break-words tw-text-base tw-leading-8 tw-text-iron-200"
      >
        {String(primary["text"])}
      </div>
      <details className="tw-mt-3 tw-text-sm tw-text-iron-400">
        <summary className="tw-min-h-11 tw-cursor-pointer tw-py-3 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
          {msg("catalogue.languages")}
        </summary>
        <p className="tw-m-0 tw-leading-6">
          {languageName(primary["language"], locale)}
          {typeof primary["authorship"] === "string" && (
            <> · {documentationOptionLabel(primary["authorship"])}</>
          )}
          {primary["approved_by_artist"] === true && (
            <> · {msg("catalogue.artistReviewed")}</>
          )}
        </p>
        {translations.map((version, index) => (
          <div key={index} className="tw-mt-5">
            <p className="tw-mb-2 tw-text-sm tw-text-iron-400">
              {languageName(version["language"], locale)}
              {typeof version["authorship"] === "string" && (
                <> · {documentationOptionLabel(version["authorship"])}</>
              )}
              {version["approved_by_artist"] === true && (
                <> · {msg("catalogue.artistReviewed")}</>
              )}
            </p>
            <p
              lang={
                typeof version["language"] === "string"
                  ? version["language"]
                  : undefined
              }
              className="tw-m-0 tw-whitespace-pre-wrap tw-break-words tw-text-base tw-leading-8 tw-text-iron-200"
            >
              {String(version["text"])}
            </p>
          </div>
        ))}
      </details>
    </div>
  );
}

/** Read structured answers as prose and facts while retaining their recorded distinctions. */
export default function DocumentationRecordValue({
  value,
  translateEnum = false,
}: Props) {
  const { msg } = useDocumentationMessages();
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean")
    return <span>{msg(value ? "yes" : "no")}</span>;
  if (typeof value === "string" || typeof value === "number")
    return (
      <span className="tw-whitespace-pre-wrap tw-break-words">
        {translateEnum
          ? documentationOptionLabel(String(value))
          : String(value)}
      </span>
    );
  if (Array.isArray(value))
    return (
      <ul className="tw-m-0 tw-space-y-4 tw-pl-5">
        {value.map((entry, index) => (
          <li key={index}>
            <DocumentationRecordValue
              value={entry}
              translateEnum={translateEnum}
            />
          </li>
        ))}
      </ul>
    );
  const record = objectValue(value);
  if (!record) return null;
  if (
    typeof record["primary_language"] === "string" &&
    Array.isArray(record["versions"])
  )
    return <NarrativeValue record={record} />;
  if (
    typeof record["precision"] === "string" &&
    typeof record["start"] === "string"
  )
    return (
      <span>
        {record["approximate"] === true && <>{msg("catalogue.approximate")} </>}
        {record["start"]}
        {typeof record["end"] === "string" && record["end"] && (
          <> – {record["end"]}</>
        )}
      </span>
    );
  if (
    typeof record["kind"] === "string" &&
    Object.keys(record).every((key) =>
      ["kind", "detail", "explanation"].includes(key)
    )
  )
    return (
      <div>
        <span>{documentationOptionLabel(record["kind"])}</span>
        {["detail", "explanation"].map((key) =>
          typeof record[key] === "string" && record[key] ? (
            <p
              key={key}
              className="tw-mb-0 tw-mt-2 tw-whitespace-pre-wrap tw-break-words tw-leading-7"
            >
              {record[key]}
            </p>
          ) : null
        )}
      </div>
    );
  return (
    <dl className="tw-m-0 tw-space-y-3">
      {Object.entries(record).map(([key, item]) => (
        <div key={key}>
          <dt className="tw-mb-1 tw-text-sm tw-text-iron-400">
            {documentationFieldLabel(key)}
          </dt>
          <dd className="tw-m-0 tw-text-base tw-leading-7 tw-text-iron-200">
            <DocumentationRecordValue
              value={item}
              translateEnum={[
                "kind",
                "kinds",
                "precision",
                "endpoint_precision",
                "scope",
                "authorship",
                "intended_visibility",
                "status",
              ].includes(key)}
            />
          </dd>
        </div>
      ))}
    </dl>
  );
}
