export interface StripHtmlTagsOptions {
  readonly maxLength?: number;
  readonly preserveTagSpacing?: boolean;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

/**
 * Removes HTML tags from a string without relying on fragile regular expressions.
 * Optionally inserts a single space where tags were present to preserve word boundaries
 * and limits processing length to avoid pathological worst-cases.
 */
export function stripHtmlTags(value: string, options: StripHtmlTagsOptions = {}): string {
  const { maxLength, preserveTagSpacing = false } = options;
  const input =
    typeof maxLength === "number" && maxLength >= 0 && value.length > maxLength
      ? value.slice(0, maxLength)
      : value;

  let insideTag = false;
  let pendingSpace = false;
  const output: string[] = [];

  for (const char of input) {
    if (char === "<") {
      insideTag = true;
      if (preserveTagSpacing) {
        pendingSpace = output.length > 0;
      }
      continue;
    }

    if (char === ">") {
      insideTag = false;
      continue;
    }

    if (insideTag) {
      continue;
    }

    if (preserveTagSpacing && pendingSpace) {
      if (output[output.length - 1] !== " ") {
        output.push(" ");
      }
      pendingSpace = false;
    }

    output.push(char);
  }

  return removeResidualTags(output.join(""));
}

/**
 * Decodes a limited set of known HTML entities and numeric references.
 * Unknown entities are removed to avoid re-introducing unsafe sequences.
 */
export function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_match, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const codePoint = Number.parseInt(entity.slice(2), 16);
      return Number.isNaN(codePoint) ? "" : String.fromCodePoint(codePoint);
    }
    if (entity.startsWith("#")) {
      const codePoint = Number.parseInt(entity.slice(1), 10);
      return Number.isNaN(codePoint) ? "" : String.fromCodePoint(codePoint);
    }

    return NAMED_ENTITIES[entity] ?? "";
  });
}

/**
 * Convenience helper that removes HTML tags and decodes entities in one go.
 */
export function sanitizeHtmlToText(value: string, options: StripHtmlTagsOptions = {}): string {
  return removeResidualTags(decodeHtmlEntities(stripHtmlTags(value, options)));
}

function removeResidualTags(value: string): string {
  const tagPattern = /<[^>]*>/g;
  let output = value;
  let previous: string;
  do {
    previous = output;
    output = output.replace(tagPattern, "");
  } while (output !== previous);
  return output.replace(/</g, "");
}
