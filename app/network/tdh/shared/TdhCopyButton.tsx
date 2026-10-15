"use client";

import { CheckIcon, Square2StackIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { TDH_FOCUS_RING } from "./tdhStyles";

type CopyState = "idle" | "copied" | "failed";

/**
 * Copies a value to the clipboard and announces the result politely. The
 * accessible name carries what is copied, so a truncated hash is still read
 * in full. The icon-only button is 28 px, so it sits on the line of the value
 * it copies, and an invisible margin around it keeps a 44 px target.
 */
export default function TdhCopyButton({
  value,
  label,
  copiedLabel,
  failedLabel,
  className = "",
  showText = false,
  textLabel,
}: {
  readonly value: string;
  readonly label: string;
  readonly copiedLabel: string;
  readonly failedLabel: string;
  readonly className?: string;
  readonly showText?: boolean;
  readonly textLabel?: string;
}) {
  const [state, setState] = useState<CopyState>("idle");

  useEffect(() => {
    if (state === "idle") {
      return undefined;
    }
    const timer = globalThis.setTimeout(() => setState("idle"), 2_000);
    return () => globalThis.clearTimeout(timer);
  }, [state]);

  const copy = async () => {
    try {
      await globalThis.navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
  };

  let status = "";
  if (state === "copied") {
    status = copiedLabel;
  } else if (state === "failed") {
    status = failedLabel;
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={label}
        className={`tw-relative tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-md tw-border-0 tw-bg-transparent tw-text-xs tw-font-medium tw-text-iron-400 tw-transition-colors hover:tw-bg-iron-800 hover:tw-text-iron-100 motion-reduce:tw-transition-none ${
          showText
            ? "tw-min-h-11 tw-min-w-11 tw-px-2"
            : "tw-size-7 tw-p-0 before:tw-absolute before:-tw-inset-2 before:tw-rounded-lg"
        } ${TDH_FOCUS_RING} ${className}`}
      >
        {state === "copied" ? (
          <CheckIcon aria-hidden="true" className="tw-size-4 tw-text-success" />
        ) : (
          <Square2StackIcon aria-hidden="true" className="tw-size-4" />
        )}
        {showText && (
          <span aria-hidden="true">
            {state === "copied" ? copiedLabel : (textLabel ?? label)}
          </span>
        )}
      </button>
      <span className="tw-sr-only" role="status" aria-live="polite">
        {status}
      </span>
    </>
  );
}
