import {
  GitHubMuseumPublicationSource,
  LEGACY_CASEY_REQUIRED_PATHS,
  legacyCaseyPublicationAssembler,
} from "@/lib/museum/publication";
import { createCaseyFixture, EXACT_COMMIT, withObjectState } from "./fixture";

function sourceFor(
  fixture: ReturnType<typeof createCaseyFixture>,
  fetchImplementation: typeof fetch = fixture.fetch
) {
  return new GitHubMuseumPublicationSource({
    ref: "main",
    assembler: legacyCaseyPublicationAssembler,
    fetch: fetchImplementation,
    now: () => new Date("2026-08-02T12:00:00Z"),
  });
}

describe("GitHub Museum publication source", () => {
  it("resolves the moving ref before fetching immutable content", async () => {
    const fixture = createCaseyFixture();
    const result = await sourceFor(fixture).load();

    expect(result.status).toBe("current");
    expect(fixture.calls[0]).toBe(
      "https://api.github.com/repos/6529-Collections/6529networkmuseum/git/ref/heads/main"
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

  it("uses an exact source commit without a mutable-ref API lookup", async () => {
    const fixture = createCaseyFixture({ commit: EXACT_COMMIT });
    const source = new GitHubMuseumPublicationSource({
      ref: EXACT_COMMIT,
      assembler: legacyCaseyPublicationAssembler,
      fetch: fixture.fetch,
    });

    const result = await source.load();

    expect(result.status).toBe("current");
    expect(fixture.calls[0]).toContain(`/${EXACT_COMMIT}/`);
    expect(
      fixture.calls.some((url) => url.startsWith("https://api.github.com/"))
    ).toBe(false);
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

  it("rejects an excessive aggregate required-document size before fetching documents", async () => {
    const fixture = createCaseyFixture({
      manifestSizeOverrides: Object.fromEntries(
        LEGACY_CASEY_REQUIRED_PATHS.map((path) => [path, 400_000])
      ),
    });

    await expect(sourceFor(fixture).load()).resolves.toMatchObject({
      status: "unavailable",
      publication: null,
      errorCode: "publication_required_documents_too_large",
    });
    expect(fixture.calls).toHaveLength(2);
  });

  it("fetches governed documents with bounded concurrency", async () => {
    const fixture = createCaseyFixture();
    let activeDocumentRequests = 0;
    let maximumDocumentRequests = 0;
    const boundedFetch: typeof fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input.toString();
      const isDocument =
        !url.startsWith("https://api.github.com/") &&
        !url.endsWith("/release-artifacts/latest/record-manifest.json");
      if (!isDocument) {
        return fixture.fetch(input, init);
      }
      activeDocumentRequests += 1;
      maximumDocumentRequests = Math.max(
        maximumDocumentRequests,
        activeDocumentRequests
      );
      await new Promise((resolve) => setTimeout(resolve, 2));
      try {
        return await fixture.fetch(input, init);
      } finally {
        activeDocumentRequests -= 1;
      }
    };

    await expect(
      sourceFor(fixture, boundedFetch).load()
    ).resolves.toMatchObject({ status: "current" });
    expect(maximumDocumentRequests).toBeGreaterThan(1);
    expect(maximumDocumentRequests).toBeLessThanOrEqual(8);
  });

  it("rejects a response whose declared content length exceeds the boundary", async () => {
    const fixture = createCaseyFixture();
    const oversizedFetch: typeof fetch = async (input, init) => {
      const response = await fixture.fetch(input, init);
      return {
        ...response,
        headers: {
          get: (name: string) =>
            name.toLowerCase() === "content-length"
              ? "256001"
              : response.headers.get(name),
        },
      } as Response;
    };

    await expect(
      sourceFor(fixture, oversizedFetch).load()
    ).resolves.toMatchObject({
      status: "unavailable",
      errorCode: "publication_response_too_large",
    });
  });

  it.each([
    ["no content length", null],
    ["an underreported content length", "1"],
  ])(
    "cancels a streamed response that exceeds the byte boundary with %s",
    async (_label, contentLength) => {
      const fixture = createCaseyFixture();
      let cancelled = false;
      const oversizedFetch: typeof fetch = async (input, init) => {
        const url = typeof input === "string" ? input : input.toString();
        if (!url.startsWith("https://api.github.com/")) {
          return fixture.fetch(input, init);
        }
        const body = new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new Uint8Array(128_000));
            controller.enqueue(new Uint8Array(128_000));
            controller.enqueue(new Uint8Array(1));
          },
          cancel() {
            cancelled = true;
          },
        });
        return {
          ok: true,
          status: 200,
          url: "",
          headers: {
            get(name: string) {
              return name.toLowerCase() === "content-length"
                ? contentLength
                : null;
            },
          },
          body,
        } as unknown as Response;
      };

      await expect(
        sourceFor(fixture, oversizedFetch).load()
      ).resolves.toMatchObject({
        status: "unavailable",
        errorCode: "publication_response_too_large",
      });
      expect(cancelled).toBe(true);
    }
  );

  it("rejects a response URL that differs from the approved request URL", async () => {
    const fixture = createCaseyFixture();
    const redirectedFetch: typeof fetch = async (input, init) => {
      const response = await fixture.fetch(input, init);
      const requestUrl = typeof input === "string" ? input : input.toString();
      return { ...response, url: `${requestUrl}?redirected=1` } as Response;
    };

    await expect(
      sourceFor(fixture, redirectedFetch).load()
    ).resolves.toMatchObject({
      status: "unavailable",
      errorCode: "publication_unexpected_response_url",
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
