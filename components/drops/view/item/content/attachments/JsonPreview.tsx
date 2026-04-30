"use client";

import { LinkIcon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

const METADATA_FETCH_TIMEOUT_MS = 120_000;
const METADATA_PREVIEW_MAX_BYTES = 1_000_000;
const METADATA_PREVIEW_SIZE_MESSAGE = "Metadata preview is too large.";

type MetadataDetails = {
  readonly text: string;
  readonly isJson: boolean;
};

const JSON_LITERAL_CLASSES = {
  true: "tw-text-sky-300",
  false: "tw-text-sky-300",
  null: "tw-text-iron-500",
} as const;

async function fetchMetadataPreviewText(
  url: string,
  signal: AbortSignal
): Promise<MetadataDetails> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error("Metadata not found.");
  }

  const text = await readMetadataPreviewText(response, signal);
  try {
    const json = JSON.parse(text);
    return {
      text: JSON.stringify(json, null, 2),
      isJson: true,
    };
  } catch {
    return { text, isJson: false };
  }
}

function assertMetadataContentLengthWithinLimit(response: Response): void {
  const lengthHeader = response.headers.get("Content-Length");
  if (lengthHeader === null) {
    return;
  }

  const parsed = Number.parseInt(lengthHeader, 10);
  if (Number.isFinite(parsed) && parsed > METADATA_PREVIEW_MAX_BYTES) {
    throw new Error(METADATA_PREVIEW_SIZE_MESSAGE);
  }
}

function assertMetadataSignalActive(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
}

async function releaseMetadataPreviewReader(
  reader: ReadableStreamDefaultReader<Uint8Array>
): Promise<void> {
  await reader.cancel().catch(() => undefined);
  try {
    reader.releaseLock();
  } catch {
    // Reader may already be released after cancellation or stream completion.
  }
}

async function readMetadataPreviewTextFromBodyLessResponse(
  response: Response
): Promise<string> {
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > METADATA_PREVIEW_MAX_BYTES) {
    throw new Error(METADATA_PREVIEW_SIZE_MESSAGE);
  }
  return new TextDecoder().decode(buffer);
}

async function readMetadataPreviewTextFromStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  signal: AbortSignal
): Promise<string> {
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      const bytes = new Uint8Array(totalBytes);
      let offset = 0;

      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }

      return new TextDecoder().decode(bytes);
    }

    assertMetadataSignalActive(signal);
    totalBytes += value.byteLength;

    if (totalBytes > METADATA_PREVIEW_MAX_BYTES) {
      throw new Error(METADATA_PREVIEW_SIZE_MESSAGE);
    }

    chunks[chunks.length] = value;
  }
}

async function readMetadataPreviewText(
  response: Response,
  signal: AbortSignal
): Promise<string> {
  assertMetadataContentLengthWithinLimit(response);
  if (!response.body) {
    return readMetadataPreviewTextFromBodyLessResponse(response);
  }

  const reader = response.body.getReader();
  try {
    return await readMetadataPreviewTextFromStream(reader, signal);
  } finally {
    await releaseMetadataPreviewReader(reader);
  }
}

function addJsonPreviewPart(parts: ReactNode[], part: ReactNode) {
  parts[parts.length] = part;
}

function isJsonWhitespace(char: string | undefined): boolean {
  return char === " " || char === "\t" || char === "\n" || char === "\r";
}

function isJsonDigit(char: string | undefined): boolean {
  return char !== undefined && char >= "0" && char <= "9";
}

function isJsonWordChar(char: string | undefined): boolean {
  if (!char) {
    return false;
  }

  return (
    (char >= "A" && char <= "Z") ||
    (char >= "a" && char <= "z") ||
    isJsonDigit(char) ||
    char === "_"
  );
}

function readJsonStringEnd(line: string, startIndex: number): number {
  let index = startIndex + 1;

  while (index < line.length) {
    if (line[index] === "\\") {
      index += 2;
    } else if (line[index] === '"') {
      return index + 1;
    } else {
      index += 1;
    }
  }

  return line.length;
}

function readJsonKeySuffixEnd(line: string, startIndex: number): number {
  let index = startIndex;

  while (isJsonWhitespace(line[index])) {
    index += 1;
  }

  return line[index] === ":" ? index + 1 : startIndex;
}

function isJsonNumberStart(line: string, startIndex: number): boolean {
  return line[startIndex] === "-" || isJsonDigit(line[startIndex]);
}

function readJsonNumberEnd(line: string, startIndex: number): number {
  let index = startIndex;

  if (line[index] === "-") {
    index += 1;
  }

  if (!isJsonDigit(line[index])) {
    return startIndex + 1;
  }

  while (isJsonDigit(line[index])) {
    index += 1;
  }

  if (line[index] === "." && isJsonDigit(line[index + 1])) {
    index += 1;
    while (isJsonDigit(line[index])) {
      index += 1;
    }
  }

  const hasExponent = line[index] === "e" || line[index] === "E";
  if (hasExponent) {
    const exponentStart = index;
    index += 1;

    if (line[index] === "+" || line[index] === "-") {
      index += 1;
    }

    if (!isJsonDigit(line[index])) {
      return exponentStart;
    }

    while (isJsonDigit(line[index])) {
      index += 1;
    }
  }

  return index;
}

function getJsonLiteralAt(
  line: string,
  startIndex: number
): keyof typeof JSON_LITERAL_CLASSES | null {
  const nextCharIsWord = (literal: string) =>
    isJsonWordChar(line[startIndex + literal.length]);

  if (line.startsWith("true", startIndex) && !nextCharIsWord("true")) {
    return "true";
  }

  if (line.startsWith("false", startIndex) && !nextCharIsWord("false")) {
    return "false";
  }

  if (line.startsWith("null", startIndex) && !nextCharIsWord("null")) {
    return "null";
  }

  return null;
}

function JsonPreviewLine({ line }: { readonly line: string }) {
  const parts: ReactNode[] = [];
  let charOffset = 0;

  while (charOffset < line.length) {
    if (line[charOffset] === '"') {
      const stringEnd = readJsonStringEnd(line, charOffset);
      const token = line.slice(charOffset, stringEnd);
      const keySuffixEnd = readJsonKeySuffixEnd(line, stringEnd);
      const key = `json-string-${charOffset}-${token}`;

      if (keySuffixEnd > stringEnd) {
        addJsonPreviewPart(
          parts,
          <span key={key}>
            <span className="tw-text-rose-300">{token}</span>
            {line.slice(stringEnd, keySuffixEnd)}
          </span>
        );
        charOffset = keySuffixEnd;
      } else {
        addJsonPreviewPart(
          parts,
          <span key={key} className="tw-text-lime-300">
            {token}
          </span>
        );
        charOffset = stringEnd;
      }
      continue;
    }

    const literal = getJsonLiteralAt(line, charOffset);
    if (literal) {
      addJsonPreviewPart(
        parts,
        <span
          key={`json-literal-${charOffset}-${literal}`}
          className={JSON_LITERAL_CLASSES[literal]}
        >
          {literal}
        </span>
      );
      charOffset += literal.length;
      continue;
    }

    if (isJsonNumberStart(line, charOffset)) {
      const numberEnd = readJsonNumberEnd(line, charOffset);
      const token = line.slice(charOffset, numberEnd);

      addJsonPreviewPart(
        parts,
        <span
          key={`json-number-${charOffset}-${token}`}
          className="tw-text-violet-300"
        >
          {token}
        </span>
      );
      charOffset = numberEnd;
      continue;
    }

    addJsonPreviewPart(parts, line[charOffset]);
    charOffset += 1;
  }

  return <>{parts}</>;
}

function getMetadataLineKey(line: string, countsByLine: Map<string, number>) {
  const count = countsByLine.get(line) ?? 0;
  countsByLine.set(line, count + 1);
  let hash = 0;

  for (const char of line) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }

  return `metadata-line-${hash.toString(36)}-${count}`;
}

function MetadataPreviewContent({
  metadata,
  isJson,
}: {
  readonly metadata: string;
  readonly isJson: boolean;
}) {
  const lines = metadata.split("\n");

  if (!isJson) {
    return (
      <pre className="tw-m-0 tw-max-h-[28rem] tw-overflow-auto tw-whitespace-pre-wrap tw-break-words tw-p-4 tw-pr-28 tw-text-xs tw-text-iron-200">
        {metadata}
      </pre>
    );
  }

  const lineKeyCounts = new Map<string, number>();
  let remainingLineCount = lines.length;

  return (
    <pre className="tw-m-0 tw-max-h-[28rem] tw-overflow-auto tw-whitespace-pre-wrap tw-break-words tw-p-4 tw-pr-28 tw-font-mono tw-text-xs tw-leading-relaxed tw-text-iron-200">
      {lines.map((line) => {
        const key = getMetadataLineKey(line, lineKeyCounts);
        remainingLineCount -= 1;

        return (
          <span key={key}>
            <JsonPreviewLine line={line} />
            {remainingLineCount > 0 ? "\n" : null}
          </span>
        );
      })}
    </pre>
  );
}

export default function JsonPreview({
  link,
  onClose,
}: {
  readonly link: string;
  readonly onClose?: () => void;
}) {
  const [metadata, setMetadata] = useState<string | null>(null);
  const [isJsonMetadata, setIsJsonMetadata] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedMetadataLink, setCopiedMetadataLink] = useState(false);

  useEffect(() => {
    setMetadata(null);
    setIsJsonMetadata(false);
    setError(null);
    const controller = new AbortController();
    let active = true;
    const timeoutId = globalThis.window.setTimeout(() => {
      controller.abort();
    }, METADATA_FETCH_TIMEOUT_MS);

    void (async () => {
      try {
        const result = await fetchMetadataPreviewText(link, controller.signal);
        if (!active || controller.signal.aborted) {
          return;
        }
        setMetadata(result.text);
        setIsJsonMetadata(result.isJson);
      } catch (error) {
        if (!active || controller.signal.aborted) {
          return;
        }
        setError(error instanceof Error ? error.message : "Metadata not found.");
      } finally {
        globalThis.window.clearTimeout(timeoutId);
      }
    })();

    return () => {
      active = false;
      globalThis.window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [link]);

  useEffect(() => {
    if (!copiedMetadataLink) {
      return;
    }

    const timeoutId = globalThis.window.setTimeout(
      () => setCopiedMetadataLink(false),
      1500
    );
    return () => globalThis.window.clearTimeout(timeoutId);
  }, [copiedMetadataLink]);

  const handleCopyMetadataLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedMetadataLink(true);
    } catch (error) {
      console.error("Failed to copy attachment metadata link", error);
    }
  };

  return (
    <div className="tw-relative tw-min-h-32 tw-bg-primary-400/[0.035]">
      <div className="tw-absolute tw-right-3 tw-top-3 tw-z-10">
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <button
            type="button"
            onClick={handleCopyMetadataLink}
            aria-label="Copy metadata link"
            title={copiedMetadataLink ? "Copied" : "Copy metadata link"}
            className={clsx(
              "tw-inline-flex tw-size-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-bg-iron-900/80 tw-no-underline tw-transition desktop-hover:hover:tw-bg-primary-400/[0.12]",
              copiedMetadataLink
                ? "tw-border-primary-400 tw-text-primary-300"
                : "tw-border-iron-700 tw-text-iron-200"
            )}
          >
            <LinkIcon className="tw-size-4" aria-hidden="true" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close attachment details"
              title="Close"
              className="tw-inline-flex tw-size-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/80 tw-text-iron-200 tw-transition desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-50"
            >
              <XMarkIcon className="tw-size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      {error && (
        <div className="tw-p-4 tw-pr-28 tw-text-sm tw-text-iron-300">
          {error}
        </div>
      )}
      {!error && !metadata && (
        <div className="tw-p-4 tw-pr-28 tw-text-sm tw-text-iron-400">
          Loading metadata...
        </div>
      )}
      {metadata && (
        <MetadataPreviewContent metadata={metadata} isJson={isJsonMetadata} />
      )}
    </div>
  );
}
