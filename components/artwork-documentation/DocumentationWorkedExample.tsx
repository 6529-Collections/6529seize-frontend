"use client";

import { useRef, useState } from "react";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
import { documentationFieldLabel } from "@/i18n/messages/artwork-documentation-fields";
import { readAnswer } from "@/lib/artwork-documentation/answers";
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
  edits,
  section,
}: {
  readonly context: ApiArtworkDocumentationContext;
  readonly edits: readonly PendingEdit[];
  readonly section: DocumentationSection;
}) {
  const { msg } = useDocumentationMessages();
  const fields = documentationExampleFields(context.profile, section);
  const [open, setOpen] = useState(
    () =>
      section !== "review" &&
      fields.length > 0 &&
      fields.every(
        ({ moduleId, field }) => !readAnswer(context, moduleId, field.id, edits)
      )
  );
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
      className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-4 sm:tw-p-6"
    >
      <summary
        ref={summary}
        className="tw-min-h-11 tw-cursor-pointer tw-text-base tw-font-semibold tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        {msg("examples.title")}
      </summary>
      <div className="tw-mt-3 tw-space-y-5">
        <DocumentationButton secondary onClick={close}>
          {msg("examples.close")}
        </DocumentationButton>
        <div>
          <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-primary-300">
            {msg("examples.fiction")}
          </p>
          <p className="tw-mt-3 tw-text-sm tw-leading-relaxed tw-text-iron-200">
            {msg("examples.notice")}
          </p>
          <p className="tw-m-0 tw-text-sm tw-leading-relaxed tw-text-iron-300">
            {msg("examples.scenario")}
          </p>
        </div>
        {section === "review" ? (
          <p className="tw-text-sm tw-leading-relaxed tw-text-iron-200">
            {msg("examples.review")}
          </p>
        ) : (
          MODULE_IDS.map((moduleId) => {
            const moduleFields = fields.filter(
              (entry) => entry.moduleId === moduleId
            );
            if (!moduleFields.length) return null;
            return (
              <section key={moduleId}>
                <h3 className="tw-text-base tw-font-semibold tw-text-iron-100">
                  {msg(`module.${moduleId}`)}
                </h3>
                <p className="tw-text-sm tw-leading-relaxed tw-text-iron-400">
                  {msg(`examples.module.${moduleId}`)}
                </p>
                <dl className="tw-m-0 tw-divide-y tw-divide-solid tw-divide-iron-800">
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
                      <div key={field.id} className="tw-py-4">
                        <dt className="tw-text-sm tw-font-semibold tw-text-iron-100">
                          {label}
                        </dt>
                        <dd className="tw-m-0 tw-mt-2 tw-whitespace-pre-wrap tw-break-words tw-text-sm tw-leading-relaxed tw-text-iron-200">
                          {msg(key)}
                        </dd>
                        {why && (
                          <dd className="tw-m-0 tw-mt-2 tw-text-sm tw-leading-relaxed tw-text-iron-400">
                            {msg("examples.why")}: {msg(why)}
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
        <p className="tw-text-xs tw-leading-relaxed tw-text-iron-400">
          {msg("examples.scope")}
        </p>
        <DocumentationButton secondary onClick={close}>
          {msg("examples.close")}
        </DocumentationButton>
      </div>
    </details>
  );
}
