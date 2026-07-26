import type { PublicReviewSectionDefinition } from "@/lib/public-review/publicReviewTypes";

const MARKDOWN_DECORATION = new Set(["`", "*", "_", "~"]);
const LETTER_OR_NUMBER = /[\p{Letter}\p{Number}]/u;

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
