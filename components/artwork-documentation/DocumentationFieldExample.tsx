"use client";

import type { ApiArtworkDocumentationProfile } from "@/generated/models/ApiArtworkDocumentationProfile";
import { documentationExampleKey } from "@/lib/artwork-documentation/examples";
import type {
  DocumentationField,
  FieldValue,
  ModuleId,
} from "@/lib/artwork-documentation/registry";
import DocumentationNarrativeStarter from "./DocumentationNarrativeStarter";
import { useDocumentationMessages } from "./DocumentationControls";

export default function DocumentationFieldExample(props: {
  readonly profile: ApiArtworkDocumentationProfile;
  readonly moduleId: ModuleId;
  readonly field: DocumentationField;
  readonly label: string;
  readonly disabled: boolean;
  readonly hasAnswer: boolean;
  readonly validate: (value: FieldValue) => boolean;
  readonly onApply: (value: FieldValue) => void;
}) {
  const { msg } = useDocumentationMessages();
  const answer = documentationExampleKey(
    props.profile,
    props.moduleId,
    props.field.id,
    "answer"
  );
  if (!answer) return null;
  const why = documentationExampleKey(
    props.profile,
    props.moduleId,
    props.field.id,
    "why"
  );
  const starter = documentationExampleKey(
    props.profile,
    props.moduleId,
    props.field.id,
    "starter"
  );
  const canAdapt =
    starter !== undefined &&
    (props.field.editor.kind === "localized" ||
      (props.field.editor.kind === "text" &&
        props.field.editor.multiline === true));
  return (
    <div className="tw-mb-4">
      <details className="tw-text-sm">
        <summary
          id={`documentation-${props.moduleId}-${props.field.id}-example`}
          className="tw-flex tw-min-h-11 tw-cursor-pointer tw-items-center tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          {msg("examples.field")}
        </summary>
        <p className="tw-mt-1 tw-text-xs tw-font-semibold tw-text-iron-400">
          {msg("examples.fiction")}
        </p>
        <p className="tw-whitespace-pre-wrap tw-break-words tw-leading-relaxed tw-text-iron-200">
          {msg(answer)}
        </p>
        {why && (
          <p className="tw-leading-relaxed tw-text-iron-400">
            {msg("examples.why")}: {msg(why)}
          </p>
        )}
        {canAdapt && (
          <DocumentationNarrativeStarter
            id={`documentation-${props.moduleId}-${props.field.id}`}
            label={props.label}
            structure={msg(starter)}
            editor={props.field.editor}
            disabled={props.disabled}
            hasAnswer={props.hasAnswer}
            validate={props.validate}
            onApply={props.onApply}
          />
        )}
      </details>
    </div>
  );
}
