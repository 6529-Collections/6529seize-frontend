"use client";

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
import { MODULE_IDS } from "@/lib/artwork-documentation/registry";
import { panelClass, useDocumentationMessages } from "./DocumentationControls";

export function DocumentationValueSummary({
  value,
  translateEnum = false,
}: {
  readonly value: unknown;
  readonly translateEnum?: boolean;
}) {
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
  if (typeof value !== "object") return null;
  if (Array.isArray(value))
    return (
      <ul className="tw-m-0 tw-space-y-3 tw-pl-5">
        {(value as readonly unknown[]).map((entry, index) => (
          <li key={index}>
            <DocumentationValueSummary
              value={entry}
              translateEnum={translateEnum}
            />
          </li>
        ))}
      </ul>
    );
  return (
    <dl className="tw-m-0 tw-space-y-2">
      {Object.entries(value as Record<string, unknown>).map(([key, item]) => (
        <div key={key}>
          <dt className="tw-text-xs tw-text-iron-400">
            {documentationFieldLabel(key)}
          </dt>
          <dd className="tw-m-0 tw-text-sm tw-text-iron-200">
            <DocumentationValueSummary
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

export default function DocumentationSummary({
  context,
  profile,
}: {
  readonly profile?: ApiArtworkDocumentationProfile | undefined;
  readonly context: {
    readonly profile?: ApiArtworkDocumentationProfile | undefined;
    readonly modules: Record<
      string,
      { readonly answers: Record<string, ApiArtworkDocumentationAnswer> }
    >;
  };
}) {
  const { msg } = useDocumentationMessages();
  const modules = Object.fromEntries(
    Object.entries(context.modules).map(([id, module]) => [id, module.answers])
  );
  return (
    <div className="tw-space-y-4">
      {MODULE_IDS.map((id) => (
        <section key={id} className={panelClass}>
          <h3 className="tw-mb-4 tw-text-base tw-font-semibold">
            {msg(`module.${id}`)}
          </h3>
          <dl className="tw-m-0 tw-space-y-5">
            {Object.entries(modules[id] ?? {}).map(([field, raw]) => {
              const answer = raw;
              return (
                <div key={field}>
                  <dt className="tw-mb-2 tw-text-sm tw-font-medium tw-text-iron-100">
                    {(id === "interview"
                      ? (
                          profile ?? context.profile
                        )?.interview_instrument.prompts.find(
                          (prompt) => prompt.id === field
                        )?.text
                      : undefined) ?? documentationFieldLabel(field)}
                  </dt>
                  <dd className="tw-m-0 tw-text-sm tw-text-iron-300">
                    {isRedacted(answer) ? (
                      msg("redacted")
                    ) : (
                      <>
                        <DocumentationValueSummary
                          value={
                            answer.status ===
                            ApiArtworkDocumentationAnswerStatusEnum.Provided
                              ? (answer.value as unknown)
                              : documentationOptionLabel(
                                  answer.status ?? "unknown"
                                )
                          }
                        />
                        {answer.explanation && (
                          <p className="tw-mt-2 tw-whitespace-pre-wrap tw-break-words">
                            {answer.explanation}
                          </p>
                        )}
                        {answer.intended_visibility ===
                          ApiArtworkDocumentationAnswerIntendedVisibilityEnum.Restricted && (
                          <p className="tw-mt-2 tw-text-xs tw-text-iron-400">
                            {msg("restricted")}
                          </p>
                        )}
                      </>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      ))}
    </div>
  );
}
