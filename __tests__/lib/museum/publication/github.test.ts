import {
  GitHubMuseumPublicationSource,
  legacyCaseyPublicationAssembler,
} from "@/lib/museum/publication";
import { createCaseyFixture, EXACT_COMMIT, withObjectState } from "./fixture";

function sourceFor(fixture: ReturnType<typeof createCaseyFixture>) {
  return new GitHubMuseumPublicationSource({
    ref: "main",
    assembler: legacyCaseyPublicationAssembler,
    fetch: fixture.fetch,
    now: () => new Date("2026-08-02T12:00:00Z"),
  });
}

describe("GitHub Museum publication source", () => {
  it("resolves the moving ref before fetching immutable content", async () => {
    const fixture = createCaseyFixture();
    const result = await sourceFor(fixture).load();

    expect(result.status).toBe("current");
    expect(fixture.calls[0]).toBe(
      "https://api.github.com/repos/6529-Collections/6529networkmuseum/commits/main"
    );
    expect(fixture.calls.slice(1)).not.toHaveLength(0);
    expect(
      fixture.calls.slice(1).every((url) => url.includes(`/${EXACT_COMMIT}/`))
    ).toBe(true);
    expect(fixture.calls.slice(1).some((url) => url.includes("/main/"))).toBe(
      false
    );
    if (result.status === "current") {
      expect(result.publication.identity.commit).toBe(EXACT_COMMIT);
      expect(result.publication.identity.requestedRef).toBe("main");
    }
  });

  it("rejects a required file omitted from the manifest inventory", async () => {
    const fixture = createCaseyFixture({
      omittedManifestPath:
        "records/accessions/6529NM.2026.001/objects/6529NM.2026.001.07.json",
    });
    const result = await sourceFor(fixture).load();

    expect(result).toMatchObject({
      status: "unavailable",
      publication: null,
      errorCode: "publication_required_path_undeclared",
    });
    expect(fixture.calls).toHaveLength(2);
  });

  it("rejects a declared document whose SHA-256 does not match", async () => {
    const path =
      "records/accessions/6529NM.2026.001/objects/6529NM.2026.001.01.json";
    const base = createCaseyFixture();
    const original = base.documents[path];
    if (original === undefined) {
      throw new Error("test_fixture_document_missing");
    }
    const fixture = createCaseyFixture({
      responseOverrides: {
        [path]: original.replace("CENTURY #31", "CENTURY #32"),
      },
    });
    const result = await sourceFor(fixture).load();

    expect(result).toMatchObject({
      status: "unavailable",
      publication: null,
      errorCode: "publication_document_hash_mismatch",
    });
  });

  it("activates no partial candidate and uses only caller-supplied last-valid data", async () => {
    const validFixture = createCaseyFixture();
    const current = await sourceFor(validFixture).load();
    expect(current.status).toBe("current");
    if (current.status !== "current") {
      throw new Error("test_current_publication_missing");
    }

    const path =
      "records/accessions/6529NM.2026.001/objects/6529NM.2026.001.07.json";
    const malformedFixture = createCaseyFixture({
      documentOverrides: { [path]: "{}" },
    });
    const unavailable = await sourceFor(malformedFixture).load();
    expect(unavailable).toMatchObject({
      status: "unavailable",
      publication: null,
    });

    const stale = await sourceFor(malformedFixture).load({
      publication: current.publication,
      acceptedAt: "2026-08-02T11:00:00Z",
    });
    expect(stale).toMatchObject({
      status: "stale",
      publication: current.publication,
      lastValidAcceptedAt: "2026-08-02T11:00:00Z",
    });
  });

  it("does not allow selected_unminted to enter the Casey accession", async () => {
    const base = createCaseyFixture();
    const path =
      "records/accessions/6529NM.2026.001/objects/6529NM.2026.001.01.json";
    const fixture = createCaseyFixture({
      documentOverrides: {
        [path]: withObjectState(
          base,
          "6529NM.2026.001.01",
          "selected_unminted"
        ),
      },
    });
    const result = await sourceFor(fixture).load();
    expect(result).toMatchObject({
      status: "unavailable",
      errorCode: "publication_casey_not_accessioned",
    });
  });
});
