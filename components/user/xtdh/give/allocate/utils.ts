import type { XtdhStandard } from "../../types";

export type SearchResult = {
  address: string;
  name?: string;
  standard: XtdhStandard;
  verified?: boolean;
};

export function normalizeStandard(input: any): XtdhStandard {
  const v = String(input || "").toUpperCase();
  if (v.includes("1155")) return "ERC1155";
  if (v.includes("721")) return "ERC721";
  return "UNKNOWN";
}

export function short(addr: string): string {
  if (!addr?.startsWith("0x") || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function parseTokenIdsInput(input: string): string[] {
  const next = new Set<string>();
  const parts = (input || "")
    .split(/[\s,]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  for (const part of parts) {
    if (/^\d+$/.test(part)) {
      next.add(String(Number(part)));
    } else if (/^(\d+)-(\d+)$/.test(part)) {
      const [, a, b] = part.match(/(\d+)-(\d+)/)!;
      let start = Number(a);
      let end = Number(b);
      if (start > end) [start, end] = [end, start];
      for (let i = start; i <= end; i++) next.add(String(i));
    }
  }
  return Array.from(next);
}

