// Museum publication/study checks already allow this background shell fetch
// failure (PR #3602). Keep the optional host exact; this is not a global
// allowance, and HTTP errors still fail the separate response assertions.
export const MUSEUM_SETTINGS_FETCH_ERROR_PATTERN =
  /^Failed to fetch seize settings TypeError: Failed to fetch(?: \(api\.6529\.io\))?(?:\n|$)/u;
