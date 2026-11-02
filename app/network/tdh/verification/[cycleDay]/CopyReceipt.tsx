"use client";

import { useState } from "react";
import { Icon } from "@/components/explained/marks/glyphs";
import { EX_BUTTON } from "@/components/explained/tokens";

/**
 * "Copy the receipt as text" (TDH-DESIGN.md §4.5): every row of the
 * receipt, label and value, with each hash in full, as the server read the
 * day's file.
 */
export default function CopyReceipt({
  text,
  label,
  done,
}: {
  readonly text: string;
  readonly label: string;
  readonly done: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
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
      onClick={() => void copy()}
      aria-live="polite"
    >
      <Icon kind="copy" />
      {copied ? done : label}
    </button>
  );
}
