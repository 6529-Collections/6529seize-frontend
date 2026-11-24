/** Focus targets the native keyboard state machine treats as text entry. */

export function isEditableElement(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  return (
    element.isContentEditable ||
    element.matches(
      'input:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), select:not([disabled]), [contenteditable="true"], [contenteditable="plaintext-only"]'
    )
  );
}

export function isKeyboardTextEntryElement(element: Element | null): boolean {
  if (!isEditableElement(element)) return false;
  if (element instanceof HTMLInputElement) {
    return [
      "text",
      "search",
      "email",
      "url",
      "tel",
      "password",
      "number",
    ].includes(element.type);
  }
  return (
    element instanceof HTMLTextAreaElement ||
    (element instanceof HTMLElement &&
      (element.isContentEditable ||
        element.matches(
          '[contenteditable="true"], [contenteditable="plaintext-only"]'
        )))
  );
}
