"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import { buildDropClipboardText } from "@/helpers/waves/drop-clipboard.helpers";
import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";

interface WaveDropMobileMenuCopyTextProps {
  readonly drop: ApiDrop;
  readonly onCopy: () => void;
}

export default function WaveDropMobileMenuCopyText({
  drop,
  onCopy,
}: WaveDropMobileMenuCopyTextProps) {
  const [copied, setCopied] = useState(false);
  const copiedResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const isMountedRef = useRef(true);
  const isTemporaryDrop = drop.id.startsWith("temp-");

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (copiedResetTimeoutRef.current !== null) {
        globalThis.clearTimeout(copiedResetTimeoutRef.current);
      }
    };
  }, []);

  const copyToClipboard = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (isTemporaryDrop) {
      return;
    }

    const clipboard = globalThis.navigator.clipboard as
      | { writeText?: (text: string) => Promise<void> }
      | undefined;

    if (typeof clipboard?.writeText !== "function") {
      onCopy();
      return;
    }

    const dropText = buildDropClipboardText(drop);

    void clipboard
      .writeText(dropText)
      .then(() => {
        if (!isMountedRef.current) {
          return;
        }

        setCopied(true);
        onCopy();
        if (copiedResetTimeoutRef.current !== null) {
          globalThis.clearTimeout(copiedResetTimeoutRef.current);
        }
        copiedResetTimeoutRef.current = globalThis.setTimeout(() => {
          if (isMountedRef.current) {
            setCopied(false);
            copiedResetTimeoutRef.current = null;
          }
        }, 2000);
      })
      .catch(() => {
        onCopy();
      });
  };

  return (
    <button
      type="button"
      className={`tw-flex tw-items-center tw-gap-x-4 tw-rounded-xl tw-border-0 tw-bg-iron-950 tw-p-4 ${
        isTemporaryDrop
          ? "tw-cursor-default tw-opacity-50"
          : "active:tw-bg-iron-800"
      } tw-transition-colors tw-duration-200`}
      onClick={copyToClipboard}
      disabled={isTemporaryDrop}
    >
      <svg
        className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-300"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z"
        />
      </svg>
      <span
        className={`tw-text-base tw-font-semibold ${
          copied ? "tw-text-primary-400" : "tw-text-iron-300"
        }`}
      >
        {copied ? "Copied!" : "Copy text"}
      </span>
    </button>
  );
}
