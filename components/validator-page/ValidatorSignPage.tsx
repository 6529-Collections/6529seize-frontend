"use client";

import "@/i18n/namespaces/validator-sign";
import { useCallback, useRef, useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  GrantParseError,
  MAX_GRANT_BYTES,
  parseValidatorGrant,
  type ValidatorGrant,
} from "@/lib/validator-page/grant";
import ValidatorGrantReview from "./ValidatorGrantReview";
import ValidatorGrantSigner from "./ValidatorGrantSigner";
import ValidatorPageFrame, { ValidatorPageHeader } from "./ValidatorPageFrame";
import { SECONDARY_BUTTON } from "./validatorStyles";

export default function ValidatorSignPage() {
  const locale = useBrowserLocale();
  const [grant, setGrant] = useState<ValidatorGrant | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const readGeneration = useRef(0);
  const focusReview = useCallback((heading: HTMLHeadingElement | null) => {
    heading?.focus();
  }, []);

  function load(contents: string) {
    setError(null);
    try {
      setGrant(parseValidatorGrant(contents));
      setText("");
    } catch (cause) {
      setGrant(null);
      const code = cause instanceof GrantParseError ? cause.code : "invalid";
      setError(t(locale, `validator.sign.error.${code}`));
    }
  }

  async function readFile(file: File | undefined) {
    const generation = ++readGeneration.current;
    setError(null);
    if (!file) return;
    if (file.size > MAX_GRANT_BYTES) {
      setError(t(locale, "validator.sign.error.tooLarge"));
      return;
    }
    try {
      const contents = await file.text();
      if (readGeneration.current === generation) load(contents);
    } catch {
      if (readGeneration.current === generation)
        setError(t(locale, "validator.sign.error.read"));
    }
  }

  return (
    <ValidatorPageFrame current="sign">
      <ValidatorPageHeader
        eyebrow={t(locale, "validator.sign.eyebrow")}
        title={t(locale, "validator.sign.title")}
      >
        <p className="tw-mb-0 tw-mt-3 tw-max-w-2xl tw-text-base tw-leading-7 tw-text-iron-300">
          {t(locale, "validator.sign.intro")}
        </p>
      </ValidatorPageHeader>
      {!grant ? (
        <section
          aria-labelledby="load-grant"
          className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/60 tw-p-5 sm:tw-p-6"
        >
          <h2
            id="load-grant"
            className="tw-mb-3 tw-text-lg tw-font-semibold tw-text-iron-50"
          >
            {t(locale, "validator.sign.loadTitle")}
          </h2>
          <p className="tw-mb-5 tw-text-sm tw-leading-7">
            {t(locale, "validator.sign.loadHint")}
          </p>
          <details className="tw-mb-5 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/50 tw-p-4">
            <summary className="tw-cursor-pointer tw-text-sm tw-font-semibold tw-text-primary-300 focus-visible:tw-outline-primary-400">
              {t(locale, "validator.sign.helpTitle")}
            </summary>
            <ol className="tw-mb-0 tw-mt-4 tw-space-y-4 tw-pl-5 marker:tw-font-semibold marker:tw-text-primary-300">
              <li className="tw-pl-1">
                <h3 className="tw-mb-1 tw-text-sm tw-font-semibold tw-text-iron-100">
                  {t(locale, "validator.sign.helpOpenTitle")}
                </h3>
                <p className="tw-m-0 tw-text-sm tw-leading-6">
                  {t(locale, "validator.sign.helpOpen")}
                </p>
              </li>
              <li className="tw-pl-1">
                <h3 className="tw-mb-1 tw-text-sm tw-font-semibold tw-text-iron-100">
                  {t(locale, "validator.sign.helpSaveTitle")}
                </h3>
                <p className="tw-m-0 tw-text-sm tw-leading-6">
                  {t(locale, "validator.sign.helpSave")}
                </p>
              </li>
              <li className="tw-pl-1">
                <h3 className="tw-mb-1 tw-text-sm tw-font-semibold tw-text-iron-100">
                  {t(locale, "validator.sign.helpTransferTitle")}
                </h3>
                <p className="tw-m-0 tw-text-sm tw-leading-6">
                  {t(locale, "validator.sign.helpTransfer")}
                </p>
              </li>
            </ol>
            <p className="tw-mb-0 tw-mt-4 tw-text-sm tw-leading-6 tw-text-iron-400">
              {t(locale, "validator.sign.helpNote")}
            </p>
          </details>
          <label
            htmlFor="validator-grant-file"
            className="tw-mb-2 tw-block tw-text-sm tw-font-semibold tw-text-iron-100"
          >
            {t(locale, "validator.sign.file")}
          </label>
          <input
            id="validator-grant-file"
            aria-describedby={error ? "grant-load-error" : undefined}
            aria-invalid={Boolean(error)}
            type="file"
            accept=".json,application/json"
            onChange={(event) => void readFile(event.target.files?.[0])}
            className="tw-block tw-w-full tw-min-w-0 tw-text-sm tw-text-iron-300 file:tw-mr-3 file:tw-cursor-pointer file:tw-rounded-lg file:tw-border-0 file:tw-bg-iron-800 file:tw-px-4 file:tw-py-3 file:tw-font-semibold file:tw-text-white focus-visible:tw-outline-primary-400"
          />
          <details className="tw-mt-5">
            <summary className="tw-cursor-pointer tw-text-sm tw-text-primary-300 focus-visible:tw-outline-primary-400">
              {t(locale, "validator.sign.pasteToggle")}
            </summary>
            <form
              className="tw-mt-4 tw-space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                ++readGeneration.current;
                load(text);
              }}
            >
              <label
                htmlFor="validator-grant-json"
                className="tw-block tw-text-sm"
              >
                {t(locale, "validator.sign.pasteLabel")}
              </label>
              <textarea
                id="validator-grant-json"
                aria-describedby={error ? "grant-load-error" : undefined}
                aria-invalid={Boolean(error)}
                rows={8}
                value={text}
                maxLength={MAX_GRANT_BYTES}
                spellCheck={false}
                autoComplete="off"
                onChange={(event) => setText(event.target.value)}
                className="tw-block tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-white/15 tw-bg-iron-950 tw-p-3 tw-font-mono tw-text-xs tw-text-iron-100 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className={`${SECONDARY_BUTTON} disabled:tw-opacity-50`}
              >
                {t(locale, "validator.sign.load")}
              </button>
            </form>
          </details>
          {error && (
            <p
              role="alert"
              id="grant-load-error"
              className="tw-mb-0 tw-mt-4 tw-text-sm tw-leading-6 tw-text-error"
            >
              {error}
            </p>
          )}
          <p className="tw-mb-0 tw-mt-5 tw-text-sm tw-leading-6 tw-text-iron-400">
            {t(locale, "validator.sign.privacy")}
          </p>
        </section>
      ) : (
        <section
          aria-labelledby="review-grant"
          className="tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/60 tw-p-5 sm:tw-p-6"
        >
          <h2
            id="review-grant"
            ref={focusReview}
            tabIndex={-1}
            className="tw-mb-5 tw-text-lg tw-font-semibold tw-text-iron-50"
          >
            {t(locale, "validator.sign.reviewTitle")}
          </h2>
          <ValidatorGrantReview grant={grant} />
          <ValidatorGrantSigner
            grant={grant}
            onReset={() => {
              ++readGeneration.current;
              setGrant(null);
              setError(null);
            }}
          />
        </section>
      )}
    </ValidatorPageFrame>
  );
}
