import type { MessageKey } from "@/i18n/messages";

/**
 * The page's own strings: `explained.tdh.proofs.*`, in
 * `i18n/messages/explainedTdhProofs.<locale>.json`. A key that does not
 * exist in en-US fails the typecheck.
 */
type ProofsKey = Extract<MessageKey, `explained.tdh.proofs.${string}`>;

type Suffix<K> = K extends `explained.tdh.proofs.${infer S}` ? S : never;

type ProofsSuffix = Suffix<ProofsKey>;

/** `k("h1")` is `explained.tdh.proofs.h1`, typed. */
export function k(suffix: ProofsSuffix): ProofsKey {
  return `explained.tdh.proofs.${suffix}` as ProofsKey;
}

/** The page's route and its place in the chapter (the map's id). */
export const PROOFS_ROUTE = "/network/tdh/proofs";
export const PROOFS_PAGE_ID = "proofs";
