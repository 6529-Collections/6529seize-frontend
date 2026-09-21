"use client";

import type { DocumentationValidationIssue } from "@/lib/artwork-documentation/validation";
import { documentationSchemaLabel } from "@/i18n/messages/artwork-documentation-fields";
import { documentationErrorMessageKey } from "@/lib/artwork-documentation/errors";
import { useDocumentationMessages } from "./DocumentationControls";

export default function DocumentationValidationMessages({
  id,
  issues,
  rejected = false,
  errorCode,
}: {
  readonly id?: string | undefined;
  readonly issues: readonly DocumentationValidationIssue[];
  readonly rejected?: boolean | undefined;
  readonly errorCode?: string | undefined;
}) {
  const { msg } = useDocumentationMessages();
  if (!issues.length && !rejected) return null;
  const explanation = documentationErrorMessageKey(errorCode);
  const uniqueIssues = [
    ...new Map(
      issues.map((issue) => [
        `${issue.code}:${JSON.stringify(issue.path)}`,
        issue,
      ])
    ).values(),
  ];
  return (
    <ul
      id={id}
      role="status"
      className="tw-mb-3 tw-mt-2 tw-list-none tw-space-y-2 tw-p-0 tw-text-sm tw-leading-6 tw-text-amber-200"
    >
      {uniqueIssues.map((issue) => (
        <li key={`${issue.code}:${JSON.stringify(issue.path)}`}>
          {issue.path.length > 0 && (
            <strong className="tw-font-medium">
              {issue.path
                .map((part) =>
                  typeof part === "number"
                    ? msg("validation.entry", { number: part + 1 })
                    : documentationSchemaLabel(part)
                )
                .join(" › ")}
              {": "}
            </strong>
          )}
          {msg(`validation.${issue.code}`)}
        </li>
      ))}
      {!issues.length && rejected && (
        <li>{msg(explanation ?? "validation.serverRejected")}</li>
      )}
    </ul>
  );
}
