import {
  GitHubMuseumPublicationSource,
  legacyCaseyPublicationAssembler,
  MUSEUM_RIGHTS_COLLECTOR_GUIDE_PATH,
  MUSEUM_RIGHTS_REGISTRY_PATH,
} from "@/lib/museum/publication";
import { createCaseyFixture, type CaseyFixtureOptions } from "./fixture";

async function loadFixture(options: CaseyFixtureOptions = {}) {
  const fixture = createCaseyFixture(options);
  return new GitHubMuseumPublicationSource({
    ref: "main",
    assembler: legacyCaseyPublicationAssembler,
    fetch: fixture.fetch,
    now: () => new Date("2026-08-05T18:00:00Z"),
  }).load();
}

function mutatedRegistry(
  mutate: (registry: Record<string, unknown>) => void
): string {
  const fixture = createCaseyFixture();
  const registry = JSON.parse(
    fixture.documents[MUSEUM_RIGHTS_REGISTRY_PATH] ?? "null"
  ) as Record<string, unknown>;
  mutate(registry);
  return JSON.stringify(registry);
}

describe("Museum rights handbook publication boundary", () => {
  it("activates the complete registry, guides, exact legal texts, and Casey assignments", async () => {
    const result = await loadFixture();
    expect(result.status).toBe("current");
    if (result.status !== "current") return;

    expect(result.publication.rightsHandbook.expressions).toHaveLength(22);
    expect(result.publication.rightsHandbook.objectAssignments).toHaveLength(7);
    expect(
      result.publication.rightsHandbook.objectAssignments.every(
        ({ expressionId }) => expressionId === "cc-by-nc-4.0"
      )
    ).toBe(true);
    expect(result.publication.rightsHandbook.introduction.markdown).toContain(
      "Buying the artwork usually does not buy its copyright"
    );
    expect(result.publication.rightsHandbook.collectorGuide.markdown).toContain(
      "The public domain is part of everyday collecting"
    );
    expect(
      result.publication.rightsHandbook.expressions.find(
        ({ id }) => id === "cc-by-nc-4.0"
      )?.legalCode?.text
    ).toContain("Exact official fixture text");
    expect(
      result.publication.rightsHandbook.expressions.find(
        ({ id }) => id === "cc-by-nc-4.0"
      )?.museumPracticeMatrix.display_the_work.note
    ).toContain("specific Museum-practice reading");
  });

  it("fails the publication closed when a required guide is absent", async () => {
    const result = await loadFixture({
      omittedManifestPath: MUSEUM_RIGHTS_COLLECTOR_GUIDE_PATH,
    });
    expect(result.status).toBe("unavailable");
  });

  it("rejects undeclared registry fields and action-order drift", async () => {
    const withExtraField = mutatedRegistry((registry) => {
      registry["unexpected"] = true;
    });
    expect(
      await loadFixture({
        documentOverrides: {
          [MUSEUM_RIGHTS_REGISTRY_PATH]: withExtraField,
        },
      })
    ).toEqual(expect.objectContaining({ status: "unavailable" }));

    const reorderedActions = mutatedRegistry((registry) => {
      registry["actions"] = [
        ...(registry["actions"] as readonly string[]).slice(1),
        (registry["actions"] as readonly string[])[0],
      ];
    });
    expect(
      await loadFixture({
        documentOverrides: {
          [MUSEUM_RIGHTS_REGISTRY_PATH]: reorderedActions,
        },
      })
    ).toEqual(expect.objectContaining({ status: "unavailable" }));
  });

  it("rejects an effective Keys and Gates license before mint evidence", async () => {
    const registryText = mutatedRegistry((registry) => {
      const note = (
        registry["program_notes"] as Array<Record<string, unknown>>
      )[0];
      if (note !== undefined) {
        note["effective_status"] = "effective";
      }
    });
    const result = await loadFixture({
      documentOverrides: { [MUSEUM_RIGHTS_REGISTRY_PATH]: registryText },
    });
    expect(result.status).toBe("unavailable");
  });

  it("fails closed when a Museum-practice reading is absent or invalid", async () => {
    const missingReading = mutatedRegistry((registry) => {
      const expression = (
        registry["expressions"] as Array<Record<string, unknown>>
      )[0];
      const matrix = expression?.["museum_practice_matrix"] as
        | Record<string, unknown>
        | undefined;
      if (matrix !== undefined) delete matrix["publish_online"];
    });
    expect(
      await loadFixture({
        documentOverrides: {
          [MUSEUM_RIGHTS_REGISTRY_PATH]: missingReading,
        },
      })
    ).toEqual(expect.objectContaining({ status: "unavailable" }));

    const invalidStatus = mutatedRegistry((registry) => {
      const expression = (
        registry["expressions"] as Array<Record<string, unknown>>
      )[0];
      const matrix = expression?.["museum_practice_matrix"] as
        | Record<string, Record<string, unknown>>
        | undefined;
      if (matrix !== undefined) {
        matrix["display_the_work"]!["status"] = "forbidden";
      }
    });
    expect(
      await loadFixture({
        documentOverrides: {
          [MUSEUM_RIGHTS_REGISTRY_PATH]: invalidStatus,
        },
      })
    ).toEqual(expect.objectContaining({ status: "unavailable" }));
  });

  it("rejects a legal-code commitment that does not match the fetched text", async () => {
    const registryText = mutatedRegistry((registry) => {
      const expression = (
        registry["expressions"] as Array<Record<string, unknown>>
      ).find(({ id }) => id === "cc-by-nc-4.0");
      const legalCode = expression?.["legal_code"] as
        | Record<string, unknown>
        | undefined;
      if (legalCode !== undefined) {
        legalCode["sha256"] = `sha256:${"0".repeat(64)}`;
      }
    });
    const result = await loadFixture({
      documentOverrides: { [MUSEUM_RIGHTS_REGISTRY_PATH]: registryText },
    });
    expect(result.status).toBe("unavailable");
  });

  it("rejects executable or non-HTTPS external rights references", async () => {
    const executableCanonicalUri = mutatedRegistry((registry) => {
      const expression = (
        registry["expressions"] as Array<Record<string, unknown>>
      )[0];
      if (expression !== undefined) {
        expression["canonical_uri"] = "javascript:alert(1)";
      }
    });
    expect(
      await loadFixture({
        documentOverrides: {
          [MUSEUM_RIGHTS_REGISTRY_PATH]: executableCanonicalUri,
        },
      })
    ).toEqual(expect.objectContaining({ status: "unavailable" }));

    const nonHttpsLegalSource = mutatedRegistry((registry) => {
      const expression = (
        registry["expressions"] as Array<Record<string, unknown>>
      ).find(({ id }) => id === "cc-by-nc-4.0");
      const legalCode = expression?.["legal_code"] as
        | Record<string, unknown>
        | undefined;
      if (legalCode !== undefined) {
        legalCode["source_uri"] = "data:text/plain,untrusted";
      }
    });
    expect(
      await loadFixture({
        documentOverrides: {
          [MUSEUM_RIGHTS_REGISTRY_PATH]: nonHttpsLegalSource,
        },
      })
    ).toEqual(expect.objectContaining({ status: "unavailable" }));
  });
});
