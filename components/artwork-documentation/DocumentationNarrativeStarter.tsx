"use client";

import { useCallback, useState } from "react";
import type {
  FieldValue,
  ValueEditor,
} from "@/lib/artwork-documentation/registry";
import {
  DocumentationButton,
  inputClass,
  useDocumentationMessages,
} from "./DocumentationControls";

interface Props {
  readonly id: string;
  readonly label: string;
  readonly structure: string;
  readonly editor: ValueEditor;
  readonly disabled: boolean;
  readonly hasAnswer: boolean;
  readonly validate: (value: FieldValue) => boolean;
  readonly onApply: (value: FieldValue) => void;
}

/** The working text stays in memory and never enters autosave before explicit application. */
export default function DocumentationNarrativeStarter(props: Props) {
  const { msg } = useDocumentationMessages();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("");
  const [applied, setApplied] = useState(false);
  const focusStarter = useCallback((element: HTMLTextAreaElement | null) => {
    element?.focus();
  }, []);
  const localized = props.editor.kind === "localized";
  const value: FieldValue = localized
    ? {
        primary_language: language.trim(),
        versions: [
          {
            language: language.trim(),
            text: text.trim(),
            authorship: "original",
            approved_by_artist: false,
          },
        ],
      }
    : text.trim();
  const valid =
    text.trim().length > 0 &&
    !text.includes("[[") &&
    !text.includes("]]") &&
    (!localized || language.trim().length > 0) &&
    props.validate(value);
  if (!open && (props.disabled || props.hasAnswer))
    return applied ? (
      <p
        role="status"
        className="tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-300"
      >
        {msg("examples.applied")}
      </p>
    ) : null;
  return (
    <div className="tw-mt-5 tw-min-w-0 tw-max-w-prose">
      {!open ? (
        <DocumentationButton
          secondary
          className="tw-w-full sm:tw-w-auto"
          onClick={() => {
            setText(props.structure);
            setOpen(true);
            setApplied(false);
          }}
        >
          {msg("examples.adapt")}
        </DocumentationButton>
      ) : (
        <div className="tw-space-y-4 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-5">
          <p
            id={`${props.id}-starter-help`}
            className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-300"
          >
            {msg("examples.unsaved")}
          </p>
          <label
            className="tw-block tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100"
            htmlFor={`${props.id}-starter`}
          >
            {msg("examples.yourAnswer", { field: props.label })}
          </label>
          <textarea
            ref={focusStarter}
            id={`${props.id}-starter`}
            rows={6}
            className={inputClass}
            value={text}
            aria-describedby={`${props.id}-starter-help`}
            onChange={(event) => setText(event.target.value)}
          />
          {localized && (
            <label className="tw-block tw-max-w-sm tw-text-sm tw-leading-6 tw-text-iron-300">
              {msg("examples.language")}
              <input
                className={`${inputClass} tw-mt-2`}
                value={language}
                placeholder="en"
                onChange={(event) => setLanguage(event.target.value)}
              />
            </label>
          )}
          {props.hasAnswer && (
            <p role="status" className="tw-text-sm tw-text-amber-200">
              {msg("examples.answerChanged")}
            </p>
          )}
          <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-flex-wrap">
            <DocumentationButton
              className="tw-w-full sm:tw-w-auto"
              disabled={props.disabled || props.hasAnswer || !valid}
              onClick={() => {
                if (props.disabled || props.hasAnswer || !valid) return;
                (
                  document.getElementById(props.id) ??
                  document.getElementById(`${props.id}-primary`)
                )?.focus();
                props.onApply(value);
                setText("");
                setOpen(false);
                setApplied(true);
              }}
            >
              {msg("examples.apply")}
            </DocumentationButton>
            <DocumentationButton
              secondary
              className="tw-w-full sm:tw-w-auto"
              onClick={() => {
                setText("");
                setOpen(false);
                document.getElementById(`${props.id}-example`)?.focus();
              }}
            >
              {msg("examples.discard")}
            </DocumentationButton>
          </div>
        </div>
      )}
    </div>
  );
}
