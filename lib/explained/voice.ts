/**
 * The voice lint (EXPLAINED.md §10) and the number lint (TDH-DESIGN.md §2),
 * run in CI on every 6529 Explained message string. The first catches the
 * words that overreach; the second, a number typed into copy instead of
 * filled from a fact.
 */

export interface VoiceRule {
  readonly id: string;
  readonly pattern: RegExp;
  /** What to write instead (EXPLAINED.md §10's lint list). */
  readonly instead: string;
}

export const VOICE_RULES: readonly VoiceRule[] = [
  {
    id: "independent",
    pattern: /\bindependent(ly)?\b/i,
    instead: "separately written",
  },
  {
    id: "proved-to-ethereum",
    pattern: /\bproved to Ethereum\b/i,
    instead: "mainnet's SP1 verifier accepts it in a read-only call",
  },
  {
    // Any "proven on/to Ethereum" or "checked on Ethereum" said of a day or
    // a proof, in every locale, titles and nav labels included: nothing is
    // recorded on Ethereum until the contract is deployed. A sentence that
    // says so ("not ... yet") may name it.
    id: "proven-on-ethereum",
    pattern:
      /\b(prove[nd]?|checked)\b[^.]{0,20}\b(on|to) Ethereum\b(?![^.]*\b(not|yet)\b)|auf Ethereum (bewiesen|geprüft)|(prouvée?s?|vérifiée?s?) sur Ethereum|(probad[oa]s?|comprobad[oa]s?) en Ethereum/i,
    instead:
      "zero-knowledge proofs; mainnet's verifier accepts it in a read-only call",
  },
  {
    id: "proof-a-on-ethereum",
    pattern: /\bproof A\b[^.]*\bon Ethereum\b/i,
    instead: "mainnet's SP1 verifier accepts it in a read-only call",
  },
  {
    id: "checked-in-public",
    pattern: /\bchecked in public\b/i,
    instead: "published every day, with the files to check it",
  },
  {
    id: "overclaim",
    pattern: /\b(fully verified|trustless|mathematically proven)\b/i,
    instead: "the mechanism and its mark",
  },
  {
    id: "old-rule-name",
    pattern: /\bTDH-v1\b(?!\.)|\btdh-v1\.0\b/,
    instead:
      "TDH v1.4 (a receipt prints what its file reports, from the facts)",
  },
  {
    id: "fourth-wallet-pending",
    pattern:
      /\b(fourth|4th) wallet\b[^.]*\bpending\b|\bpending\b[^.]*\b(fourth|4th) wallet\b/i,
    instead: "Decided, D136",
  },
  {
    id: "validator-v1",
    pattern: /\bValidator v1\b/,
    instead: "the validator software, from its version fact",
  },
  {
    id: "explained-verdict",
    pattern: /\bverdict\b[^.]*\bExplained\b|\bExplained\b[^.]*\bverdict\b/,
    instead: "Known cause",
  },
  {
    // D142: NIC stands for Network Identity Check, a rating, never a credit.
    id: "nic-credit",
    pattern: /\bNetwork Identity Credits?\b/i,
    instead: "NIC (Network Identity Check, D142): a rating, never a credit",
  },
  { id: "cco", pattern: /\bCCO\b/, instead: "CC0" },
  { id: "dao", pattern: /\bDAOs?\b/, instead: "the organization's name" },
  { id: "casino", pattern: /\b(moon|yields?|returns)\b/i, instead: "nothing" },
];

export interface VoiceHit {
  readonly key: string;
  readonly rule: string;
  readonly text: string;
  readonly instead: string;
}

/** The verdict word a key must never be: the verdict is "Known cause". */
function isExplainedVerdict(key: string, text: string): boolean {
  return /verdict/i.test(key) && /^\s*Explained\s*$/.test(text);
}

export function lintVoice(
  messages: Readonly<Record<string, string>>
): VoiceHit[] {
  const hits: VoiceHit[] = [];
  for (const [key, text] of Object.entries(messages)) {
    for (const rule of VOICE_RULES) {
      if (rule.pattern.test(text)) {
        hits.push({ key, rule: rule.id, text, instead: rule.instead });
      }
    }
    if (isExplainedVerdict(key, text)) {
      hits.push({
        key,
        rule: "explained-verdict",
        text,
        instead: "Known cause",
      });
    }
  }
  return hits;
}

/**
 * Names that contain digits and are not quantities: 6529 and its domains,
 * CC0, SP1, Groth16 and BN254, SHA-256, token standards, card numbers
 * (#562), decision and proposal numbers (D136, P26), specification sections
 * (§5.2), the rules' name (TDH v1.4, D137) and placeholders ({count}).
 */
const NAME_TOKENS: readonly RegExp[] = [
  /\{\w+\}/g,
  /\b6529(?:\.io)?\b/g,
  /\bCC0\b/g,
  /\bSP1\b/g,
  /\bGroth16\b/g,
  /\bBN254\b/g,
  /\bSHA-256\b/g,
  /\bERC-(?:1155|721|20)\b/g,
  /#\d+/g,
  /\b[DP]\d{1,3}\b/g,
  /§ ?[\d.]*\d/g,
  /\bTDH v\d+\.\d+\b/g,
  /\bEIP-\d+\b/g,
];

/** The numbers left in a string once names are taken out: each should be a fact. */
export function typedNumbers(text: string): string[] {
  let rest = text;
  for (const token of NAME_TOKENS) {
    rest = rest.replace(token, " ");
  }
  return rest.match(/\d[\d,.]*/g) ?? [];
}

export function lintNumbers(
  messages: Readonly<Record<string, string>>
): { key: string; numbers: string[] }[] {
  return Object.entries(messages)
    .map(([key, text]) => ({ key, numbers: typedNumbers(text) }))
    .filter((hit) => hit.numbers.length > 0);
}

/** Amber is never a status colour (EXPLAINED.md §3 rule 9). */
export const AMBER =
  /tw-[a-z-]*(amber|yellow|orange)-\d|#(f59e0b|fbbf24|f79009|fdb022|fec84b|dc6803|b54708|ffb020)\b/i;
