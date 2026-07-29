import { buildStreamReferenceSourceCommits } from "@/lib/public-review/streamSolidityReferenceIdentity";

describe("buildStreamReferenceSourceCommits", () => {
  it("retains hidden draft snapshots in the current pinned source lineage", () => {
    const currentCommit = "c".repeat(40);

    expect(
      buildStreamReferenceSourceCommits({
        declaredVersions: [
          {
            version: "2026-07-27.1",
            source: { commit: "b".repeat(40) },
          },
        ],
        retainedVersions: [
          "2026-07-27.1",
          "2026-07-28.1",
          "2026-07-28.2",
        ],
        snapshot: {
          commit: currentCommit,
          version: "2026-07-28.2",
        },
      })
    ).toEqual({
      "2026-07-27.1": "b".repeat(40),
      "2026-07-28.1": currentCommit,
      "2026-07-28.2": currentCommit,
    });
  });
});
