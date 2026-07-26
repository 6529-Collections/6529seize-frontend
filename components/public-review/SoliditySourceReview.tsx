"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { PublicReviewCodeSelection } from "@/services/api/public-review/types";

export type PublicReviewCodeSelectionIntegrityStatus =
  | "pending"
  | "ready"
  | "unavailable";

interface SourceReviewInput {
  readonly contract?: string | undefined;
  readonly declaration?: string | undefined;
  readonly firstLineNumber?: number | undefined;
  readonly githubUrl: string;
  readonly initialLineEnd: number;
  readonly initialLineStart: number;
  readonly lines: readonly string[];
  readonly path: string;
  readonly sourceSha256: string;
}

interface PublicReviewCodeSelectionContextValue {
  readonly integrityStatus: PublicReviewCodeSelectionIntegrityStatus;
  readonly selection: PublicReviewCodeSelection | undefined;
}

const PublicReviewCodeSelectionContext =
  createContext<PublicReviewCodeSelectionContextValue | null>(null);

export function usePublicReviewCodeSelection(): PublicReviewCodeSelectionContextValue {
  const value = useContext(PublicReviewCodeSelectionContext);
  if (!value) {
    throw new Error(
      "usePublicReviewCodeSelection must be used inside SoliditySourceReview."
    );
  }
  return value;
}

function clampLine(line: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(line, minimum), maximum);
}

function getHashLineRange(
  hash: string
): { readonly end: number; readonly start: number } | undefined {
  if (!hash.startsWith("#L")) {
    return undefined;
  }
  const segments = hash.slice(2).split("-L");
  if (
    segments.length < 1 ||
    segments.length > 2 ||
    segments.some(
      (segment) =>
        !segment ||
        [...segment].some((character) => character < "0" || character > "9")
    )
  ) {
    return undefined;
  }
  const start = Number(segments[0]);
  const end = Number(segments[1] ?? segments[0]);
  return Number.isSafeInteger(start) &&
    Number.isSafeInteger(end) &&
    start <= end
    ? { end, start }
    : undefined;
}

function subscribeToHashChange(onChange: () => void): () => void {
  globalThis.addEventListener("hashchange", onChange);
  return () => globalThis.removeEventListener("hashchange", onChange);
}

function getHashSnapshot(): string {
  return globalThis.location.hash;
}

function getServerHashSnapshot(): string {
  return "";
}

function toGitHubSelectionUrl(
  githubUrl: string,
  lineStart: number,
  lineEnd: number
): string {
  const baseUrl = githubUrl.split("#", 1)[0] ?? githubUrl;
  const lineFragment =
    lineStart === lineEnd ? `#L${lineStart}` : `#L${lineStart}-L${lineEnd}`;
  return `${baseUrl}${lineFragment}`;
}

async function getSnippetSha256(source: string): Promise<string | undefined> {
  try {
    const digest = await globalThis.crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(source)
    );
    const hex = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");
    return `sha256:${hex}`;
  } catch {
    return undefined;
  }
}

function SourceSelectionControls({
  maximumLine,
  minimumLine,
  lineEnd,
  lineStart,
  onLineEndChange,
  onLineStartChange,
  selectionUrl,
  selectedSource,
  showCommentAction,
}: {
  readonly maximumLine: number;
  readonly minimumLine: number;
  readonly lineEnd: number;
  readonly lineStart: number;
  readonly onLineEndChange: (line: number) => void;
  readonly onLineStartChange: (line: number) => void;
  readonly selectionUrl: string;
  readonly selectedSource: string;
  readonly showCommentAction: boolean;
}) {
  const rangeStatusId = useId();
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const selectionValid = lineStart <= lineEnd;

  const copySelection = async (): Promise<void> => {
    try {
      await globalThis.navigator.clipboard.writeText(selectedSource);
      setCopyStatus(
        t(DEFAULT_LOCALE, "publicReview.reference.copiedSelection")
      );
    } catch {
      setCopyStatus(t(DEFAULT_LOCALE, "publicReview.reference.copyFailed"));
    }
  };

  const focusFeedback = (): void => {
    const feedback = document.getElementById("public-review-feedback");
    const reduceMotion = globalThis.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    feedback?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    const primaryControl = feedback?.querySelector<HTMLElement>(
      "[data-public-review-feedback-primary]"
    );
    (primaryControl ?? feedback)?.focus({ preventScroll: true });
  };

  return (
    <section
      aria-labelledby="solidity-source-selection-heading"
      className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-4 sm:tw-p-5"
    >
      <h2
        id="solidity-source-selection-heading"
        className="tw-m-0 tw-text-lg tw-font-semibold tw-text-white"
      >
        {t(DEFAULT_LOCALE, "publicReview.reference.selectLines")}
      </h2>
      <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-300">
        {t(DEFAULT_LOCALE, "publicReview.reference.selectLinesDescription")}
      </p>
      <div className="tw-mt-4 tw-grid tw-gap-4 sm:tw-grid-cols-2">
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
          <span className="tw-mb-1.5 tw-block">
            {t(DEFAULT_LOCALE, "publicReview.reference.startLine")}
          </span>
          <input
            aria-describedby={rangeStatusId}
            aria-invalid={!selectionValid}
            className="tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-base tw-text-white tw-outline-none focus:tw-border-primary-400 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/40"
            max={maximumLine}
            min={minimumLine}
            type="number"
            value={lineStart}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (Number.isSafeInteger(value)) {
                onLineStartChange(clampLine(value, minimumLine, maximumLine));
              }
            }}
          />
        </label>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-iron-200">
          <span className="tw-mb-1.5 tw-block">
            {t(DEFAULT_LOCALE, "publicReview.reference.endLine")}
          </span>
          <input
            aria-describedby={rangeStatusId}
            aria-invalid={!selectionValid}
            className="tw-min-h-11 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2 tw-text-base tw-text-white tw-outline-none focus:tw-border-primary-400 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/40"
            max={maximumLine}
            min={minimumLine}
            type="number"
            value={lineEnd}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (Number.isSafeInteger(value)) {
                onLineEndChange(clampLine(value, minimumLine, maximumLine));
              }
            }}
          />
        </label>
      </div>
      <p
        id={rangeStatusId}
        aria-atomic="true"
        aria-live="polite"
        className={`tw-mb-0 tw-mt-3 tw-text-sm ${
          selectionValid ? "tw-text-sky-200" : "tw-text-red-200"
        }`}
        role="status"
      >
        {selectionValid
          ? t(DEFAULT_LOCALE, "publicReview.reference.selectedRange", {
              start: lineStart,
              end: lineEnd,
            })
          : t(DEFAULT_LOCALE, "publicReview.reference.selectionInvalid")}
      </p>
      <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-flex-wrap">
        <button
          type="button"
          disabled={!selectionValid}
          onClick={() => void copySelection()}
          className="tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-950 tw-px-4 tw-py-2 tw-font-semibold tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
        >
          {t(DEFAULT_LOCALE, "publicReview.reference.copySelection")}
        </button>
        <a
          href={selectionUrl}
          rel="noreferrer"
          target="_blank"
          className="tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-transparent tw-px-4 tw-py-2 tw-font-semibold tw-text-iron-100 tw-no-underline hover:tw-border-iron-400 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
        >
          {t(DEFAULT_LOCALE, "publicReview.reference.openSelection")}
        </a>
        {showCommentAction ? (
          <button
            type="button"
            disabled={!selectionValid}
            onClick={focusFeedback}
            className="tw-inline-flex tw-min-h-11 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-primary-500 tw-px-4 tw-py-2 tw-font-semibold tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
          >
            {t(DEFAULT_LOCALE, "publicReview.reference.commentSelection")}
          </button>
        ) : null}
      </div>
      <div aria-live="polite" aria-atomic="true">
        {copyStatus ? (
          <p className="tw-mb-0 tw-mt-3 tw-text-sm tw-text-iron-300">
            {copyStatus}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function SourceLines({
  firstLineNumber,
  lineEnd,
  lines,
  lineStart,
}: {
  readonly firstLineNumber: number;
  readonly lineEnd: number;
  readonly lines: readonly string[];
  readonly lineStart: number;
}) {
  return (
    <div
      aria-label={t(DEFAULT_LOCALE, "publicReview.reference.sourceCodeRegion")}
      className="tw-mt-5 tw-max-h-[70vh] tw-overflow-auto tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-black"
      role="region"
      tabIndex={0}
    >
      <ol className="tw-m-0 tw-min-w-max tw-list-none tw-p-0 tw-py-3 tw-font-mono tw-text-xs tw-leading-6 sm:tw-text-sm">
        {lines.map((line, index) => {
          const lineNumber = firstLineNumber + index;
          const selected = lineNumber >= lineStart && lineNumber <= lineEnd;
          return (
            <li
              id={`L${lineNumber}`}
              key={lineNumber}
              className={`tw-grid tw-grid-cols-[4.5rem_minmax(0,1fr)] ${
                selected ? "tw-bg-primary-400/15" : ""
              }`}
            >
              <span
                aria-hidden="true"
                className="tw-block tw-px-3 tw-text-right tw-font-mono tw-text-xs tw-text-iron-500"
              >
                {lineNumber}
              </span>
              <code className="tw-block tw-whitespace-pre tw-pr-5 tw-text-iron-200">
                {line || " "}
              </code>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function SoliditySourceReview({
  feedbackSlot,
  source,
}: {
  readonly feedbackSlot?: ReactNode | undefined;
  readonly source: SourceReviewInput;
}) {
  const firstLineNumber = source.firstLineNumber ?? 1;
  const lastLineNumber = firstLineNumber + source.lines.length - 1;
  const initialLineStart = clampLine(
    source.initialLineStart,
    firstLineNumber,
    lastLineNumber
  );
  const initialLineEnd = clampLine(
    source.initialLineEnd,
    firstLineNumber,
    lastLineNumber
  );
  const [selectedLineStart, setSelectedLineStart] =
    useState(initialLineStart);
  const [selectedLineEnd, setSelectedLineEnd] = useState(initialLineEnd);
  const [selectionTouched, setSelectionTouched] = useState(false);
  const hash = useSyncExternalStore(
    subscribeToHashChange,
    getHashSnapshot,
    getServerHashSnapshot
  );
  const hashRange = getHashLineRange(hash);
  const validHashRange =
    hashRange &&
    hashRange.start >= firstLineNumber &&
    hashRange.end <= lastLineNumber
      ? hashRange
      : undefined;
  const lineStart =
    !selectionTouched && validHashRange
      ? validHashRange.start
      : selectedLineStart;
  const lineEnd =
    !selectionTouched && validHashRange
      ? validHashRange.end
      : selectedLineEnd;
  const [computedSnippet, setComputedSnippet] = useState<
    | {
        readonly checksum: string | undefined;
        readonly selectionKey: string;
      }
    | undefined
  >();
  const selectionValid = lineStart <= lineEnd;
  const selectedSource = selectionValid
    ? source.lines
        .slice(
          lineStart - firstLineNumber,
          lineEnd - firstLineNumber + 1
        )
        .join("\n")
    : "";
  const selectionKey = `${lineStart}:${lineEnd}:${selectedSource}`;

  useEffect(() => {
    if (!selectionValid) {
      return;
    }
    let cancelled = false;
    void getSnippetSha256(selectedSource).then((checksum) => {
      if (!cancelled) {
        setComputedSnippet({ checksum, selectionKey });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedSource, selectionKey, selectionValid]);

  const selection = useMemo<PublicReviewCodeSelection | undefined>(() => {
    if (
      !selectionValid ||
      computedSnippet?.selectionKey !== selectionKey ||
      !computedSnippet.checksum
    ) {
      return undefined;
    }
    return {
      kind: "code",
      path: source.path,
      sourceSha256: source.sourceSha256,
      lineStart,
      lineEnd,
      ...(source.contract ? { contract: source.contract } : {}),
      ...(source.declaration ? { declaration: source.declaration } : {}),
      snippetSha256: computedSnippet.checksum,
    };
  }, [
    computedSnippet,
    lineEnd,
    lineStart,
    selectionValid,
    selectionKey,
    source.contract,
    source.declaration,
    source.path,
    source.sourceSha256,
  ]);
  let integrityStatus: PublicReviewCodeSelectionIntegrityStatus = "pending";
  if (computedSnippet?.selectionKey === selectionKey) {
    integrityStatus = computedSnippet.checksum ? "ready" : "unavailable";
  }
  const selectionUrl = toGitHubSelectionUrl(
    source.githubUrl,
    lineStart,
    lineEnd
  );

  return (
    <PublicReviewCodeSelectionContext.Provider
      value={{ integrityStatus, selection }}
    >
      <SourceSelectionControls
        maximumLine={lastLineNumber}
        minimumLine={firstLineNumber}
        lineEnd={lineEnd}
        lineStart={lineStart}
        onLineEndChange={(line) => {
          setSelectionTouched(true);
          setSelectedLineEnd(line);
        }}
        onLineStartChange={(line) => {
          setSelectionTouched(true);
          setSelectedLineStart(line);
        }}
        selectionUrl={selectionUrl}
        selectedSource={selectedSource}
        showCommentAction={feedbackSlot !== undefined}
      />
      {feedbackSlot !== undefined ? (
        <a
          href="#public-review-feedback"
          className="tw-mt-4 tw-inline-flex tw-min-h-11 tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-amber-400/40 tw-bg-amber-400/10 tw-px-4 tw-py-2 tw-font-semibold tw-text-amber-100 tw-no-underline hover:tw-border-amber-300 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white">
          {t(DEFAULT_LOCALE, "publicReview.reference.skipCode")}
        </a>
      ) : null}
      <SourceLines
        firstLineNumber={firstLineNumber}
        lineEnd={lineEnd}
        lines={source.lines}
        lineStart={lineStart}
      />
      {feedbackSlot !== undefined && feedbackSlot !== null ? (
        <div
          id="public-review-feedback"
          className="tw-mt-8 tw-scroll-mt-28"
          data-public-review-feedback
          tabIndex={-1}>
          {feedbackSlot}
        </div>
      ) : null}
    </PublicReviewCodeSelectionContext.Provider>
  );
}
