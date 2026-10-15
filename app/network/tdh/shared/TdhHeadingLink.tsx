"use client";

import { LinkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { TDH_FOCUS_RING } from "./tdhStyles";

/**
 * A link button beside a section heading: it moves to the section's anchor and
 * copies the section's address, announcing the copy politely.
 */
export default function TdhHeadingLink({
  id,
  label,
  copiedLabel,
}: {
  readonly id: string;
  readonly label: string;
  readonly copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }
    const timer = globalThis.setTimeout(() => setCopied(false), 2_000);
    return () => globalThis.clearTimeout(timer);
  }, [copied]);

  return (
    <>
      <a
        href={`#${id}`}
        aria-label={label}
        onClick={() => {
          const { origin, pathname } = globalThis.location;
          // The clipboard is missing outside secure contexts; the link still moves to the section.
          try {
            globalThis.navigator.clipboard
              .writeText(`${origin}${pathname}#${id}`)
              .then(() => setCopied(true))
              .catch(() => setCopied(false));
          } catch {
            setCopied(false);
          }
        }}
        className={`tw-inline-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-text-iron-600 tw-transition-colors hover:tw-bg-iron-900 hover:tw-text-iron-200 motion-reduce:tw-transition-none ${TDH_FOCUS_RING}`}
      >
        <LinkIcon aria-hidden="true" className="tw-size-4" />
      </a>
      <span className="tw-sr-only" role="status" aria-live="polite">
        {copied ? copiedLabel : ""}
      </span>
    </>
  );
}
