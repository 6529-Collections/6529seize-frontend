"use client";

import { CheckIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

const BASE =
  "tw-inline-flex tw-flex-none tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-md tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-text-xs tw-font-medium tw-text-iron-300 tw-transition hover:tw-border-white/25 hover:tw-text-iron-50 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";

/**
 * Copies a value, such as a SHA-256 or a command, and says so for two
 * seconds. Its words come from the server, in the page's language.
 */
export default function AiCopyButton({
  value,
  text,
  copiedText,
  label,
  copiedLabel,
}: {
  readonly value: string;
  /** The visible word: "Copy", or "SHA-256". */
  readonly text: string;
  readonly copiedText: string;
  /** What it copies, for screen readers: "Copy the SHA-256 of …". */
  readonly label: string;
  readonly copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? copiedLabel : label}
      className={`${BASE} tw-min-h-8 tw-px-2.5`}
    >
      {copied ? (
        <CheckIcon aria-hidden="true" className="tw-size-4 tw-text-success" />
      ) : (
        <ClipboardDocumentIcon aria-hidden="true" className="tw-size-4" />
      )}
      <span aria-live="polite">{copied ? copiedText : text}</span>
    </button>
  );
}
