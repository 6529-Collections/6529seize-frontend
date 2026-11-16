"use client";

import { CheckIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

// 44 px tall on a phone, the size of a fingertip; 32 px with a mouse.
const BASE =
  "tw-inline-flex tw-flex-none tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-md tw-px-2.5 tw-text-xs tw-font-medium tw-text-iron-300 tw-transition tw-min-h-11 sm:tw-min-h-8 hover:tw-text-iron-50 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400";
const CHIP =
  "tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 hover:tw-border-white/25";
const PLAIN = "tw-border-0 tw-bg-transparent hover:tw-bg-white/[0.06]";

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
  plain = false,
}: {
  readonly value: string;
  /** The visible words: "Copy", or "Copy SHA-256". */
  readonly text: string;
  readonly copiedText: string;
  /** What it copies, for screen readers: "Copy the SHA-256 of …". */
  readonly label: string;
  readonly copiedLabel: string;
  /** Without a border, as in a code block's header. */
  readonly plain?: boolean | undefined;
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
      className={`${BASE} ${plain ? PLAIN : CHIP}`}
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
