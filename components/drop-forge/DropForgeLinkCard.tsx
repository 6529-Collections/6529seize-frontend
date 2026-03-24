"use client";

import {
  ArrowTopRightOnSquareIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

const DEFAULT_CARD_CLASS_NAME =
  "tw-flex tw-flex-col tw-items-stretch tw-gap-2 tw-rounded-lg tw-bg-iron-900/60 tw-px-4 tw-py-3 tw-ring-1 tw-ring-inset tw-ring-iron-800";
const DEFAULT_LABEL_CLASS_NAME =
  "tw-min-w-0 tw-text-sm tw-font-medium tw-text-iron-200";
const ACTION_BUTTON_CLASS_NAME =
  "tw-inline-flex tw-cursor-pointer tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-primary-300 tw-leading-none tw-transition-colors hover:tw-text-primary-500";

export default function DropForgeLinkCard({
  label,
  displayValue,
  displayTitle,
  emptyText = "—",
  copyValue,
  openUrl,
  copyLabel,
  openLabel,
  cardClassName = DEFAULT_CARD_CLASS_NAME,
  labelClassName = DEFAULT_LABEL_CLASS_NAME,
}: Readonly<{
  label: ReactNode;
  displayValue: string | null | undefined;
  displayTitle?: string | null | undefined;
  emptyText?: string;
  copyValue?: string | null | undefined;
  openUrl?: string | null | undefined;
  copyLabel: string;
  openLabel: string;
  cardClassName?: string;
  labelClassName?: string;
}>) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmedDisplayValue = displayValue?.trim() ?? "";
  const trimmedCopyValue = copyValue?.trim() ?? "";
  const trimmedOpenUrl = openUrl?.trim() ?? "";
  const hasDisplayValue = trimmedDisplayValue.length > 0;
  const canCopy = trimmedCopyValue.length > 0;
  const canOpen = trimmedOpenUrl.length > 0;
  const valueClassName = `tw-w-full tw-whitespace-normal tw-break-all tw-text-xs tw-leading-5 ${
    hasDisplayValue ? "tw-text-white" : "tw-text-iron-500"
  }`;

  async function handleCopy() {
    if (!canCopy) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    try {
      await navigator.clipboard.writeText(trimmedCopyValue);
      setCopied(true);
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
        timeoutRef.current = null;
      }, 1000);
    } catch {
      // ignore clipboard failures
    }
  }

  function handleOpen() {
    if (!canOpen || typeof globalThis.open !== "function") {
      return;
    }

    globalThis.open(trimmedOpenUrl, "_blank", "noopener,noreferrer");
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={cardClassName}>
      <div className="tw-flex tw-min-h-10 tw-items-center tw-justify-between tw-gap-3">
        <div className={labelClassName}>{label}</div>
        <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-2">
          {copied && (
            <span className="tw-animate-in tw-fade-in tw-text-xs tw-text-iron-300 tw-duration-150">
              Copied
            </span>
          )}
          {canCopy && (
            <button
              type="button"
              onClick={() => {
                void handleCopy();
              }}
              className={ACTION_BUTTON_CLASS_NAME}
              aria-label={copyLabel}
            >
              <DocumentDuplicateIcon className="tw-h-5 tw-w-5" />
            </button>
          )}
          {canOpen && (
            <button
              type="button"
              onClick={handleOpen}
              className={ACTION_BUTTON_CLASS_NAME}
              aria-label={openLabel}
            >
              <ArrowTopRightOnSquareIcon className="tw-h-5 tw-w-5" />
            </button>
          )}
        </div>
      </div>
      <div
        className={valueClassName}
        title={
          hasDisplayValue
            ? displayTitle?.trim() || trimmedDisplayValue
            : undefined
        }
      >
        {hasDisplayValue ? trimmedDisplayValue : emptyText}
      </div>
    </div>
  );
}
