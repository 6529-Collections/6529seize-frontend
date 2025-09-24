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
 * Replaces break-like HTML tags with newline characters without using complex regular expressions.
 * Keeps other tags untouched so callers can continue to run standard sanitizers afterwards.
 */
export function replaceHtmlBreaksWithNewlines(value: string): string {
  if (!value.includes("<")) {
    return value;
  }

  let result = "";
  let index = 0;

  while (index < value.length) {
    const char = value[index];
    if (char !== "<") {
      result += char;
      index += 1;
      continue;
    }

    const closeIndex = value.indexOf(">", index + 1);
    if (closeIndex === -1) {
      result += value.slice(index);
      break;
    }

    const rawTag = value.slice(index + 1, closeIndex);
    const identifier = getTagIdentifier(rawTag);

    if (identifier === "br" || identifier === "/p") {
      result += "\n";
    } else {
      result += `<${rawTag}>`;
    }

    index = closeIndex + 1;
  }

  return result;
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

function getTagIdentifier(rawTag: string): string | null {
  let start = 0;
  const length = rawTag.length;

  while (start < length && isWhitespace(rawTag[start])) {
    start += 1;
  }

  if (start >= length) {
    return null;
  }

  let closing = false;
  if (rawTag[start] === "/") {
    closing = true;
    start += 1;
  }

  while (start < length && isWhitespace(rawTag[start])) {
    start += 1;
  }

  if (start >= length) {
    return null;
  }

  let name = "";
  while (start < length) {
    const char = rawTag[start];
    if (!isTagNameChar(char)) {
      break;
    }
    name += char.toLowerCase();
    start += 1;
  }

  if (!name) {
    return null;
  }

  return closing ? `/${name}` : name;
}

function isWhitespace(char: string): boolean {
  return (
    char === " " ||
    char === "\n" ||
    char === "\r" ||
    char === "\t" ||
    char === "\f"
  );
}

function isTagNameChar(char: string): boolean {
  const code = char.charCodeAt(0);
  const isLower = code >= 97 && code <= 122;
  const isUpper = code >= 65 && code <= 90;
  const isDigit = code >= 48 && code <= 57;
  return isLower || isUpper || isDigit || char === "-" || char === "_";
}
