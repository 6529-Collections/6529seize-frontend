import fs from "node:fs";
import {
  COMPATIBILITY_CONTRACT,
  verifyMuseumPublicationCompatibility,
} from "@/scripts/museum-publication-compatibility";
import {
  createCaseyFixture,
  EXACT_COMMIT,
} from "@/__tests__/lib/museum/publication/fixture";
import { GitHubMuseumPublicationSource } from "@/lib/museum/publication/github";

describe("museum publication compatibility", () => {
  it("keeps managed and foreign hold detection bound to the exact bot identity", () => {
    const workflow = fs.readFileSync(
      ".github/workflows/museum-publication-compatibility.yml",
      "utf8"
    );
    expect(workflow).toMatch(
      /\.author\.login == \\?"github-actions\[bot\]\\?"/u
    );
    expect(workflow).toMatch(
      /\.author\.login != \\?"github-actions\[bot\]\\?"/u
    );
    expect(workflow).not.toContain("github-actions[bot)");
  });

  it("accepts an exact source commit only when the strict adapter preserves identity", async () => {
    const fixture = createCaseyFixture();

    await expect(
      verifyMuseumPublicationCompatibility({
        sourceCommit: EXACT_COMMIT,
        fetch: fixture.fetch,
      })
    ).resolves.toEqual({
      contract: COMPATIBILITY_CONTRACT,
      source_commit: EXACT_COMMIT,
      accepted: true,
      adapter_status: "current",
      adapter_error_code: null,
      publication_commit: EXACT_COMMIT,
    });
  });

  it("fails closed before transport for a non-immutable source reference", async () => {
    const fixture = createCaseyFixture();

    await expect(
      verifyMuseumPublicationCompatibility({
        sourceCommit: "main",
        fetch: fixture.fetch,
      })
    ).resolves.toEqual({
      contract: COMPATIBILITY_CONTRACT,
      source_commit: "main",
      accepted: false,
      adapter_status: "invalid",
      adapter_error_code: "publication_invalid_commit",
      publication_commit: null,
    });
    expect(fixture.calls).toEqual([]);
  });

  it("rejects a current publication whose resolved identity differs", async () => {
    const resolvedCommit = "b".repeat(40);
    const load = jest
      .spyOn(GitHubMuseumPublicationSource.prototype, "load")
      .mockResolvedValueOnce({
        status: "current",
        publication: {
          identity: {
            commit: resolvedCommit,
            requestedRef: EXACT_COMMIT,
          },
        },
        errorCode: null,
        failedAt: null,
        lastValidAcceptedAt: null,
      } as never);
    try {
      await expect(
        verifyMuseumPublicationCompatibility({ sourceCommit: EXACT_COMMIT })
      ).resolves.toEqual({
        contract: COMPATIBILITY_CONTRACT,
        source_commit: EXACT_COMMIT,
        accepted: false,
        adapter_status: "current",
        adapter_error_code: "publication_source_identity_mismatch",
        publication_commit: resolvedCommit,
      });
    } finally {
      load.mockRestore();
    }
  });

  it("propagates a non-current adapter state with the fallback error code", async () => {
    const load = jest
      .spyOn(GitHubMuseumPublicationSource.prototype, "load")
      .mockResolvedValueOnce({
        status: "unavailable",
        publication: null,
        errorCode: null,
        failedAt: "2026-08-06T00:00:00.000Z",
        lastValidAcceptedAt: null,
      } as never);
    try {
      await expect(
        verifyMuseumPublicationCompatibility({ sourceCommit: EXACT_COMMIT })
      ).resolves.toEqual({
        contract: COMPATIBILITY_CONTRACT,
        source_commit: EXACT_COMMIT,
        accepted: false,
        adapter_status: "unavailable",
        adapter_error_code: "publication_source_unavailable",
        publication_commit: null,
      });
    } finally {
      load.mockRestore();
    }
  });
});
