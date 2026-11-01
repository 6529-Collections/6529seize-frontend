"use client";

import { useEffect, useState } from "react";
import { EX_FOCUS } from "@/components/explained/tokens";

/**
 * A command to type, with a button that copies it. The command breaks only
 * between its words, never inside one ("hybrid-sleep.target" stays whole),
 * and copies exactly as shown.
 */
export default function CopyCommand({
  cmd,
  label,
  copied,
}: {
  readonly cmd: string;
  /** "Copy", and the button's name for screen readers. */
  readonly label: string;
  /** "Copied", shown for a moment after a copy. */
  readonly copied: string;
}) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return undefined;
    const timer = window.setTimeout(() => setDone(false), 1600);
    return () => window.clearTimeout(timer);
  }, [done]);
  const copy = () => {
    void navigator.clipboard
      ?.writeText(cmd)
      .then(() => setDone(true))
      .catch(() => setDone(false));
  };
  const words = cmd.split(" ");
  return (
    <span className="tw-mt-1 tw-flex tw-items-start tw-gap-2">
      <code
        className="tw-min-w-0 tw-flex-1 tw-rounded-md tw-bg-iron-900 tw-px-2.5 tw-py-1.5 tw-font-mono tw-text-[13px] tw-leading-5 tw-text-iron-50"
        data-command=""
      >
        {words.map((word, index) => (
          <span key={`${word}-${index}`}>
            <span className="tw-whitespace-nowrap">{word}</span>
            {index < words.length - 1 ? " " : null}
          </span>
        ))}
      </code>
      <button
        type="button"
        onClick={copy}
        aria-label={`${label}: ${cmd}`}
        className={`tw-min-h-9 tw-min-w-[64px] tw-flex-none tw-cursor-pointer tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-transparent tw-px-2.5 tw-text-[13px] tw-font-semibold tw-text-iron-300 hover:tw-border-iron-500 hover:tw-text-iron-50 ${EX_FOCUS}`}
      >
        {done ? copied : label}
      </button>
      <span className="tw-sr-only" aria-live="polite">
        {done ? copied : ""}
      </span>
    </span>
  );
}
