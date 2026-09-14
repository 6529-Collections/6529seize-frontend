"use client";

import Link from "next/link";
import type { ApiArtworkDocumentationProfile } from "@/generated/models/ApiArtworkDocumentationProfile";
import {
  AN_ALTERATION_EXAMPLE_PATH,
  anAlterationExcerpt,
} from "@/lib/artwork-documentation/an-alteration";
import { lookupMediaExample } from "@/lib/artwork-documentation/media-examples";
import type {
  DocumentationField,
  FieldValue,
  ModuleId,
} from "@/lib/artwork-documentation/registry";
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
  return (
    <DocumentationExampleExcerpt
      moduleId={props.moduleId}
      fieldId={props.field.id}
    />
  );
}

export function DocumentationExampleExcerpt({
  moduleId,
  fieldId,
}: {
  readonly moduleId: string;
  readonly fieldId: string;
}) {
  const { msg } = useDocumentationMessages();
  const originalExcerpt = anAlterationExcerpt(moduleId, fieldId);
  const mediaExample = originalExcerpt
    ? undefined
    : lookupMediaExample(moduleId, fieldId);
  const excerpt = originalExcerpt ?? mediaExample?.text;
  if (!excerpt) return null;
  return (
    <details className="tw-group/example tw-mb-4 tw-max-w-prose tw-text-sm">
      <summary className="tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-gap-2 tw-rounded-sm tw-text-iron-400 hover:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 [&::-webkit-details-marker]:tw-hidden">
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
        <span>{msg("museum.excerpt")}</span>
      </summary>
      <p className="tw-mb-3 tw-mt-2 tw-text-xs tw-leading-5 tw-text-iron-400">
        {mediaExample
          ? msg("museum.mediaExampleAttribution", {
              title: mediaExample.workTitle,
              medium: mediaExample.medium,
            })
          : msg("museum.excerptAttribution")}
      </p>
      <blockquote
        className="tw-m-0 tw-whitespace-pre-wrap tw-break-words tw-border-0 tw-font-serif tw-text-lg tw-leading-8 tw-text-iron-200"
        lang="en"
      >
        {excerpt}
      </blockquote>
      {!mediaExample && (
        <Link
          href={AN_ALTERATION_EXAMPLE_PATH}
          target="_blank"
          rel="noopener noreferrer"
          className="tw-mt-4 tw-inline-flex tw-min-h-11 tw-items-center tw-text-sm tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-primary-400"
        >
          {msg("museum.sample")}
        </Link>
      )}
    </details>
  );
}
