"use client";

import "@/i18n/namespaces/validator-sign";
import { useRef, useState } from "react";
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
import { SECONDARY_BUTTON, TEXT_BUTTON } from "./validatorStyles";

export default function ValidatorSignPage() {
  const locale = useBrowserLocale();
  const [grant, setGrant] = useState<ValidatorGrant | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const readGeneration = useRef(0);

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
            {t(locale, "validator.sign.exportHelp")}
          </p>
          <label
            htmlFor="validator-grant-file"
            className="tw-mb-2 tw-block tw-text-sm tw-font-semibold tw-text-iron-100"
          >
            {t(locale, "validator.sign.file")}
          </label>
          <input
            id="validator-grant-file"
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
            className="tw-mb-5 tw-text-lg tw-font-semibold tw-text-iron-50"
          >
            {t(locale, "validator.sign.reviewTitle")}
          </h2>
          <ValidatorGrantReview grant={grant} />
          <ValidatorGrantSigner grant={grant} />
          <button
            type="button"
            className={`${TEXT_BUTTON} tw-mt-5`}
            onClick={() => {
              ++readGeneration.current;
              setGrant(null);
              setError(null);
            }}
          >
            {t(locale, "validator.sign.reset")}
          </button>
        </section>
      )}
    </ValidatorPageFrame>
  );
}
