interface StreamReferenceVersion {
  readonly source: {
    readonly commit: string;
  };
  readonly version: string;
}

export function buildStreamReferenceSourceCommits({
  declaredVersions,
  retainedVersions,
  snapshot,
}: {
  readonly declaredVersions: readonly StreamReferenceVersion[];
  readonly retainedVersions: readonly string[];
  readonly snapshot: {
    readonly commit: string;
    readonly version: string;
  };
}): Record<string, string> {
  const sourceCommits = Object.fromEntries(
    declaredVersions.map(({ source, version }) => [version, source.commit])
  );

  // Draft snapshots are retained before they become public review versions.
  // They belong to the current pinned source lineage; index validation still
  // rejects a retained entry whose commit differs from this trusted value.
  retainedVersions.forEach((version) => {
    sourceCommits[version] ??= snapshot.commit;
  });
  sourceCommits[snapshot.version] = snapshot.commit;

  return sourceCommits;
}
