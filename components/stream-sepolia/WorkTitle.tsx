"use client";

import type { Address } from "viem";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import "@/i18n/namespaces/stream-sepolia";

import { useWorkMeta } from "./useStreamData";

/** A work's stored title, or "Work {id}" until it loads or when it has none. */
export function WorkTitle({ token, tokenId }: { readonly token: Address; readonly tokenId: bigint }) {
  const locale = useBrowserLocale();
  const meta = useWorkMeta(token, tokenId);
  return <>{meta.data?.name ?? t(locale, "streamSepolia.work.untitled", { id: tokenId.toString() })}</>;
}
