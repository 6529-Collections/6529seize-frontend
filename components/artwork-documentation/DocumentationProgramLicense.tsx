"use client";

import type { useDocumentationDraft } from "@/hooks/artwork-documentation/useDocumentationDraft";
import { canEditDocumentationField } from "@/lib/artwork-documentation/capabilities";
import { ApiArtworkDocumentationOperationOpEnum } from "@/generated/models/ApiArtworkDocumentationOperation";
import {
  ApiArtworkDocumentationAnswerStatusEnum,
  ApiArtworkDocumentationAnswerIntendedVisibilityEnum,
} from "@/generated/models/ApiArtworkDocumentationAnswer";
import {
  DocumentationButton,
  useDocumentationMessages,
} from "./DocumentationControls";

const CC0_URI = "https://creativecommons.org/publicdomain/zero/1.0/";

/** Legacy records keep their existing declarations; artists explicitly apply this programme's licence. */
export default function DocumentationProgramLicense({
  draft,
}: {
  readonly draft: ReturnType<typeof useDocumentationDraft>;
}) {
  const { context, controller } = draft;
  const { msg } = useDocumentationMessages();
  if (
    context.program_id !== "6529NM-AP-01" ||
    context.profile.profile_id !== "keys_and_gates_v1" ||
    context.profile.version !== 2
  )
    return null;
  return (
    <div className="tw-max-w-prose tw-space-y-3">
      <p className="tw-m-0 tw-text-sm tw-leading-7 tw-text-iron-300">
        {msg("legacyLicenseHelp")}{" "}
        <a
          href={CC0_URI}
          target="_blank"
          rel="noopener noreferrer"
          className="tw-text-primary-300 tw-underline"
        >
          {msg("cc0Link")}
        </a>
      </p>
      {canEditDocumentationField(context, "rights.intended_license", false) && (
        <DocumentationButton
          secondary
          onClick={() =>
            controller.edit("rights", {
              op: ApiArtworkDocumentationOperationOpEnum.Set,
              field: "intended_license",
              answer: {
                status: ApiArtworkDocumentationAnswerStatusEnum.Provided,
                intended_visibility:
                  ApiArtworkDocumentationAnswerIntendedVisibilityEnum.PublicRecord,
                value: { uri: CC0_URI, label: "CC0 1.0 Universal" },
              },
            })
          }
        >
          {msg("legacyLicenseApply")}
        </DocumentationButton>
      )}
    </div>
  );
}
