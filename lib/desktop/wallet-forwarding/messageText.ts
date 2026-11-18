/** Wallet forwarding: messages shown exactly as they are signed. */

import type { Hex } from "viem";
import { isHexBytes } from "./shared";

// `ignoreBOM`: a leading byte-order mark is kept (and then refused), never
// silently dropped, so the text shown is exactly the bytes signed.
export const UTF8 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

/**
 * Code points a reader cannot see or tell apart from others in a preview:
 * controls (C0 and C1, including tab and carriage return), format
 * characters (zero-width spaces and joiners, bidirectional controls, the
 * byte-order mark, soft hyphen, tag characters), private use, surrogates,
 * line and paragraph separators, every space other than U+0020, variation
 * selectors, the combining grapheme joiner, Hangul and Braille blanks.
 * Line feed is the only line break allowed.
 */
const INVISIBLE_CATEGORY = /[\p{Cc}\p{Cf}\p{Co}\p{Cs}\p{Zl}\p{Zp}]/u;
const INVISIBLE_RANGES: readonly (readonly [number, number])[] = [
  [0x00a0, 0x00a0],
  [0x034f, 0x034f],
  [0x115f, 0x1160],
  [0x1680, 0x1680],
  [0x180b, 0x180f],
  [0x2000, 0x200a],
  [0x202f, 0x202f],
  [0x205f, 0x205f],
  [0x2800, 0x2800],
  [0x3000, 0x3000],
  [0x3164, 0x3164],
  [0xfe00, 0xfe0f],
  [0xffa0, 0xffa0],
  [0xe0100, 0xe01ef],
];

function isInvisible(char: string): boolean {
  if (INVISIBLE_CATEGORY.test(char)) return true;
  const codePoint = char.codePointAt(0) ?? 0;
  return INVISIBLE_RANGES.some(
    ([low, high]) => codePoint >= low && codePoint <= high
  );
}

/**
 * True when every code point is visible and no space can hide at the end
 * of a line or of the message, so two different byte strings never give
 * the same preview.
 */
function isShowableText(text: string): boolean {
  if (text.trim().length === 0 || text !== text.trim()) return false;
  return text
    .split("\n")
    .every(
      (line) => line === line.trimEnd() && !Array.from(line).some(isInvisible)
    );
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array((hex.length - 2) / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(2 + i * 2, 4 + i * 2), 16);
  }
  return bytes;
}

/**
 * The text of a `personal_sign` message, or null when the bytes are not
 * text a reader can check exactly: invalid UTF-8, a byte-order mark, any
 * invisible code point, or spaces at the start or end of the message or of
 * a line. Decoding is exact (no replacement, no BOM stripping), so the
 * text returned maps back to exactly one byte string. The page refuses to
 * sign what it cannot show.
 */
export function readWalletMessageText(message: Hex): string | null {
  if (!isHexBytes(message) || message === "0x") return null;
  let text: string;
  try {
    text = UTF8.decode(hexToBytes(message));
  } catch {
    return null;
  }
  return isShowableText(text) ? text : null;
}
