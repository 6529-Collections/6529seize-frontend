/**
 * Click and input breadcrumbs describe the element as a selector path built
 * by the SDK. Besides tag, id, classes and `serializeAttribute` attributes,
 * the SDK always appends `aria-label`, `title` and `alt`, whose text can name
 * people, waves or files. Only the structure is kept for debugging.
 */

/**
 * Attributes recorded in `ui.*` breadcrumbs instead of id and classes when an
 * element has them. Stable test ids and roles only; never label text.
 */
export const SENTRY_UI_BREADCRUMB_ATTRIBUTES: readonly string[] = [
  "data-testid",
  "role",
];

// `[name="value"]` for a label-bearing attribute. A quote inside the value
// ends it only when the selector continues after `"]`: another attribute, the
// ` > ` separator or the end of the path.
const LABEL_ATTRIBUTE_PATTERN =
  /\[(aria-label|aria-description|aria-valuetext|title|alt|placeholder|value)="(?:[^"]|"(?!\](?:\[| > |$)))*"\]/g;

/** `button[aria-label="Ann"]` becomes `button[aria-label]`. */
export function stripUiBreadcrumbLabels(message: string): string {
  return message.replaceAll(LABEL_ATTRIBUTE_PATTERN, "[$1]");
}

/** The message of a `ui.*` breadcrumb without label text; others unchanged. */
export function withoutUiBreadcrumbLabels(
  message: string,
  category: string | undefined
): string {
  return category?.startsWith("ui.") === true
    ? stripUiBreadcrumbLabels(message)
    : message;
}
