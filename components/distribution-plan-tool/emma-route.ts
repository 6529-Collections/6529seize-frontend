const emmaStepSlugs = [
  "create-plan",
  "create-snapshots",
  "create-custom-snapshot",
  "create-phases",
  "build-phases",
  "map-delegations",
  "review",
] as const;

export function getEmmaStepSlug(value: string | null | undefined) {
  return emmaStepSlugs.find((step) => step === value);
}

/** Backend-generated plan IDs are UUIDs; only EMMA plan routes may be destinations. */
export function getEmmaReturnPath(
  value: string | string[] | undefined
): string {
  const plansPath = "/emma/plans";
  if (typeof value !== "string" || !value.startsWith(`${plansPath}/`)) {
    return plansPath;
  }
  const [path = "", search, extra] = value.split("?");
  const planId = path.slice(plansPath.length + 1);
  if (!/^[a-zA-Z0-9_-]+$/.test(planId) || extra !== undefined) return plansPath;
  if (search === undefined) return path;
  const [key, candidate, remainder] = search.split("=");
  const step = getEmmaStepSlug(candidate);
  return key === "step" && step && remainder === undefined
    ? `${path}?step=${step}`
    : plansPath;
}
