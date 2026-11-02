import { CHECK_FILTER_OPTIONS, readCheckFilters } from "./checks.helpers";

export function readCheckFilterForm(
  params: URLSearchParams
): Record<string, string> {
  const filters = readCheckFilters(params);
  const values: Record<string, string> = {};
  for (const name of [
    ...Object.keys(CHECK_FILTER_OPTIONS),
    "profile_id",
    "subject_id",
  ]) {
    values[name] = String(filters[name as keyof typeof filters] ?? "");
  }
  for (const name of ["from", "to"] as const) {
    values[name] = filters[name] === undefined ? "" : (params.get(name) ?? "");
  }
  return values;
}

export function checkFilterFormParams(
  values: Record<string, string>,
  caseId?: string
): URLSearchParams {
  const next = new URLSearchParams();
  for (const [name, value] of Object.entries(values)) {
    if (value) next.set(name, value);
  }
  if (caseId) next.set("case_id", caseId);
  return next;
}

export function clearFilterDateError(form: HTMLFormElement | null): void {
  const input = form?.elements.namedItem("to");
  if (input instanceof HTMLInputElement) input.setCustomValidity("");
}
