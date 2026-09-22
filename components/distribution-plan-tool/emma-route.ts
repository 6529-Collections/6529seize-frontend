/** Backend-generated plan IDs are UUIDs; only EMMA plan routes may be destinations. */
export function getEmmaReturnPath(
  value: string | string[] | undefined
): string {
  const plansPath = "/emma/plans";
  if (typeof value !== "string" || !value.startsWith(`${plansPath}/`)) {
    return plansPath;
  }
  const planId = value.slice(plansPath.length + 1);
  return /^[a-zA-Z0-9_-]+$/.test(planId) ? value : plansPath;
}
