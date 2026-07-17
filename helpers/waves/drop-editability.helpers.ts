/**
 * Whether a drop is still editable at a given moment, based on the
 * `editable_until` deadline the API mirrors from its own update guard.
 *
 * Semantics are deploy-order safe:
 * - `undefined` — the API predates the field; keep the legacy behavior of
 *   offering the edit affordance (the API remains the enforcer).
 * - `null` — the API says editing is not available for this drop at all.
 * - number — editable strictly before that time.
 */
export function isDropEditableAt({
  editableUntil,
  atMillis,
}: {
  readonly editableUntil: number | null | undefined;
  readonly atMillis: number;
}): boolean {
  if (editableUntil === undefined) {
    return true;
  }
  if (editableUntil === null) {
    return false;
  }
  return atMillis < editableUntil;
}
