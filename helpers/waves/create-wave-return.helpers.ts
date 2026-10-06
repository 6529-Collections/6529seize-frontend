/** Only the standalone form and a concrete parent-wave route can follow setup. */
export const getWaveCreationReturnPath = (search: string): string | null => {
  const returnTo = new URLSearchParams(search).get("returnTo");
  if (returnTo === "/waves/create") return returnTo;
  if (
    returnTo &&
    /^\/waves\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      returnTo
    )
  )
    return returnTo;
  return null;
};
