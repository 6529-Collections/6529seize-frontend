// Only the URL-driven wave shell can own transitions across the two page routes.
// A token keeps overlapping mounts/cleanup from unregistering another owner.
const mountedShells = new Map<symbol, string>();

export function registerWaveTabShell(waveId: string): () => void {
  const token = Symbol();
  mountedShells.set(token, waveId);
  return () => {
    mountedShells.delete(token);
  };
}

function getTabRoute(url: URL) {
  const segments = url.pathname.split("/");
  const [, section, waveId, collection, selectedId] = segments;
  const isWave = segments.length === 3;
  const isCompetition =
    segments.length === 5 &&
    collection === "competitions" &&
    selectedId !== "new";
  if (section !== "waves" || !waveId || (!isWave && !isCompetition))
    return null;
  const competitionId = selectedId ?? url.searchParams.get("competition");
  // Mixed path/query selections need the router to resolve their ambiguity.
  if (!competitionId || (selectedId && url.searchParams.has("competition")))
    return null;
  return { waveId, competitionId };
}

export function canNavigateInWaveTabShell(current: URL, target: URL): boolean {
  if (current.origin !== target.origin || current.hash !== target.hash)
    return false;
  const from = getTabRoute(current);
  const to = getTabRoute(target);
  if (!from || !to) return false;
  if (from.waveId !== to.waveId || from.competitionId !== to.competitionId)
    return false;
  if (!Array.from(mountedShells.values()).includes(from.waveId)) return false;
  const fromParams = new URLSearchParams(current.search);
  const toParams = new URLSearchParams(target.search);
  for (const params of [fromParams, toParams]) {
    params.delete("tab");
    params.delete("competition");
    params.sort();
  }
  // Selecting a tab pins the already selected competition, ending implicit selection.
  if (fromParams.get("default") === "1" && !toParams.has("default"))
    fromParams.delete("default");
  return fromParams.toString() === toParams.toString();
}
