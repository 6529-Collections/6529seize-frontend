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
    <div className="tw-mb-4 tw-min-w-0">
      <details className="tw-group/example tw-max-w-prose tw-text-sm">
        <summary
          id={`documentation-${props.moduleId}-${props.field.id}-example`}
          className="tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-gap-2 tw-rounded-sm tw-text-iron-400 hover:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 [&::-webkit-details-marker]:tw-hidden"
        >
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="tw-size-4 tw-shrink-0 tw-transition-transform group-open/example:tw-rotate-90 motion-reduce:tw-transition-none"
          >
            <path d="m9 6 6 6-6 6" />
          </svg>
          <span>{msg("examples.field")}</span>
        </summary>
        <p className="tw-mb-3 tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-400">
          {msg("examples.fiction")}
        </p>
        <p className="tw-m-0 tw-whitespace-pre-wrap tw-break-words tw-text-base tw-leading-7 tw-text-iron-200">
          {msg(answer)}
        </p>
        {why && (
          <p className="tw-mb-0 tw-mt-4 tw-leading-6 tw-text-iron-400">
            <span className="tw-mb-1 tw-block tw-font-medium tw-text-iron-300">
              {msg("examples.why")}
            </span>
            {msg(why)}
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
