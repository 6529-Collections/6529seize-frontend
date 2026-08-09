import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  applyMuseumPublicEntityGraph,
  parseMuseumPublicEntityGraph,
} from "@/lib/museum/publication/publicEntityGraph";
import {
  GitHubMuseumPublicationSource,
  legacyCaseyPublicationAssembler,
} from "@/lib/museum/publication";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import {
  createMuseumLocalFixtureFetch,
  readMuseumLocalFixtureVisitorPaths,
  qualifyLocalReadOnlyDocument,
} from "@/lib/museum/publication/localFixture";
import { museumWorkHrefForSourceId } from "@/lib/museum/publication/routes";
import { buildMuseumPageSourceCatalog } from "@/lib/museum/publication/pageSources";
import { selectMuseumPublicWorkDocuments } from "@/lib/museum/publication/typedDocuments";
import type {
  MuseumPublication,
  MuseumSourceDocument,
} from "@/lib/museum/publication/types";

// Reviewed B is exercised only through the explicit read-only fixture.
// Production remains catalog-bound until canonical C is published.
const WP1_SOURCE_COMMIT = "311ae4281893f404472b8f7ba94454a57a2cd572";
const SOURCE_ROOT = process.env["MUSEUM_WP1_SOURCE_ROOT"];
const LOCAL_FIXTURE_SOURCE_COMMIT =
  process.env["MUSEUM_PUBLICATION_LOCAL_FIXTURE_COMMIT"] ??
  process.env["MUSEUM_WP1_SOURCE_COMMIT"] ??
  WP1_SOURCE_COMMIT;

interface SourceManifest {
  readonly manifest_sha256?: `sha256:${string}`;
  readonly manifest_commitment?: { readonly digest?: `0x${string}` };
  readonly entries: readonly {
    readonly path: string;
    readonly sha256?: `sha256:${string}`;
  }[];
}

interface SourceFixture {
  readonly declaredPaths: readonly string[];
  readonly documents: ReadonlyMap<string, MuseumSourceDocument>;
  readonly sourceCommit: string;
  readonly manifestSha256: string | undefined;
  readonly manifestCommitment: string | undefined;
  readonly inventoryEntries: number;
  readonly bundleEntryCount: number;
  readonly bundleContentBytes: number;
}

function readSourceFixture(): SourceFixture | null {
  if (SOURCE_ROOT === undefined || SOURCE_ROOT.trim().length === 0) return null;
  const manifestPath = join(
    SOURCE_ROOT,
    "release-artifacts",
    "latest",
    "record-manifest.json"
  );
  const manifest = JSON.parse(
    readFileSync(manifestPath, "utf8")
  ) as SourceManifest;
  const sourceCommit =
    process.env["MUSEUM_WP1_SOURCE_COMMIT"] ?? WP1_SOURCE_COMMIT;
  if (sourceCommit === WP1_SOURCE_COMMIT) {
    if (
      manifest.entries.length !== 776 ||
      manifest.manifest_sha256 !==
        "sha256:fb96e0391a7b7d11a7ea8226cc3f4f98044a92c49c51d6ac6ac337239d35cac3" ||
      manifest.manifest_commitment?.digest !==
        "0xdc719e5bbed0906ba69dd8ea30047fbe44bc86ea7e1f12116ff6b84eb3886e9e"
    ) {
      throw new Error("wp1_source_manifest_commitment_mismatch");
    }
  }
  const declaredPaths = manifest.entries.map((entry) => entry.path);
  const inventory = JSON.parse(
    readFileSync(
      join(SOURCE_ROOT, "schemas", "public-publication-inventory.json"),
      "utf8"
    )
  ) as { entries?: unknown[] };
  const bundle = JSON.parse(
    readFileSync(
      join(
        SOURCE_ROOT,
        "records",
        "publication",
        "visitor-corpus-bundle-v1.json"
      ),
      "utf8"
    )
  ) as { entry_count?: number; content_bytes?: number };
  const documents = new Map<string, MuseumSourceDocument>();
  for (const entry of manifest.entries) {
    if (
      !/^(?:records|docs|policies)\//u.test(entry.path) &&
      entry.path !== "schemas/public-entity-identity-inventory.json"
    ) {
      continue;
    }
    if (!/\.(?:json|md|txt)$/u.test(entry.path)) continue;
    const sourcePath = join(SOURCE_ROOT, ...entry.path.split("/"));
    const text = readFileSync(sourcePath, "utf8");
    documents.set(entry.path, {
      path: entry.path,
      sha256: entry.sha256 ?? null,
      mediaType: entry.path.endsWith(".json")
        ? "application/json"
        : entry.path.endsWith(".txt")
          ? "text/plain"
          : "text/markdown",
      text,
    });
  }
  return {
    declaredPaths,
    documents,
    sourceCommit,
    manifestSha256: manifest.manifest_sha256,
    manifestCommitment: manifest.manifest_commitment?.digest,
    inventoryEntries: inventory.entries?.length ?? 0,
    bundleEntryCount: bundle.entry_count ?? 0,
    bundleContentBytes: bundle.content_bytes ?? 0,
  };
}

function qualifyIncompleteInventoryFixture(fixture: SourceFixture): SourceFixture {
  return {
    ...fixture,
    documents: new Map(
      [...fixture.documents].map(([path, document]) => [
        path,
        qualifyLocalReadOnlyDocument(document, fixture.sourceCommit),
      ])
    ),
  };
}

function emptyPublication(fixture: SourceFixture): MuseumPublication {
  return {
    identity: {
      repository: "6529-Collections/6529networkmuseum",
      requestedRef: fixture.sourceCommit,
      commit: fixture.sourceCommit,
      manifestPath: "release-artifacts/latest/record-manifest.json",
      manifestSha256: null,
      manifestCommitment: null,
      inventoryCount: fixture.declaredPaths.length,
      assembledAt: "2026-08-08T00:00:00Z",
    },
    declaredSourcePaths: fixture.declaredPaths,
    artists: [],
    projects: [],
    gifts: [],
    artworks: [],
    documents: [],
    institutionalPractice: {} as MuseumPublication["institutionalPractice"],
    dataArchitecture: {} as MuseumPublication["dataArchitecture"],
    rightsHandbook: {} as MuseumPublication["rightsHandbook"],
  };
}

describe("WP-1 released PUBLIC_ENTITY/PUBLIC_RELATION source shape", () => {
  const fixture = readSourceFixture();

  it("fails closed for B's incomplete identity inventory and projects only the explicit read-only fixture", () => {
    if (fixture === null) {
      return;
    }
    const expectedManifestSha256 =
      process.env["MUSEUM_WP1_EXPECTED_MANIFEST_SHA256"];
    const expectedManifestCommitment =
      process.env["MUSEUM_WP1_EXPECTED_MANIFEST_COMMITMENT"];
    if (expectedManifestSha256 !== undefined) {
      expect(fixture.manifestSha256).toBe(expectedManifestSha256);
    }
    if (expectedManifestCommitment !== undefined) {
      expect(fixture.manifestCommitment).toBe(expectedManifestCommitment);
    }
    const expectedShape = [
      ["MUSEUM_WP1_EXPECTED_MANIFEST_ENTRIES", fixture.declaredPaths.length],
      [
        "MUSEUM_WP1_EXPECTED_ENTITY_COUNT",
        fixture.declaredPaths.filter((path) =>
          /^records\/entities\/[^/]+\.json$/u.test(path)
        ).length,
      ],
      [
        "MUSEUM_WP1_EXPECTED_RELATION_COUNT",
        fixture.declaredPaths.filter((path) =>
          /^records\/relations\/[^/]+\.json$/u.test(path)
        ).length,
      ],
      ["MUSEUM_WP1_EXPECTED_INVENTORY_ENTRIES", fixture.inventoryEntries],
      ["MUSEUM_WP1_EXPECTED_BUNDLE_ENTRIES", fixture.bundleEntryCount],
      ["MUSEUM_WP1_EXPECTED_BUNDLE_BYTES", fixture.bundleContentBytes],
    ] as const;
    for (const [variable, actual] of expectedShape) {
      const expected = process.env[variable];
      if (expected !== undefined) expect(String(actual)).toBe(expected);
    }
    expect(() =>
      parseMuseumPublicEntityGraph(
        fixture.documents,
        fixture.declaredPaths,
        fixture.sourceCommit
      )
    ).toThrow("public_entity_graph_inventory_entity_missing");
    const qualifiedFixture = qualifyIncompleteInventoryFixture(fixture);
    const graph = parseMuseumPublicEntityGraph(
      qualifiedFixture.documents,
      qualifiedFixture.declaredPaths,
      qualifiedFixture.sourceCommit
    );
    expect(graph).not.toBeNull();
    if (graph === null) return;

    const declaredGraphPaths = fixture.declaredPaths.filter((path) =>
      /^(?:records\/entities|records\/relations)\/[^/]+\.json$/u.test(path)
    );
    expect(graph.entityPaths.length + graph.relationPaths.length).toBe(
      declaredGraphPaths.length
    );
    expect(graph.entities.length + graph.relations.length).toBe(
      declaredGraphPaths.length
    );

    const publication = applyMuseumPublicEntityGraph(
      emptyPublication(fixture),
      graph,
      qualifiedFixture.documents
    );
    expect(publication.works).toHaveLength(28);
    expect(publication.artists).toHaveLength(21);
    expect(publication.projects).toHaveLength(6);
    expect(publication.curatedAcquisitions).toHaveLength(3);
    expect(publication.acquisitionPrograms).toHaveLength(2);
    expect(publication.researchPublications).toHaveLength(3);
    expect(
      publication.works?.filter(
        (work) => work.status === "accessioned_into_permanent_collection"
      )
    ).toHaveLength(7);
    expect(
      publication.curatedAcquisitions?.map((acquisition) => acquisition.status)
    ).toEqual([
      "accessioned_into_permanent_collection",
      "selected_through_acquisition_program_acquisition_pending",
      "selected_by_museum_wave_acquisition_review_in_progress",
    ]);
    expect(
      publication.curatedAcquisitions?.every(
        (acquisition) => acquisition.sourceDocumentIds.length > 0
      )
    ).toBe(true);
    expect(
      publication.acquisitionPrograms?.every(
        (program) => program.sourceDocumentIds.length > 0
      )
    ).toBe(true);
    expect(
      publication.works?.every((work) => work.documentIds.length > 0)
    ).toBe(true);
    expect(
      publication.artists.every((artist) => artist.documentIds.length > 0)
    ).toBe(true);
    expect(publication.exhibitions).toBeUndefined();

    const casey = publication.works?.find(
      (work) => work.id === "6529NM-W-0001"
    );
    expect(casey?.documentIds.some((id) => id.includes("typed-source:"))).toBe(
      true
    );
    const selectedMagnum = publication.curatedAcquisitions?.find(
      (acquisition) => acquisition.id === "6529NM-CA-2026-003"
    );
    expect(selectedMagnum?.status).toBe(
      "selected_by_museum_wave_acquisition_review_in_progress"
    );
    expect(selectedMagnum?.organizationIds).toContain("6529NM-ORG-0002");
    expect(
      publication.projects.find((project) => project.id === "6529NM-PRJ-0006")
        ?.organizationIds
    ).toContain("6529NM-ORG-0002");
    expect(publication.relations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          relation: "organization_publishes_project",
          from: expect.objectContaining({ id: "6529NM-ORG-0001" }),
        }),
        expect.objectContaining({
          relation: "organization_originates_project",
          from: expect.objectContaining({ id: "6529NM-ORG-0002" }),
          to: expect.objectContaining({ id: "6529NM-PRJ-0006" }),
        }),
      ])
    );
    expect(selectedMagnum?.presentationMedia ?? []).toHaveLength(0);
    const magnumWorks = publication.works?.filter((work) =>
      selectedMagnum?.workIds.includes(work.id)
    );
    expect(magnumWorks).toHaveLength(5);
    expect(
      magnumWorks?.every((work) => (work.presentationMedia ?? []).length === 0)
    ).toBe(true);
    expect(
      new Set(
        magnumWorks?.flatMap(
          (work) => work.mediaMetadata?.map((media) => media.id) ?? []
        )
      )
    ).toEqual(
      new Set([
        "6529NM-MED-0003",
        "6529NM-MED-0041",
        "6529NM-MED-0042",
        "6529NM-MED-0043",
        "6529NM-MED-0044",
      ])
    );
    expect(
      magnumWorks?.every((work) =>
        work.mediaMetadata?.every(
          (media) =>
            media.context?.kind === "wave_proposal" &&
            media.credit.licenseLabel === "All Rights Reserved" &&
            media.context.openHref?.includes(
              "drop=002bfa4f-8416-48bf-b35e-38f354e9a9f0"
            )
        )
      )
    ).toBe(true);
    const keysAndGatesWorks = publication.works?.filter((work) =>
      work.acquisitionIds.includes("6529NM-CA-2026-002")
    );
    expect(keysAndGatesWorks).toHaveLength(16);
    expect(
      keysAndGatesWorks?.every(
        (work) => (work.presentationMedia ?? []).length === 0
      )
    ).toBe(true);
    expect(
      new Set(
        keysAndGatesWorks?.flatMap(
          (work) => work.mediaMetadata?.map((media) => media.id) ?? []
        )
      )
    ).toEqual(
      new Set(
        Array.from(
          { length: 16 },
          (_, index) => `6529NM-MED-${String(index + 20).padStart(4, "0")}`
        )
      )
    );
    expect(
      publication.workAliases?.every((alias) =>
        museumWorkHrefForSourceId(
          publication,
          alias.sourceObjectId
        )?.startsWith("/museum/network/works/6529NM-W-")
      )
    ).toBe(true);
    expect(museumWorkHrefForSourceId(publication, "6529NM.2026.001.01")).toBe(
      "/museum/network/works/6529NM-W-0001"
    );
    expect(museumWorkHrefForSourceId(publication, "6529NM-AP-01-OUT-001")).toBe(
      "/museum/network/works/6529NM-W-0008"
    );
    expect(
      museumWorkHrefForSourceId(publication, "6529NM-PG-2026-001.OBJ-001")
    ).toBe("/museum/network/works/6529NM-W-0024");
    expect(
      publication.researchPublications?.every((research) =>
        research.publicationUri.includes(`/${fixture.sourceCommit}/`)
      )
    ).toBe(true);
  });

  it("assembles the qualified local browser fixture through the source adapter", async () => {
    if (SOURCE_ROOT === undefined) return;
    const source = new GitHubMuseumPublicationSource({
      ref: LOCAL_FIXTURE_SOURCE_COMMIT,
      assembler: legacyCaseyPublicationAssembler,
      fetch: createMuseumLocalFixtureFetch(
        SOURCE_ROOT,
        LOCAL_FIXTURE_SOURCE_COMMIT
      ),
      allowUncataloguedTestFixture: true,
      localFixtureAcceptedPaths:
        readMuseumLocalFixtureVisitorPaths(SOURCE_ROOT),
      localFixtureDocumentTransform: (document) =>
        qualifyLocalReadOnlyDocument(document, LOCAL_FIXTURE_SOURCE_COMMIT),
    });
    const result = await source.load();
    if (result.status !== "current") {
      throw new Error(`candidate_a_source:${result.errorCode ?? "unknown"}`);
    }
    const pageSources = buildMuseumPageSourceCatalog(result.publication);
    const homeSource = pageSources.find(
      (route) => route.pathname === "/museum/network"
    )?.source;
    const keysAndGatesProgram = result.publication.acquisitionPrograms?.find(
      (program) => program.slug === "keys-and-gates"
    );
    const typedProgramDocumentPaths =
      keysAndGatesProgram?.sourceDocumentIds.flatMap((documentId) => {
        const document = result.publication.documents.find(
          (candidate) => candidate.id === documentId
        );
        return document === undefined ? [] : [document.sourcePath];
      }) ?? [];
    expect(keysAndGatesProgram).toBeDefined();
    expect(typedProgramDocumentPaths).toContain(
      homeSource?.relatedSources[0]?.path
    );
    const workDocuments = (workId: string): readonly string[] => {
      const work = result.publication.works?.find(
        (candidate) => candidate.id === workId
      );
      if (work === undefined) return [];
      return selectMuseumPublicWorkDocuments(
        work,
        result.publication.documents
      ).map((document) => document.sourcePath);
    };
    expect(workDocuments("6529NM-W-0001")).toContain(
      "records/accessions/6529NM.2026.001/public/6529NM.2026.001.01.md"
    );
    expect(
      workDocuments("6529NM-W-0008").some(
        (path) =>
          path === "records/programs/6529NM-AP-01/public/works/take-the-key.md"
      )
    ).toBe(true);
    expect(workDocuments("6529NM-W-0027")).toContain(
      "records/proposed-gifts/6529NM-PG-2026-001/public/scholarship/works/04-moises-saman-44.md"
    );
    expect(
      result.publication.works
        ?.flatMap((work) =>
          selectMuseumPublicWorkDocuments(work, result.publication.documents)
        )
        .every(
          (document) =>
            !/(?:wave-storm|proposal\.json|voter-dossier|status-amendments)/u.test(
              document.sourcePath
            )
        )
    ).toBe(true);
  });

  it("activates the same local fixture through the runtime binding", async () => {
    if (SOURCE_ROOT === undefined) return;
    const result = await getMuseumPublicationState();
    if (result.status !== "current") {
      throw new Error(`local_fixture_runtime:${result.errorCode ?? "unknown"}`);
    }
  });
});
