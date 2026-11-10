import type { Breadcrumb, BreadcrumbHint } from "@sentry/nextjs";

/**
 * Click and input breadcrumbs describe the element as a selector path. The
 * SDK's path also carries `aria-label`, `title` and `alt` values, whose text
 * can name people, waves or files. When the element is at hand, the path is
 * rebuilt from tag, id and classes only; ids and classes come from the app's
 * code, never from what people type. Otherwise label values are removed, and
 * a path that may still hold attribute text is replaced as a whole.
 */

// The SDK walks the element and up to four ancestors.
const MAX_PATH_ELEMENTS = 5;
const MAX_PATH_LENGTH = 160;
const PATH_SEPARATOR = " > ";

const LABEL_ATTRIBUTES =
  "aria-label|aria-description|aria-valuetext|title|alt|placeholder|value";
// `[name="value"]` for a label-bearing attribute. A quote inside the value
// ends it only when the selector continues after `"]`. Not exact: anything
// left with a quote is replaced below.
const LABEL_ATTRIBUTE_PATTERN = new RegExp(
  String.raw`\[(${LABEL_ATTRIBUTES})="(?:[^"]|"(?!\](?:\[| > |$)))*"\]`,
  "g"
);
const LABEL_ASSIGNMENT_PATTERN = new RegExp(
  String.raw`(?:${LABEL_ATTRIBUTES})=`
);

const isUiCategory = (category: string | undefined): boolean =>
  category?.startsWith("ui.") === true;

/** `button[aria-label="Ann"]` becomes `button[aria-label]`. */
export function stripUiBreadcrumbLabels(message: string): string {
  return message.replaceAll(LABEL_ATTRIBUTE_PATTERN, "[$1]");
}

/**
 * The message of a `ui.*` breadcrumb without label text; others unchanged.
 * A path that still contains a quote or a label assignment after stripping
 * becomes the bare category, since part of a label could remain in it.
 */
export function withoutUiBreadcrumbLabels(
  message: string,
  category: string | undefined
): string {
  if (!isUiCategory(category)) {
    return message;
  }
  const stripped = stripUiBreadcrumbLabels(message);
  return stripped.includes('"') || LABEL_ASSIGNMENT_PATTERN.test(stripped)
    ? (category ?? "ui")
    : stripped;
}

function describeElement(element: Element): string {
  const id = element.id ? `#${element.id}` : "";
  const classes = Array.from(element.classList, (name) => `.${name}`).join("");
  return `${element.tagName.toLowerCase()}${id}${classes}`;
}

/** `div.row > button#send.tw-btn`: tag, id and classes, no attributes. */
export function elementStructurePath(element: Element): string {
  const parts: string[] = [];
  let length = 0;
  let current: Element | null = element;
  while (current && parts.length < MAX_PATH_ELEMENTS) {
    const part = describeElement(current);
    if (part === "html") {
      break;
    }
    const nextLength =
      length + part.length + (parts.length > 0 ? PATH_SEPARATOR.length : 0);
    if (parts.length > 0 && nextLength > MAX_PATH_LENGTH) {
      break;
    }
    parts.unshift(part.slice(0, MAX_PATH_LENGTH));
    length = nextLength;
    current = current.parentElement;
  }
  return parts.join(PATH_SEPARATOR);
}

// The SDK passes the DOM event, or the element itself, as `hint.event`.
function hintElement(hint: BreadcrumbHint | undefined): Element | undefined {
  const source: unknown = hint?.["event"];
  const target: unknown =
    typeof Event !== "undefined" && source instanceof Event
      ? source.target
      : source;
  return typeof Element !== "undefined" && target instanceof Element
    ? target
    : undefined;
}

/**
 * Rebuilds a `ui.*` breadcrumb message from the element it describes. Other
 * breadcrumbs, and ui breadcrumbs without an element, are returned as they
 * are (the sanitizer then removes label text from them).
 */
export function withUiElementPath(
  breadcrumb: Breadcrumb,
  hint: BreadcrumbHint | undefined
): Breadcrumb {
  if (!isUiCategory(breadcrumb.category)) {
    return breadcrumb;
  }
  try {
    const element = hintElement(hint);
    if (!element) {
      return breadcrumb;
    }
    const message = elementStructurePath(element);
    return message ? { ...breadcrumb, message } : breadcrumb;
  } catch {
    return breadcrumb;
  }
}
