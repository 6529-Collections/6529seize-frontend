"use client";

import { CheckIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export default function CopyChecksumButton({
  value,
  label,
}: {
  readonly value: string;
  /** What is copied, for screen readers: "SHA-256 of <file>". */
  readonly label: string;
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
      aria-label={copied ? `Copied ${label}` : `Copy ${label}`}
      className="tw-inline-flex tw-min-h-8 tw-flex-none tw-items-center tw-gap-1.5 tw-rounded-md tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-px-2.5 tw-text-xs tw-font-medium tw-text-iron-300 tw-transition hover:tw-border-white/20 hover:tw-text-iron-50 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
    >
      {copied ? (
        <CheckIcon aria-hidden="true" className="tw-size-4 tw-text-success" />
      ) : (
        <ClipboardDocumentIcon aria-hidden="true" className="tw-size-4" />
      )}
      <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
