"use client";

import { useState } from "react";
import { EX_BUTTON } from "../tokens";

/**
 * Copies a block of text (the pin block, a rule) whole. The label says
 * "Copied" once it has, and is read out when it changes.
 */
export default function CopyButton({
  text,
  label,
  copiedLabel,
}: {
  readonly text: string;
  readonly label: string;
  readonly copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      // Plain-HTTP pages and older browsers have no clipboard.
      const clipboard = navigator.clipboard as Clipboard | undefined;
      await clipboard?.writeText(text);
    } finally {
      setCopied(true);
    }
  };
  return (
    <button
      type="button"
      className={`${EX_BUTTON.secondary} tw-cursor-pointer`}
      onClick={() => void onCopy()}
      aria-live="polite"
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
