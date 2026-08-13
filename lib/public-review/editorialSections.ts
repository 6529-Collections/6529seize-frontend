import {
  PUBLIC_REVIEW_EVIDENCE_STATES,
  type PublicReviewEvidenceState,
  type PublicReviewSectionDefinition,
} from "@/lib/public-review/publicReviewTypes";

const MARKDOWN_DECORATION = new Set(["`", "*", "_", "~"]);
const LETTER_OR_NUMBER = /[\p{Letter}\p{Number}]/u;
const PUBLIC_REVIEW_HEADING_ID_ALIASES: Readonly<Record<string, string>> = {
  "What the signed details contain": "the-exact-authorization",
  "Who can approve mints and auctions": "eoa-and-contract-wallet-signers",
  "How a fixed-price mint works": "fixed-price-execution",
  "How an auction starts": "auction-registration",
  "How unused permissions can be stopped":
    "cancellation-consumption-and-rotation",
  "Can someone copy the transaction?": "transaction-ordering-and-mev",
  "What the contract cannot verify":
    "offchain-evidence-completes-the-authorization",
  "A public proof page is still needed": "the-authorization-receipt",
  "How to test that Stream fails safely": "failure-modes-reviewers-should-test",
};
const EVIDENCE_STATE_RULES: readonly {
  readonly state: PublicReviewEvidenceState;
  readonly pattern: RegExp;
  readonly excludedPattern?: RegExp;
}[] = [
  {
    state: "IMPLEMENTED",
    pattern: /\bIMPLEMENTED\b/,
    excludedPattern: /\bNOT IMPLEMENTED\b/,
  },
  { state: "TESTED", pattern: /\bTESTED\b/ },
  {
    state: "PROPOSED",
    pattern: /\b(?:PROPOSED|ACCEPTED TARGET\s*-\s*NOT IMPLEMENTED)\b/,
  },
  { state: "OPEN_FOR_FEEDBACK", pattern: /\bOPEN FOR FEEDBACK\b/ },
  { state: "AUDIT_PENDING", pattern: /\bAUDIT PENDING\b/ },
  { state: "DEFERRED", pattern: /\bDEFERRED\b/ },
  {
    state: "KNOWN_LIMITATION",
    pattern:
      /\b(?:KNOWN LIMITATION|IMPORTANT LIMITATION|IMPORTANT LIMIT|EVIDENCE PENDING|CANDIDATE UNBOUND)\b/,
  },
] as const;

function isAsciiDigit(character: string | undefined): boolean {
  return character !== undefined && character >= "0" && character <= "9";
}

function removeOrderedPrefix(value: string): string {
  let index = 0;
  while (isAsciiDigit(value[index])) {
    index += 1;
  }

  if (index === 0 || value[index] !== ".") {
    return value;
  }

  index += 1;
  while (index < value.length && (value[index]?.trim().length ?? 0) === 0) {
    index += 1;
  }
  return value.slice(index);
}

export function getPublicReviewHeadingId(title: string): string {
  const aliasedId = PUBLIC_REVIEW_HEADING_ID_ALIASES[title];
  if (aliasedId !== undefined) {
    return aliasedId;
  }

  const normalized = removeOrderedPrefix(
    Array.from(title.normalize("NFKD"))
      .filter((character) => !MARKDOWN_DECORATION.has(character))
      .join("")
      .toLowerCase()
  );
  let result = "";
  let separatorPending = false;

  for (const character of normalized) {
    if (LETTER_OR_NUMBER.test(character)) {
      if (separatorPending && result.length > 0) {
        result += "-";
      }
      result += character;
      separatorPending = false;
    } else if (result.length > 0) {
      separatorPending = true;
    }
  }

  return result;
}

export function getUniquePublicReviewHeadingId(
  title: string,
  headingCounts: Map<string, number>
): string {
  const baseId = getPublicReviewHeadingId(title);
  if (baseId.length === 0) {
    return "";
  }

  const count = (headingCounts.get(baseId) ?? 0) + 1;
  headingCounts.set(baseId, count);
  return count === 1 ? baseId : `${baseId}-${count}`;
}

export function extractPublicReviewSections(
  markdown: string
): PublicReviewSectionDefinition[] {
  const headingCounts = new Map<string, number>();
  const sections: PublicReviewSectionDefinition[] = [];

  for (const line of markdown.split("\n")) {
    if (!line.startsWith("## ") || line.startsWith("### ")) {
      continue;
    }

    const title = line.slice(3).trim();
    const id = getUniquePublicReviewHeadingId(title, headingCounts);
    if (id.length > 0) {
      sections.push({ id, title });
    }
  }

  return sections;
}

function normalizeEvidenceMarker(value: string): string {
  return value
    .normalize("NFKC")
    .replaceAll("—", "-")
    .replaceAll("–", "-")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function extractEvidenceMarkers(markdown: string): string[] {
  const headings = Array.from(
    markdown.matchAll(/^###\s+(.+)$/gm),
    (match) => match[1] ?? ""
  );
  const emphasizedLabels = Array.from(
    markdown.matchAll(/\*\*([\s\S]*?)\*\*/g),
    (match) => match[1] ?? ""
  );

  return [...headings, ...emphasizedLabels].map(normalizeEvidenceMarker);
}

export function extractPublicReviewEvidenceStates(
  markdown: string
): PublicReviewEvidenceState[] {
  const markers = extractEvidenceMarkers(markdown);
  const detected = new Set<PublicReviewEvidenceState>();

  for (const marker of markers) {
    for (const rule of EVIDENCE_STATE_RULES) {
      const excluded = rule.excludedPattern?.test(marker) ?? false;
      if (!excluded && rule.pattern.test(marker)) {
        detected.add(rule.state);
      }
    }
  }

  return PUBLIC_REVIEW_EVIDENCE_STATES.filter((state) => detected.has(state));
}
