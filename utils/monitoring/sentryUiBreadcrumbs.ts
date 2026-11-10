/**
 * Click and input breadcrumbs describe the element as a selector path built
 * by the SDK: tag, id and classes, then `aria-label`, `type`, `name`, `title`
 * and `alt`. Any `dom.serializeAttribute` attribute present on an element
 * would replace its id and classes, so none is configured. Label text can
 * name people, waves or files, so only the structure is kept.
 */

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
