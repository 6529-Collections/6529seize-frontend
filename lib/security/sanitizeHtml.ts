/**
 * Client-side allow-list sanitizer for HTML documents that are fetched from
 * remote storage and rendered with `dangerouslySetInnerHTML`.
 *
 * The document is parsed with `DOMParser` into an inert document (no scripts
 * run and no resources load while parsing). Only elements and attributes named
 * by the caller's profile are kept, so anything not explicitly allowed is
 * removed before the markup reaches the live DOM. Call it from an effect and
 * render nothing until it returns: it intentionally returns an empty string
 * when `DOMParser` is unavailable, so it never produces unsanitized output
 * during server rendering.
 */

const XHTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const URL_RESOLUTION_BASE = "https://sanitizer.invalid/";

const HREF_PROTOCOLS: ReadonlySet<string> = new Set([
  "http:",
  "https:",
  "mailto:",
  "tel:",
]);
const SRC_PROTOCOLS: ReadonlySet<string> = new Set(["https:"]);

const ID_PATTERN = /^[A-Za-z][\w:.-]{0,99}$/;
const DIMENSION_PATTERN = /^\d{1,4}%?$/;
const STYLE_PROPERTIES: ReadonlySet<string> = new Set([
  "max-width",
  "max-height",
  "width",
  "height",
]);
const STYLE_KEYWORD_PATTERN = /^(?:auto|none|0)$/i;
const STYLE_LENGTH_PATTERN = /^\d{1,4}(?:px|%|vh|vw|em|rem)$/i;

export interface HtmlSanitizeProfile {
  /** Lower-case element names to keep. Other elements are removed with their content. */
  readonly tags: ReadonlySet<string>;
  /**
   * Attribute names to keep per element name. The `"*"` entry applies to every
   * kept element. Without an entry, all attributes are removed.
   */
  readonly attributes?: Readonly<Record<string, readonly string[]>>;
  /**
   * Class tokens that may remain when `class` is an allowed attribute. Other
   * tokens are dropped, and the attribute is removed when none remain.
   */
  readonly classTokens?: ReadonlySet<string>;
}

/** Document-style content: headings, lists, tables, links and images. */
export const DOCUMENT_HTML_PROFILE: HtmlSanitizeProfile = {
  tags: new Set([
    "a",
    "b",
    "blockquote",
    "br",
    "caption",
    "code",
    "dd",
    "div",
    "dl",
    "dt",
    "em",
    "figcaption",
    "figure",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "i",
    "img",
    "li",
    "mark",
    "ol",
    "p",
    "pre",
    "s",
    "small",
    "span",
    "strong",
    "sub",
    "sup",
    "table",
    "tbody",
    "td",
    "tfoot",
    "th",
    "thead",
    "tr",
    "u",
    "ul",
  ]),
  attributes: {
    "*": ["id", "style"],
    a: ["href", "target", "title"],
    img: ["src", "alt", "title", "width", "height"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan", "scope"],
  },
};

function isSafeUrl(value: string, protocols: ReadonlySet<string>): boolean {
  try {
    // The URL parser applies the same scheme normalisation as browsers
    // (case, leading whitespace, embedded tabs and newlines).
    return protocols.has(new URL(value, URL_RESOLUTION_BASE).protocol);
  } catch {
    return false;
  }
}

// Ids can shadow `window`/`document` properties (DOM clobbering), so ids that
// collide with an existing property are dropped.
function isSafeId(value: string): boolean {
  return (
    ID_PATTERN.test(value) &&
    !(value in globalThis) &&
    !(value in globalThis.document)
  );
}

function isSafeStyleSize(value: string): boolean {
  return STYLE_KEYWORD_PATTERN.test(value) || STYLE_LENGTH_PATTERN.test(value);
}

function sanitizeStyle(value: string): string | null {
  const kept: string[] = [];
  for (const declaration of value.split(";")) {
    const separator = declaration.indexOf(":");
    if (separator === -1) {
      continue;
    }
    const property = declaration.slice(0, separator).trim().toLowerCase();
    const cssValue = declaration.slice(separator + 1).trim();
    if (STYLE_PROPERTIES.has(property) && isSafeStyleSize(cssValue)) {
      kept.push(`${property}: ${cssValue}`);
    }
  }
  return kept.length > 0 ? kept.join("; ") : null;
}

function sanitizeClass(
  value: string,
  allowedTokens: ReadonlySet<string> | undefined
): string | null {
  if (!allowedTokens) {
    return null;
  }
  const kept = value.split(/\s+/).filter((token) => allowedTokens.has(token));
  return kept.length > 0 ? kept.join(" ") : null;
}

function sanitizeAttributeValue(
  name: string,
  value: string,
  profile: HtmlSanitizeProfile
): string | null {
  switch (name) {
    case "href":
      return isSafeUrl(value, HREF_PROTOCOLS) ? value : null;
    case "src":
      return isSafeUrl(value, SRC_PROTOCOLS) ? value : null;
    case "id":
      return isSafeId(value) ? value : null;
    case "style":
      return sanitizeStyle(value);
    case "class":
      return sanitizeClass(value, profile.classTokens);
    case "target":
      return value === "_blank" ? value : null;
    case "width":
    case "height":
    case "colspan":
    case "rowspan":
      return DIMENSION_PATTERN.test(value) ? value : null;
    default:
      return value;
  }
}

function sanitizeAttributes(element: Element, profile: HtmlSanitizeProfile) {
  const allowed = new Set([
    ...(profile.attributes?.["*"] ?? []),
    ...(profile.attributes?.[element.localName] ?? []),
  ]);

  for (const attribute of Array.from(element.attributes)) {
    const nextValue = allowed.has(attribute.name)
      ? sanitizeAttributeValue(attribute.name, attribute.value, profile)
      : null;

    if (nextValue === null) {
      element.removeAttribute(attribute.name);
    } else if (nextValue !== attribute.value) {
      element.setAttribute(attribute.name, nextValue);
    }
  }

  // Links that open a new browsing context never keep the opener or referrer.
  if (element.localName === "a") {
    if (element.getAttribute("target") === "_blank") {
      element.setAttribute("rel", "noopener noreferrer");
    } else {
      element.removeAttribute("rel");
    }
  }
}

function isAllowedElement(
  element: Element,
  profile: HtmlSanitizeProfile
): boolean {
  return (
    element.namespaceURI === XHTML_NAMESPACE &&
    profile.tags.has(element.localName)
  );
}

function removeComments(parsed: Document) {
  const walker = parsed.createTreeWalker(parsed.body, NodeFilter.SHOW_COMMENT);
  const comments: Comment[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node instanceof Comment) {
      comments.push(node);
    }
  }
  for (const comment of comments) {
    comment.remove();
  }
}

export function sanitizeHtml(
  html: string,
  profile: HtmlSanitizeProfile = DOCUMENT_HTML_PROFILE
): string {
  if (typeof DOMParser === "undefined") {
    return "";
  }

  const parsed = new DOMParser().parseFromString(html, "text/html");
  removeComments(parsed);

  // A disallowed element is removed together with all of its descendants.
  for (const element of Array.from(parsed.body.querySelectorAll("*"))) {
    if (isAllowedElement(element, profile)) {
      sanitizeAttributes(element, profile);
    } else {
      element.remove();
    }
  }

  return parsed.body.innerHTML;
}
