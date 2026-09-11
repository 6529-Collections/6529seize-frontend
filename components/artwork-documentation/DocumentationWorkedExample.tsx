"use client";

import { useRef, useState } from "react";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import { documentationFieldLabel } from "@/i18n/messages/artwork-documentation-fields";
import type { PendingEdit } from "@/lib/artwork-documentation/draft-controller";
import {
  documentationExampleFields,
  documentationExampleKey,
} from "@/lib/artwork-documentation/examples";
import {
  MODULE_IDS,
  type DocumentationSection,
} from "@/lib/artwork-documentation/registry";
import {
  DocumentationButton,
  useDocumentationMessages,
} from "./DocumentationControls";

export default function DocumentationWorkedExample({
  context,
  section,
}: {
  readonly context: ApiArtworkDocumentationContext;
  readonly edits: readonly PendingEdit[];
  readonly section: DocumentationSection;
}) {
  const { msg } = useDocumentationMessages();
  const fields = documentationExampleFields(context.profile, section);
  const [open, setOpen] = useState(false);
  const summary = useRef<HTMLElement>(null);
  const close = () => {
    setOpen(false);
    const target = document.getElementById(
      `documentation-answers-${context.id}-${section}`
    );
    (target ?? summary.current)?.focus();
  };
  if (!fields.length && section !== "review") return null;
  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="tw-min-w-0 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-py-5"
    >
      <summary
        ref={summary}
        className="tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-start tw-justify-between tw-gap-5 tw-rounded-sm tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-primary-400 [&::-webkit-details-marker]:tw-hidden"
      >
        <span className="tw-min-w-0">
          <span className="tw-block tw-font-serif tw-text-2xl tw-font-normal tw-leading-tight">
            {msg("examples.title")}
          </span>
          <span className="tw-mt-2 tw-block tw-text-xs tw-font-normal tw-leading-5 tw-text-iron-400">
            {msg("examples.fiction")}
          </span>
        </span>
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className={`tw-mt-1 tw-size-5 tw-shrink-0 tw-text-iron-400 tw-transition-transform motion-reduce:tw-transition-none ${open ? "tw-rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="tw-mt-6 tw-space-y-8">
        <div className="tw-max-w-prose tw-space-y-4">
          <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300">
            {msg("examples.notice")}
          </p>
          <p className="tw-m-0 tw-text-base tw-leading-7 tw-text-iron-200">
            {msg("examples.scenario")}
          </p>
          <DocumentationButton secondary onClick={close}>
            {msg("examples.close")}
          </DocumentationButton>
        </div>
        {section === "review" ? (
          <p className="tw-max-w-prose tw-text-base tw-leading-7 tw-text-iron-200">
            {msg("examples.review")}
          </p>
        ) : (
          MODULE_IDS.map((moduleId) => {
            const moduleFields = fields.filter(
              (entry) => entry.moduleId === moduleId
            );
            if (!moduleFields.length) return null;
            return (
              <section key={moduleId} className="tw-min-w-0 tw-max-w-prose">
                <h3 className="tw-m-0 tw-font-serif tw-text-2xl tw-font-normal tw-leading-tight tw-text-iron-100">
                  {msg(`module.${moduleId}`)}
                </h3>
                <p className="tw-mb-6 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
                  {msg(`examples.module.${moduleId}`)}
                </p>
                <dl className="tw-m-0 tw-space-y-7">
                  {moduleFields.map(({ field }) => {
                    const key = documentationExampleKey(
                      context.profile,
                      moduleId,
                      field.id,
                      "answer"
                    )!;
                    const why = documentationExampleKey(
                      context.profile,
                      moduleId,
                      field.id,
                      "why"
                    );
                    const label =
                      (moduleId === "interview"
                        ? context.profile.interview_instrument.prompts.find(
                            (prompt) => prompt.id === field.id
                          )?.text
                        : undefined) ?? documentationFieldLabel(field.id);
                    return (
                      <div key={field.id} className="tw-min-w-0">
                        <dt className="tw-text-sm tw-font-semibold tw-leading-6 tw-text-iron-100">
                          {label}
                        </dt>
                        <dd className="tw-m-0 tw-mt-2 tw-whitespace-pre-wrap tw-break-words tw-text-base tw-leading-7 tw-text-iron-200">
                          {msg(key)}
                        </dd>
                        {why && (
                          <dd className="tw-m-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-400">
                            <span className="tw-mb-1 tw-block tw-font-medium tw-text-iron-300">
                              {msg("examples.why")}
                            </span>
                            {msg(why)}
                          </dd>
                        )}
                      </div>
                    );
                  })}
                </dl>
              </section>
            );
          })
        )}
        <p className="tw-max-w-prose tw-text-xs tw-leading-5 tw-text-iron-400">
          {msg("examples.scope")}
        </p>
        <DocumentationButton secondary onClick={close}>
          {msg("examples.close")}
        </DocumentationButton>
      </div>
    </details>
  );
}
