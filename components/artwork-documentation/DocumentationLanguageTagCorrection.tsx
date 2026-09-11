"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { compareLocalized } from "@/i18n/format";
import { documentationLanguageName } from "./DocumentationRecordValue";
import {
  DocumentationButton,
  inputClass,
  useDocumentationMessages,
} from "./DocumentationControls";

const COMMON_LANGUAGES = [
  "en",
  "es",
  "fr",
  "de",
  "it",
  "pt",
  "nl",
  "sv",
  "pl",
  "uk",
  "ru",
  "ar",
  "he",
  "tr",
  "hi",
  "bn",
  "zh-Hans",
  "zh-Hant",
  "ja",
  "ko",
  "id",
];

function canonicalLanguage(language: string): string | undefined {
  try {
    return Intl.getCanonicalLocales(language)[0];
  } catch {
    return undefined;
  }
}

export default function LanguageTagCorrection({
  language,
  otherLanguages,
  onApply,
  onClose,
}: {
  readonly language: string;
  readonly otherLanguages: readonly string[];
  readonly onApply: (language: string) => void;
  readonly onClose: () => void;
}) {
  const { msg, locale } = useDocumentationMessages();
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const focusCustomInput = useCallback((element: HTMLInputElement | null) => {
    input.current = element;
    element?.focus();
  }, []);
  const select = useRef<HTMLSelectElement>(null);
  const [tag, setTag] = useState(language);
  const [custom, setCustom] = useState(false);
  const [error, setError] = useState(false);
  const options = [...new Set([...COMMON_LANGUAGES, language])]
    .filter(Boolean)
    .map((value) => ({
      value,
      label: documentationLanguageName(value, locale),
    }))
    .sort((a, b) => compareLocalized(locale, a.label, b.label, {}));
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element?.showModal();
    select.current?.focus();
    return () => {
      element?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  useEffect(() => {
    if (tag === language) return;
    const protect = (event: BeforeUnloadEvent) => event.preventDefault();
    globalThis.addEventListener("beforeunload", protect);
    return () => globalThis.removeEventListener("beforeunload", protect);
  }, [tag, language]);
  return createPortal(
    <dialog
      ref={dialog}
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-help`}
      style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
      className="tailwind-scope tw-max-h-[calc(100dvh_-_2rem)] tw-w-[calc(100%_-_2rem)] tw-max-w-md tw-overflow-y-auto tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-6 tw-text-iron-100 backdrop:tw-bg-black/75"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const canonical = canonicalLanguage(tag);
          if (
            !canonical ||
            tag.length > 64 ||
            otherLanguages.some(
              (other) => canonicalLanguage(other) === canonical
            )
          ) {
            setError(true);
            if (custom) input.current?.focus();
            else select.current?.focus();
            return;
          }
          onApply(canonical);
        }}
        className="tw-space-y-5"
      >
        <h2
          id={`${id}-title`}
          className="tw-m-0 tw-font-serif tw-text-2xl tw-font-normal"
        >
          {msg("chapters.changeLanguage")}
        </h2>
        <p
          id={`${id}-help`}
          className="tw-m-0 tw-text-sm tw-leading-7 tw-text-iron-300"
        >
          {msg("chapters.languageCorrectionHelp")}
        </p>
        <label className="tw-block tw-text-sm tw-text-iron-300">
          {msg("language")}
          <select
            ref={select}
            className={`${inputClass} tw-mt-2`}
            value={custom ? "__other__" : tag}
            aria-invalid={error && !custom}
            aria-describedby={error ? `${id}-error` : `${id}-help`}
            onChange={(event) => {
              const other = event.target.value === "__other__";
              setCustom(other);
              if (!other) setTag(event.target.value);
              setError(false);
            }}
          >
            <option value="">{msg("choose")}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            <option value="__other__">{msg("chapters.otherLanguage")}</option>
          </select>
        </label>
        {custom && (
          <div>
            <label className="tw-block tw-text-sm tw-text-iron-300">
              {msg("chapters.languageTag")}
              <input
                ref={focusCustomInput}
                className={`${inputClass} tw-mt-2`}
                value={tag}
                aria-invalid={error}
                aria-describedby={error ? `${id}-error` : `${id}-tag-help`}
                onChange={(event) => {
                  setTag(event.target.value);
                  setError(false);
                }}
              />
            </label>
            <span
              id={`${id}-tag-help`}
              className="tw-mt-2 tw-block tw-text-xs tw-leading-6 tw-text-iron-400"
            >
              {msg("chapters.languageTagHelp")}
            </span>
          </div>
        )}
        {error && (
          <p
            id={`${id}-error`}
            role="alert"
            className="tw-text-sm tw-leading-6 tw-text-amber-200"
          >
            {msg("chapters.languageCorrectionError")}
          </p>
        )}
        <p role="status" className="tw-text-xs tw-leading-6 tw-text-iron-400">
          {msg("chapters.languageCorrectionPending")}
        </p>
        <div className="tw-flex tw-flex-wrap tw-gap-3">
          <DocumentationButton type="submit">
            {msg("chapters.applyLanguage")}
          </DocumentationButton>
          <DocumentationButton secondary onClick={onClose}>
            {msg("chapters.cancelLanguage")}
          </DocumentationButton>
        </div>
      </form>
    </dialog>,
    document.body
  );
}
