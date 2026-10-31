"use client";

import { useState } from "react";
import { useFactSnapshot } from "@/components/explained/facts/FactsProvider";
import { fill } from "@/components/explained/i18n";
import { EX_FOCUS } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { k } from "./_lib/copy";
import { pageFacts } from "./_lib/facts";
import { rich } from "@/components/explained/rich";

/**
 * Proof A's public values for 2026-10-11 as the verifier reads them: one
 * 32-byte word a line, in the statement's order, behind a disclosure so it
 * costs the page no words until opened (its body is rendered only when
 * open); copied whole as one hex string.
 */
export default function RawBytes({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const facts = pageFacts(useFactSnapshot(), locale);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const words = facts.strings("proofs.day.wordsA");
  if (!words) return null;
  const whole = `0x${words.join("")}`;
  const onCopy = async () => {
    try {
      const clipboard = navigator.clipboard as Clipboard | undefined;
      await clipboard?.writeText(whole);
    } finally {
      setCopied(true);
    }
  };
  return (
    <details
      className="tw-group tw-mt-5 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950"
      data-raw-bytes=""
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary
        className={`tw-flex tw-min-h-11 tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-3 tw-rounded-xl tw-px-[18px] tw-py-3 tw-text-[15px] tw-font-semibold tw-text-iron-50 [&::-webkit-details-marker]:tw-hidden ${EX_FOCUS}`}
      >
        <span>
          {rich(locale, k("raw.summary"), {
            bytes: facts.print("proofs.statement.bytes"),
          })}
        </span>
        <span
          className="tw-text-iron-400 tw-transition-transform group-open:tw-rotate-180 motion-reduce:tw-transition-none"
          aria-hidden="true"
        >
          ▾
        </span>
      </summary>
      {open && (
        <div className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-900 tw-px-[18px] tw-pb-4 tw-pt-3">
          <p className="tw-m-0 tw-text-[15px] tw-leading-[23px] tw-text-iron-400">
            {rich(locale, k("raw.cap"), {
              date: facts.print("proofs.day.date"),
            })}
          </p>
          <pre
            className="tw-m-0 tw-mt-3 tw-whitespace-pre-wrap tw-break-all tw-rounded-md tw-bg-black/40 tw-p-3 tw-font-mono tw-text-[12px] tw-leading-5 tw-text-iron-300 md:tw-text-[13px]"
            data-hash={whole}
          >
            {/* One line per word: each is a hash, which may break anywhere;
                the block holds no sentence to break. The words are fixed in
                number and order. */}
            {words.map((word, index) => (
              <span key={index} className="tw-block">
                {word}
              </span>
            ))}
          </pre>
          <button
            type="button"
            onClick={() => void onCopy()}
            className={`tw-mt-3 tw-min-h-9 tw-cursor-pointer tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-transparent tw-px-4 tw-text-[13px] tw-font-semibold tw-text-iron-50 hover:tw-border-iron-400 ${EX_FOCUS}`}
          >
            {fill(locale, copied ? "explained.kit.hash.copied" : k("raw.copy"))}
          </button>
        </div>
      )}
    </details>
  );
}
