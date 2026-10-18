"use client";

import { useState } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { shortHash } from "@/lib/explained/format";
import { kt } from "../i18n";
import { EX_FOCUS } from "../tokens";
import HashStripes from "./HashStripes";

/**
 * A hash, a root or an ID (EXPLAINED.md §6.3): shown short, copied whole,
 * never localized. Its case is kept: capitals would change its meaning.
 */
export default function Hash({
  value,
  locale,
  short = [4, 4],
  copy = false,
  stripes = false,
  name,
}: {
  readonly value: string;
  readonly locale: SupportedLocale;
  /** Bytes shown before and after the ellipsis; null shows it whole. */
  readonly short?: readonly [number, number] | null;
  readonly copy?: boolean;
  readonly stripes?: boolean;
  /** What the value is, for the copy button's name: "the cycle root". */
  readonly name?: string;
}) {
  const [copied, setCopied] = useState(false);
  const shown = short === null ? value : shortHash(value, short);
  const onCopy = async () => {
    try {
      // Plain-HTTP pages and older browsers have no clipboard.
      const clipboard = navigator.clipboard as Clipboard | undefined;
      await clipboard?.writeText(value);
    } finally {
      setCopied(true);
    }
  };
  return (
    <span className="tw-inline-flex tw-max-w-full tw-flex-wrap tw-items-center tw-gap-2 tw-align-middle">
      <span
        className="tw-break-all tw-font-mono tw-text-[13px] tw-normal-case tw-leading-5 tw-tracking-normal tw-text-iron-50 md:tw-text-sm"
        title={value}
        data-hash={value}
      >
        {shown}
      </span>
      {stripes && <HashStripes hex={value} />}
      {copy && (
        <button
          type="button"
          onClick={() => void onCopy()}
          className={`tw-min-h-6 tw-cursor-pointer tw-rounded tw-border-0 tw-bg-transparent tw-p-0 tw-text-[13px] tw-font-semibold tw-text-primary-300 hover:tw-underline ${EX_FOCUS}`}
          aria-label={kt(locale, "explained.kit.hash.copyLabel", {
            name: name ?? shown,
          })}
        >
          {kt(
            locale,
            copied ? "explained.kit.hash.copied" : "explained.kit.hash.copy"
          )}
        </button>
      )}
    </span>
  );
}
