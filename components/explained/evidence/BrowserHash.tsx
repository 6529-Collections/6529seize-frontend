"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { formatCount, shortHash } from "@/lib/explained/format";
import { kt } from "../i18n";
import BreakIt, { breakItLabel } from "../lens/BreakIt";
import { Glyph } from "../marks/glyphs";
import { EX_FOCUS } from "../tokens";

/** After this long still computing, the row says so and offers to try again. */
const SLOW_MS = 8000;

/**
 * The receipt's last row (TDH-DESIGN.md §5.11): the browser fetches the day
 * file's bytes, computes their SHA-256 with WebCrypto and compares it with
 * the index. Computing, equal, different, or not computed in this browser.
 */
type HashState =
  | { readonly status: "computing" }
  | {
      readonly status: "done";
      readonly hex: string;
      readonly bytes: number;
      /** The file's bytes, kept so Break it can change one of them. */
      readonly buffer: ArrayBuffer;
    }
  | { readonly status: "unavailable" };

async function digest(bytes: ArrayBuffer): Promise<string> {
  const hash = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** The file's bytes, from its text or its URL, hashed in this browser. */
async function hashFile(
  src: string | undefined,
  text: string | undefined
): Promise<HashState> {
  // Older browsers and plain-HTTP pages have no Web Crypto.
  const crypto = globalThis.crypto as Crypto | undefined;
  if (crypto?.subtle === undefined) return { status: "unavailable" };
  let bytes: ArrayBuffer;
  if (text !== undefined) {
    bytes = new TextEncoder().encode(text).buffer;
  } else if (src !== undefined) {
    const response = await fetch(src, { cache: "no-store" });
    if (!response.ok) return { status: "unavailable" };
    bytes = await response.arrayBuffer();
  } else {
    return { status: "unavailable" };
  }
  return {
    status: "done",
    hex: await digest(bytes),
    bytes: bytes.byteLength,
    buffer: bytes,
  };
}

/**
 * Break it: the file with one byte changed, the last digit in it turned
 * into the next one, so the change is a number a forger would want, and
 * the hash of the changed bytes. Done in this browser; nothing is sent.
 */
async function hashChanged(
  buffer: ArrayBuffer
): Promise<{ readonly hex: string; readonly at: number }> {
  const bytes = new Uint8Array(buffer.slice(0));
  let at = bytes.length - 1;
  while (at >= 0 && (bytes[at] ?? 0) < 0x30) at -= 1;
  while (at >= 0 && ((bytes[at] ?? 0) < 0x30 || (bytes[at] ?? 0) > 0x39)) {
    at -= 1;
  }
  const index = Math.max(0, at);
  const old = bytes[index] ?? 0x30;
  bytes[index] = old >= 0x30 && old <= 0x38 ? old + 1 : 0x30;
  return { hex: await digest(bytes.buffer), at: index };
}

export default function BrowserHash({
  src,
  text,
  expected,
  locale,
}: {
  /** The day file's URL; fetched as bytes. */
  readonly src?: string;
  /** Or the file's exact text, when the page already holds it. */
  readonly text?: string;
  /** The SHA-256 the index states. */
  readonly expected: string;
  readonly locale: SupportedLocale;
}) {
  const hashed = useQuery({
    queryKey: ["explained", "browser-hash", src ?? null, text ?? null],
    queryFn: () => hashFile(src, text),
    staleTime: Infinity,
    retry: false,
  });
  let state: HashState = hashed.data ?? { status: "computing" };
  if (hashed.isError) state = { status: "unavailable" };
  const [broken, setBroken] = useState(false);
  const changed = useQuery({
    queryKey: ["explained", "browser-hash-changed", src ?? null, text ?? null],
    queryFn: () => (state.status === "done" ? hashChanged(state.buffer) : null),
    enabled: broken && state.status === "done",
    staleTime: Infinity,
    retry: false,
  });
  const [slow, setSlow] = useState(false);
  const computing = state.status === "computing";
  useEffect(() => {
    if (!computing) {
      setSlow(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setSlow(true), SLOW_MS);
    return () => window.clearTimeout(timer);
  }, [computing]);

  let shown = kt(locale, "explained.kit.receipt.computing");
  let verdict: string | null = null;
  let mark: string = state.status;
  if (state.status === "done" && broken && changed.data) {
    shown = shortHash(changed.data.hex);
    mark = "differs";
    verdict = kt(locale, "explained.kit.receipt.hashChanged", {
      at: formatCount(locale, changed.data.at + 1),
      bytes: formatCount(locale, state.bytes),
    });
  } else if (state.status === "done") {
    shown = shortHash(state.hex);
    const equal = state.hex === expected;
    mark = equal ? "equal" : "differs";
    verdict = equal
      ? kt(locale, "explained.kit.receipt.hashEquals", {
          bytes: formatCount(locale, state.bytes),
        })
      : kt(locale, "explained.kit.receipt.hashDiffers");
  } else if (state.status === "unavailable") {
    shown = kt(locale, "explained.kit.receipt.hashUnavailable");
  }
  return (
    <span
      className="tw-flex tw-w-full tw-flex-col tw-gap-1"
      data-browser-hash={mark}
      aria-live="polite"
    >
      <span
        className="tw-font-mono tw-text-[13px] tw-normal-case tw-text-iron-50 md:tw-text-sm"
        {...(state.status === "done" ? { "data-hash": state.hex } : {})}
      >
        {shown}
      </span>
      {computing && slow && (
        <span className="tw-text-[15px] tw-font-normal tw-leading-[22px] tw-text-iron-400">
          {kt(locale, "explained.kit.receipt.slow", {
            hash: shortHash(expected),
          })}{" "}
          <button
            type="button"
            className={`hover:tw-text-primary-200 tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 tw-font-semibold tw-text-primary-300 ${EX_FOCUS}`}
            onClick={() => {
              setSlow(false);
              void hashed.refetch();
            }}
          >
            {kt(locale, "explained.kit.receipt.retry")}
          </button>
        </span>
      )}
      {verdict !== null && (
        <span className="tw-grid tw-grid-cols-[14px_minmax(0,1fr)] tw-gap-2 tw-text-[15px] tw-font-normal tw-leading-[22px] tw-text-iron-300">
          <Glyph
            kind={mark === "equal" ? "tested" : "shownFalse"}
            className="tw-mt-1 tw-size-[13px]"
          />
          <span>{verdict}</span>
        </span>
      )}
      {state.status === "done" && (
        <span className="tw-mt-1">
          <BreakIt
            id="byte"
            pressed={broken}
            onToggle={() => setBroken((value) => !value)}
            label={
              broken
                ? kt(locale, "explained.kit.receipt.byteBack")
                : breakItLabel(
                    locale,
                    kt(locale, "explained.kit.receipt.byteEdge")
                  )
            }
          />
        </span>
      )}
    </span>
  );
}
