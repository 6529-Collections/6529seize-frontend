"use client";

import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type {
  E2eeConversation,
  E2eeEngine,
  E2eeMessage,
} from "@/lib/e2ee/types";
import { formatE2eeTimestamp, getMemberName, tCount } from "../e2eeFormat";

const SEARCH_DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

function getSearchStatus(
  locale: ReturnType<typeof useBrowserLocale>,
  failed: boolean,
  results: readonly E2eeMessage[] | null
): string | null {
  if (failed) {
    return t(locale, "e2ee.conversation.search.failed");
  }
  if (results === null) {
    return null;
  }
  if (results.length === 0) {
    return t(locale, "e2ee.conversation.search.noResults");
  }
  return tCount(
    locale,
    {
      one: "e2ee.conversation.search.results.one",
      other: "e2ee.conversation.search.results.other",
    },
    results.length
  );
}

interface E2eeSearchPanelProps {
  readonly engine: E2eeEngine;
  readonly conversation: E2eeConversation;
  readonly selfProfileId: string | null;
  readonly onClose: () => void;
  readonly onJumpTo: (id: string) => void;
}

/** Local-only search over this chat's decrypted messages (contract 8.7). */
export function E2eeSearchPanel({
  engine,
  conversation,
  selfProfileId,
  onClose,
  onJumpTo,
}: E2eeSearchPanelProps) {
  const locale = useBrowserLocale();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly E2eeMessage[] | null>(null);
  const [failed, setFailed] = useState(false);
  const trimmed = query.trim();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (trimmed.length < MIN_QUERY_LENGTH) {
      return;
    }
    let cancelled = false;
    const timer = globalThis.setTimeout(() => {
      engine
        .search(trimmed, conversation.g)
        .then((found) => {
          if (!cancelled) {
            setResults(found);
            setFailed(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setFailed(true);
          }
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      globalThis.clearTimeout(timer);
    };
  }, [engine, conversation.g, trimmed]);

  const visibleResults = trimmed.length < MIN_QUERY_LENGTH ? null : results;

  return (
    <section
      aria-labelledby={`${inputId}-label`}
      className="tw-flex-shrink-0 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-4 tw-py-3"
    >
      <form
        role="search"
        onSubmit={(event: FormEvent) => event.preventDefault()}
        className="tw-flex tw-items-center tw-gap-2"
      >
        <label id={`${inputId}-label`} htmlFor={inputId} className="tw-sr-only">
          {t(locale, "e2ee.conversation.search.label")}
        </label>
        <div className="tw-relative tw-flex-1">
          <MagnifyingGlassIcon
            aria-hidden="true"
            className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-1/2 tw-size-4 -tw-translate-y-1/2 tw-text-iron-500"
          />
          <input
            id={inputId}
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                onClose();
              }
            }}
            placeholder={t(locale, "e2ee.conversation.search.open")}
            className="tw-h-10 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-pl-9 tw-pr-3 tw-text-sm tw-text-iron-100 placeholder:tw-text-iron-500 focus:tw-border-primary-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t(locale, "e2ee.conversation.search.close")}
          className="tw-flex tw-size-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 hover:tw-bg-iron-800 hover:tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          <XMarkIcon aria-hidden="true" className="tw-size-5" />
        </button>
      </form>
      <p className="tw-m-0 tw-mt-1.5 tw-text-xs tw-text-iron-500">
        {t(locale, "e2ee.conversation.search.localNote")}
      </p>
      <div role="status" className="tw-mt-2 tw-text-xs tw-text-iron-400">
        {getSearchStatus(locale, failed, visibleResults)}
      </div>
      {visibleResults && visibleResults.length > 0 ? (
        <ul className="tw-m-0 tw-mt-2 tw-flex tw-max-h-64 tw-list-none tw-flex-col tw-gap-1 tw-overflow-y-auto tw-p-0">
          {visibleResults.map((message) => (
            <li key={message.id}>
              <button
                type="button"
                onClick={() => onJumpTo(message.id)}
                className="tw-flex tw-w-full tw-flex-col tw-items-start tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-py-1.5 tw-text-left hover:tw-bg-iron-900 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
              >
                <span className="tw-flex tw-w-full tw-items-baseline tw-gap-2 tw-text-xs">
                  <span className="tw-font-semibold tw-text-iron-200">
                    {getMemberName(
                      locale,
                      conversation.members,
                      message.senderProfileId,
                      selfProfileId
                    )}
                  </span>
                  <span className="tw-text-iron-500">
                    {formatE2eeTimestamp(locale, message.ts)}
                  </span>
                </span>
                <span className="tw-line-clamp-2 tw-w-full tw-text-sm tw-text-iron-300">
                  {message.text}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
