"use client";

import { useCallback, useRef, useState } from "react";
import { formatNumber } from "@/i18n/format";
import {
  DocumentationButton,
  inputClass,
  useDocumentationMessages,
} from "./DocumentationControls";

interface Props {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly max: number;
  readonly disabled?: boolean | undefined;
  readonly hideLabel?: boolean | undefined;
  readonly describedBy?: string | undefined;
  readonly language?: string | undefined;
}

export default function DocumentationLongText(props: Props) {
  const { msg, locale } = useDocumentationMessages();
  const [reading, setReading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const focusWriting = useRef(false);
  const focusImportReview = useCallback((element: HTMLElement | null) => {
    element?.focus();
  }, []);
  const characters = Array.from(props.value).length;
  const writingRows = Math.min(
    14,
    Math.max(
      4,
      props.value
        .split("\n")
        .reduce(
          (rows, line) => rows + Math.max(1, Math.ceil(line.length / 72)),
          0
        )
    )
  );
  const countId = `${props.id}-document-count`;
  const errorId = `${props.id}-document-error`;
  const describedBy = [
    props.describedBy,
    countId,
    characters > props.max ? errorId : undefined,
  ]
    .filter(Boolean)
    .join(" ");
  const readFile = async (file: File) => {
    setImportError(null);
    if (!/\.(txt|md)$/i.test(file.name)) {
      setImportError("museum.importError");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setImportError("museum.importTooLarge");
      return;
    }
    setImporting(true);
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(
        await file.arrayBuffer()
      );
      if (text.includes("\0")) throw new Error("Binary content");
      setImported(text);
    } catch {
      setImportError("museum.importError");
    } finally {
      setImporting(false);
    }
  };
  return (
    <div className="tw-min-w-0">
      {!reading && (
        <label
          htmlFor={props.id}
          className={
            props.hideLabel
              ? "tw-sr-only"
              : "tw-mb-3 tw-block tw-text-sm tw-text-iron-300"
          }
        >
          {props.label}
        </label>
      )}
      <div className="tw-mb-3 tw-flex tw-flex-wrap tw-items-center tw-gap-x-5 tw-gap-y-2">
        <button
          type="button"
          className="tw-min-h-11 tw-border-0 tw-bg-transparent tw-p-0 tw-text-sm tw-text-primary-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          aria-pressed={reading}
          onClick={() => {
            focusWriting.current = reading;
            setReading(!reading);
          }}
        >
          {msg(reading ? "museum.write" : "museum.readText")}
        </button>
        {!props.disabled && (
          <>
            <button
              type="button"
              disabled={importing}
              className="tw-min-h-11 tw-border-0 tw-bg-transparent tw-p-0 tw-text-sm tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50"
              onClick={() => fileInput.current?.click()}
            >
              {msg(importing ? "museum.importing" : "museum.importText")}
            </button>
            <input
              ref={fileInput}
              type="file"
              hidden
              accept=".txt,.md,text/plain,text/markdown"
              aria-label={msg("museum.importText")}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void readFile(file);
              }}
            />
          </>
        )}
      </div>
      {reading ? (
        <div
          id={props.id}
          tabIndex={0}
          role="region"
          aria-label={props.label}
          className="tw-max-w-prose tw-whitespace-pre-wrap tw-break-words tw-font-serif tw-text-lg tw-leading-8 tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-primary-400"
          dir="auto"
          lang={props.language}
        >
          {props.value || msg("museum.noText")}
        </div>
      ) : (
        <textarea
          ref={(element) => {
            if (element && focusWriting.current) {
              element.focus();
              focusWriting.current = false;
            }
          }}
          id={props.id}
          className={`${inputClass} tw-resize-y !tw-leading-8`}
          rows={writingRows}
          dir="auto"
          lang={props.language}
          value={props.value}
          readOnly={props.disabled}
          aria-describedby={describedBy}
          aria-invalid={characters > props.max}
          onChange={(event) => {
            if (!props.disabled) props.onChange(event.target.value);
          }}
        />
      )}
      <p
        id={countId}
        className="tw-mb-0 tw-mt-3 tw-text-xs tw-leading-5 tw-text-iron-400"
      >
        {msg("museum.characterCount", {
          count: formatNumber(locale, characters),
          limit: formatNumber(locale, props.max),
        })}
      </p>
      {characters > props.max && (
        <p
          id={errorId}
          role="status"
          className="tw-mt-2 tw-text-sm tw-leading-6 tw-text-amber-200"
        >
          {msg("museum.characterLimit", {
            over: formatNumber(locale, characters - props.max),
          })}
        </p>
      )}
      {importError && (
        <p
          role="alert"
          className="tw-mt-3 tw-text-sm tw-leading-6 tw-text-amber-200"
        >
          {msg(importError)}
        </p>
      )}
      {imported !== null && !props.disabled && (
        <section
          ref={focusImportReview}
          tabIndex={-1}
          className="tw-mt-6 tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-pt-5 focus-visible:tw-outline focus-visible:tw-outline-primary-400"
          aria-label={msg("museum.importReview")}
        >
          <h4 className="tw-m-0 tw-text-base tw-font-medium">
            {msg("museum.importReview")}
          </h4>
          <p className="tw-mt-3 tw-max-w-prose tw-text-sm tw-leading-6 tw-text-iron-300">
            {msg("museum.importPending")}
          </p>
          <pre
            tabIndex={0}
            aria-label={msg("museum.importReview")}
            className="tw-max-h-80 tw-overflow-y-auto tw-whitespace-pre-wrap tw-break-words tw-font-serif tw-text-base tw-leading-7 tw-text-iron-200"
            dir="auto"
          >
            {imported}
          </pre>
          {props.value && (
            <p className="tw-text-sm tw-leading-6 tw-text-iron-400">
              {msg("museum.importReplaceHelp")}
            </p>
          )}
          <div className="tw-flex tw-flex-wrap tw-gap-3">
            <DocumentationButton
              onClick={() => {
                props.onChange(imported);
                setImported(null);
                setReading(false);
                focusWriting.current = true;
              }}
            >
              {msg("museum.importReplace")}
            </DocumentationButton>
            {props.value && (
              <DocumentationButton
                secondary
                onClick={() => {
                  props.onChange(`${props.value}\n\n${imported}`);
                  setImported(null);
                  setReading(false);
                  focusWriting.current = true;
                }}
              >
                {msg("museum.importAppend")}
              </DocumentationButton>
            )}
            <DocumentationButton
              secondary
              onClick={() => {
                setImported(null);
                setReading(false);
                focusWriting.current = true;
              }}
            >
              {msg("museum.importDiscard")}
            </DocumentationButton>
          </div>
        </section>
      )}
    </div>
  );
}
