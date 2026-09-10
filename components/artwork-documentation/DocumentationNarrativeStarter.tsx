"use client";

import { useState } from "react";
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
      <p role="status" className="tw-mt-3 tw-text-sm tw-text-iron-300">
        {msg("examples.applied")}
      </p>
    ) : null;
  return (
    <div className="tw-mt-3">
      {!open ? (
        <DocumentationButton
          secondary
          onClick={() => {
            setText(props.structure);
            setOpen(true);
            setApplied(false);
          }}
        >
          {msg("examples.adapt")}
        </DocumentationButton>
      ) : (
        <div className="tw-space-y-3 tw-border-l-2 tw-border-solid tw-border-primary-400 tw-pl-4">
          <p
            id={`${props.id}-starter-help`}
            className="tw-m-0 tw-text-sm tw-leading-relaxed tw-text-iron-300"
          >
            {msg("examples.unsaved")}
          </p>
          <label
            className="tw-block tw-text-sm tw-text-iron-200"
            htmlFor={`${props.id}-starter`}
          >
            {msg("examples.yourAnswer", { field: props.label })}
          </label>
          <textarea
            id={`${props.id}-starter`}
            rows={6}
            className={inputClass}
            value={text}
            aria-describedby={`${props.id}-starter-help`}
            onChange={(event) => setText(event.target.value)}
          />
          {localized && (
            <label className="tw-block tw-text-sm tw-text-iron-300">
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
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            <DocumentationButton
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
