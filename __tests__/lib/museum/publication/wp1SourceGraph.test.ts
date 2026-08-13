import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  applyMuseumPublicEntityGraph,
  parseMuseumPublicEntityGraph,
} from "@/lib/museum/publication/publicEntityGraph";
import {
  GitHubMuseumPublicationSource,
  legacyCaseyPublicationAssembler,
  museumPublicationCatalogResolver,
} from "@/lib/museum/publication";
import { getMuseumPublicationState } from "@/lib/museum/publication/runtime";
import {
  createMuseumLocalFixtureFetch,
  readMuseumLocalFixtureMediaAssetPaths,
  readMuseumLocalFixtureVisitorPaths,
} from "@/lib/museum/publication/localFixture";
import { museumWorkHrefForSourceId } from "@/lib/museum/publication/routes";
import { buildMuseumPageSourceCatalog } from "@/lib/museum/publication/pageSources";
import { selectMuseumPublicWorkDocuments } from "@/lib/museum/publication/typedDocuments";
import type {
  MuseumPublication,
  MuseumSourceDocument,
} from "@/lib/museum/publication/types";

// The reviewed source B is exercised through an explicit local qualification
// fixture. Production resolves the canonical C pointer/catalog and consumes
// only this immutable reviewed B corpus.
const SOURCE_COMMIT = [
  "9aea66c0",
  "7d59f890",
  "e366dde6",
  "552a3045",
  "80ba789a",
].join("");
const CATALOG_COMMIT = "975f041aed7e2f402ab26d4fb2bb266e07db4974";
const CATALOG_ID = `6529NM-PUBCAT-${SOURCE_COMMIT}`;
const CATALOG_PATH = `release-artifacts/catalog/${CATALOG_ID}.json` as const;
const POINTER_PATH =
  "release-artifacts/latest/publication-catalog-pointer.json" as const;
const POINTER_SHA256 =
  "sha256:935aa76ed1159e7ef22ec9a75d8afea112c5f41f2038cd43db6086739fb85b8e";
const CATALOG_SHA256 =
  "sha256:bd488ac43ee423b1390a50bf02addb71716daddf45f7897d7afa86787e9df49f";
const CATALOG_ENVELOPE =
  "0xf782673a74d437ab6fb5a0017e54024f62c84a2d311f5bb5fddad81e407a26a2";
const INVENTORY_SELF_SHA256 =
  "sha256:8700dffecad31591901dfb9d93df07542603701899ef5efb46bda048f301a925";
const INVENTORY_SELF_KECCAK =
  "0x919fe993d2db227927937b2888512e6d7098cf0ad68d61bcd66d50a71b9ce271";
const COMPLETE_INVENTORY_SHA256 =
  "sha256:facd7ba6d8d83dc34e77e6f246e792cd834d08b56962f3ff07cc49a8f33cb999";
const COMPLETE_INVENTORY_KECCAK =
  "0x1a9e98306367a283e958e70a007fd49cda5e12447b553e0c651905a8b8aad5a2";
const SOURCE_ROOT = process.env["MUSEUM_WP1_SOURCE_ROOT"];
const LOCAL_FIXTURE_SOURCE_COMMIT =
  process.env["MUSEUM_PUBLICATION_LOCAL_FIXTURE_COMMIT"] ??
  process.env["MUSEUM_WP1_SOURCE_COMMIT"] ??
  SOURCE_COMMIT;

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

function sha256(bytes: Uint8Array): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function createCanonicalCatalogFetch(
  sourceRoot: string,
  calls: string[]
): typeof fetch {
  const allowedPathsByCommit = new Map<string, ReadonlySet<string>>([
    [CATALOG_COMMIT, new Set([POINTER_PATH, CATALOG_PATH])],
    [
      SOURCE_COMMIT,
      new Set([
        "release-artifacts/latest/record-manifest.json",
        "schemas/public-publication-inventory.json",
        "records/publication/visitor-corpus-bundle-v1.json",
      ]),
    ],
  ]);
  return async (input) => {
    const requestUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    calls.push(requestUrl);
    const url = new URL(requestUrl);
    const segments = url.pathname.split("/").filter(Boolean);
    const commit = segments[2];
    const sourcePath = segments.slice(3).map(decodeURIComponent).join("/");
    if (
      url.protocol !== "https:" ||
      url.hostname !== "raw.githubusercontent.com" ||
      segments[0] !== "6529-Collections" ||
      segments[1] !== "6529networkmuseum" ||
      commit === undefined ||
      !allowedPathsByCommit.get(commit)?.has(sourcePath) ||
      url.username.length > 0 ||
      url.password.length > 0 ||
      url.port.length > 0 ||
      url.search.length > 0 ||
      url.hash.length > 0
    ) {
      throw new Error(`unexpected_catalog_transport:${requestUrl}`);
    }
    const bytes = new Uint8Array(
      readFileSync(join(sourceRoot, ...sourcePath.split("/")))
    );
    return {
      ok: true,
      status: 200,
      url: "",
      headers: {
        get(name: string) {
          return name.toLowerCase() === "content-length"
            ? String(bytes.byteLength)
            : null;
        },
      },
      arrayBuffer: () => Promise.resolve(bytes.slice().buffer),
    } as unknown as Response;
  };
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
  const sourceCommit = process.env["MUSEUM_WP1_SOURCE_COMMIT"] ?? SOURCE_COMMIT;
  if (sourceCommit === SOURCE_COMMIT) {
    if (
      manifest.entries.length !== 888 ||
      manifest.manifest_sha256 !==
        "sha256:546e183b31de7ec725db9700989b0026dce3bcbc2dd7f4fdc771161d4bb038c8" ||
      manifest.manifest_commitment?.digest !==
        "0x8d02eb26ed0c9420eb1b7b735aaa33235f3bf1b3be0dd3935065e926f32a271e"
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
        SOURCE_ROOT!,
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
      entry.path !== "schemas/public-entity-identity-inventory.json" &&
      entry.path !== "schemas/public-relation-identity-inventory.json" &&
      entry.path !== "schemas/public-relation-identity-inventory.schema.json"
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

function mutateIdentityInventory(
  fixture: SourceFixture,
  mutate: (inventory: Record<string, unknown>) => void
): SourceFixture {
  const inventory = fixture.documents.get(
    "schemas/public-entity-identity-inventory.json"
  );
  if (inventory === undefined) {
    throw new Error("wp1_identity_inventory_missing");
  }
  const value = JSON.parse(inventory.text) as Record<string, unknown>;
  mutate(value);
  return {
    ...fixture,
    documents: new Map(fixture.documents).set(inventory.path, {
      ...inventory,
      text: JSON.stringify(value),
    }),
  };
}

function mutateRelationIdentityInventory(
  fixture: SourceFixture,
  mutate: (inventory: Record<string, unknown>) => void
): SourceFixture {
  const inventory = fixture.documents.get(
    "schemas/public-relation-identity-inventory.json"
  );
  if (inventory === undefined) {
    throw new Error("wp1_relation_identity_inventory_missing");
  }
  const value = JSON.parse(inventory.text) as Record<string, unknown>;
  mutate(value);
  return {
    ...fixture,
    documents: new Map(fixture.documents).set(inventory.path, {
      ...inventory,
      text: JSON.stringify(value),
    }),
  };
}

function mutateSourceJson(
  fixture: SourceFixture,
  path: string,
  mutate: (value: Record<string, unknown>) => void
): SourceFixture {
  const document = fixture.documents.get(path);
  if (document === undefined) {
    throw new Error(`wp1_source_document_missing:${path}`);
  }
  const value = JSON.parse(document.text) as Record<string, unknown>;
  mutate(value);
  return {
    ...fixture,
    documents: new Map(fixture.documents).set(path, {
      ...document,
      text: JSON.stringify(value),
    }),
  };
}

const wp1Suite =
  SOURCE_ROOT === undefined || SOURCE_ROOT.trim().length === 0
    ? describe.skip
    : describe;

wp1Suite("WP-1 released PUBLIC_ENTITY/PUBLIC_RELATION source shape", () => {
  const fixture = readSourceFixture();

  it("accepts the complete entity and relation identity inventories", () => {
    if (fixture === null) throw new Error("wp1_source_fixture_required");
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
    const graph = parseMuseumPublicEntityGraph(
      fixture.documents,
      fixture.declaredPaths,
      fixture.sourceCommit
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
    expect(graph.relationIdentityInventory).toMatchObject({
      inventoryVersion: "1.5.0",
      sourcePath: "schemas/public-relation-identity-inventory.json",
      schemaPath: "schemas/public-relation-identity-inventory.schema.json",
    });
    expect(graph.relationIdentityInventory.activeRelationIds).toHaveLength(
      graph.relations.length
    );
    expect(graph.relationIdentityInventory.retiredRelationIds).toEqual([
      "6529NM-REL-0159",
      "6529NM-REL-0160",
      "6529NM-REL-0161",
      "6529NM-REL-0162",
      "6529NM-REL-0163",
      "6529NM-REL-0164",
    ]);

    const publication = applyMuseumPublicEntityGraph(
      emptyPublication(fixture),
      graph,
      fixture.documents,
      readMuseumLocalFixtureMediaAssetPaths(
        SOURCE_ROOT!,
        LOCAL_FIXTURE_SOURCE_COMMIT
      )
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
    ).toHaveLength(12);
    expect(
      publication.curatedAcquisitions?.map((acquisition) => acquisition.status)
    ).toEqual([
      "accessioned_into_permanent_collection",
      "selected_through_acquisition_program_acquisition_pending",
      "accessioned_into_permanent_collection",
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
      publication.acquisitionPrograms?.find(
        (program) => program.id === "6529NM-AP-ENT-0002"
      )
    ).toMatchObject({
      status: "selection_complete",
      statusAsOf: "2026-08-01T15:03:35Z",
    });
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
    const accessionedMagnum = publication.curatedAcquisitions?.find(
      (acquisition) => acquisition.id === "6529NM-CA-2026-003"
    );
    expect(accessionedMagnum?.status).toBe(
      "accessioned_into_permanent_collection"
    );
    expect(accessionedMagnum?.organizationIds).toContain("6529NM-ORG-0002");
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
    expect(accessionedMagnum?.presentationMedia ?? []).toHaveLength(5);
    const magnumWorks = publication.works?.filter((work) =>
      accessionedMagnum?.workIds.includes(work.id)
    );
    expect(magnumWorks).toHaveLength(5);
    expect(
      magnumWorks?.every((work) => (work.presentationMedia ?? []).length === 1)
    ).toBe(true);
    expect(
      new Set(
        magnumWorks?.flatMap(
          (work) => work.presentationMedia?.map((media) => media.id) ?? []
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
        work.presentationMedia?.every(
          (media) =>
            media.rights.licenseLabel === "All Rights Reserved" &&
            media.source.dropId === "002bfa4f-8416-48bf-b35e-38f354e9a9f0"
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
    ).toEqual(new Set());
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

  it.each([
    [
      "an identity category",
      (inventory: Record<string, unknown>) => {
        const bindings = inventory["identity_bindings"] as Record<
          string,
          unknown
        >;
        delete bindings["WORK_LIFECYCLE_OBSERVATION"];
      },
      "public_entity_graph_inventory_bindings",
    ],
    [
      "a required entity binding",
      (inventory: Record<string, unknown>) => {
        const bindings = inventory["identity_bindings"] as Record<
          string,
          unknown[]
        >;
        bindings["RESEARCH_PUBLICATION"] = (
          bindings["RESEARCH_PUBLICATION"] ?? []
        ).filter(
          (binding) =>
            (binding as { entity_id?: unknown }).entity_id !== "6529NM-RP-0001"
        );
      },
      "public_entity_graph_inventory_bindings",
    ],
    [
      "a required public slug",
      (inventory: Record<string, unknown>) => {
        inventory["public_slug_inventory"] = (
          inventory["public_slug_inventory"] as unknown[]
        ).filter(
          (entry) =>
            (entry as { entity_id?: unknown }).entity_id !== "6529NM-RP-0001"
        );
      },
      "public_entity_graph_inventory_slugs",
    ],
    [
      "an unknown inventory version",
      (inventory: Record<string, unknown>) => {
        inventory["inventory_version"] = "1.6.1";
      },
      "public_entity_graph_inventory_version",
    ],
    [
      "a prior inventory version",
      (inventory: Record<string, unknown>) => {
        inventory["inventory_version"] = "1.5.0";
      },
      "public_entity_graph_inventory_version",
    ],
    [
      "a governed typed-reference binding",
      (inventory: Record<string, unknown>) => {
        inventory["typed_reference_registry"] = (
          inventory["typed_reference_registry"] as unknown[]
        ).slice(1);
      },
      "public_entity_graph_typed_reference_registry",
    ],
  ] as const)(
    "rejects the reviewed source when it omits %s",
    (_label, mutate, errorCode) => {
      if (fixture === null) throw new Error("wp1_source_fixture_required");
      const mutated = mutateIdentityInventory(fixture, mutate);
      expect(() =>
        parseMuseumPublicEntityGraph(
          mutated.documents,
          mutated.declaredPaths,
          mutated.sourceCommit
        )
      ).toThrow(errorCode);
    }
  );

  it("rejects a Work whose governed manifestation identity drifts from the 1.5 registry", () => {
    if (fixture === null) throw new Error("wp1_source_fixture_required");
    const mutated = mutateSourceJson(
      fixture,
      "records/entities/6529NM-W-0024.json",
      (root) => {
        const payload = root["payload"] as Record<string, unknown>;
        const profile = payload["profile"] as Record<string, unknown>;
        const references = profile["manifestation_references"] as Record<
          string,
          unknown
        >[];
        const first = references[0];
        if (first !== undefined) {
          first["caip19"] =
            "eip155:1/erc721:0xe628b59d34f42b16c53f4d697f1ffd4d8d987b91/999";
        }
      }
    );
    expect(() =>
      parseMuseumPublicEntityGraph(
        mutated.documents,
        mutated.declaredPaths,
        mutated.sourceCommit
      )
    ).toThrow("public_entity_graph_typed_reference_registry");
  });

  it.each([
    [
      "an active relation binding",
      (inventory: Record<string, unknown>) => {
        inventory["relation_bindings"] = (
          inventory["relation_bindings"] as unknown[]
        ).slice(1);
      },
      "public_entity_graph_relation_inventory_bindings",
    ],
    [
      "the semantic key for an active relation",
      (inventory: Record<string, unknown>) => {
        const bindings = inventory["relation_bindings"] as Record<
          string,
          unknown
        >[];
        const artBlocksPublication = bindings.find(
          (binding) =>
            binding["source_key"] ===
            "ORGANIZATION_PUBLISHES_PROJECT|6529NM-ORG-0001|6529NM-PRJ-0001"
        );
        if (artBlocksPublication !== undefined) {
          artBlocksPublication["source_key"] =
            "ORGANIZATION_ORIGINATES_PROJECT|6529NM-ORG-0001|6529NM-PRJ-0001";
        }
      },
      "public_entity_graph_relation_inventory_binding_mismatch",
    ],
    [
      "a retired relation tombstone",
      (inventory: Record<string, unknown>) => {
        inventory["retired_relation_ids"] = (
          inventory["retired_relation_ids"] as unknown[]
        ).slice(1);
      },
      "public_entity_graph_relation_inventory_retired",
    ],
    [
      "the closed relation inventory version",
      (inventory: Record<string, unknown>) => {
        inventory["inventory_version"] = "1.5.1";
      },
      "public_entity_graph_relation_inventory_version",
    ],
  ] as const)(
    "rejects the reviewed source when relation identity inventory omits or changes %s",
    (_label, mutate, errorCode) => {
      if (fixture === null) throw new Error("wp1_source_fixture_required");
      const mutated = mutateRelationIdentityInventory(fixture, mutate);
      expect(() =>
        parseMuseumPublicEntityGraph(
          mutated.documents,
          mutated.declaredPaths,
          mutated.sourceCommit
        )
      ).toThrow(errorCode);
    }
  );

  it.each([
    "schemas/public-relation-identity-inventory.json",
    "schemas/public-relation-identity-inventory.schema.json",
  ])(
    "rejects the reviewed source when %s is absent from the closed graph",
    (path) => {
      if (fixture === null) throw new Error("wp1_source_fixture_required");
      const documents = new Map(fixture.documents);
      documents.delete(path);
      expect(() =>
        parseMuseumPublicEntityGraph(
          documents,
          fixture.declaredPaths.filter((candidate) => candidate !== path),
          fixture.sourceCommit
        )
      ).toThrow("public_entity_graph_inventory_incomplete");
    }
  );

  it("assembles the exact reviewed source fixture through the source adapter", async () => {
    if (SOURCE_ROOT === undefined || SOURCE_ROOT.trim().length === 0) {
      throw new Error("wp1_source_root_required");
    }
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
      localFixtureMediaAssetPaths: readMuseumLocalFixtureMediaAssetPaths(
        SOURCE_ROOT,
        LOCAL_FIXTURE_SOURCE_COMMIT
      ),
    });
    const result = await source.load();
    if (result.status !== "current") {
      throw new Error(`reviewed_source:${result.errorCode ?? "unknown"}`);
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

  it("activates canonical C through five exact C/B requests and no individual or media fetches", async () => {
    if (SOURCE_ROOT === undefined || SOURCE_ROOT.trim().length === 0) {
      throw new Error("wp1_source_root_required");
    }
    const pointerBytes = new Uint8Array(
      readFileSync(join(SOURCE_ROOT, ...POINTER_PATH.split("/")))
    );
    const catalogBytes = new Uint8Array(
      readFileSync(join(SOURCE_ROOT, ...CATALOG_PATH.split("/")))
    );
    expect(sha256(pointerBytes)).toBe(POINTER_SHA256);
    expect(sha256(catalogBytes)).toBe(CATALOG_SHA256);
    const inventory = JSON.parse(
      readFileSync(
        join(SOURCE_ROOT, "schemas", "public-publication-inventory.json"),
        "utf8"
      )
    ) as { readonly integrity: Record<string, unknown> };
    const catalogWire = JSON.parse(new TextDecoder().decode(catalogBytes)) as {
      readonly payload: {
        readonly publication_inventory_binding: Record<string, unknown>;
        readonly bundle_binding: Record<string, unknown>;
      };
    };
    expect(inventory.integrity).toMatchObject({
      body_sha256: INVENTORY_SELF_SHA256,
      body_keccak256: INVENTORY_SELF_KECCAK,
    });
    expect(catalogWire.payload.publication_inventory_binding).toMatchObject({
      body_sha256: COMPLETE_INVENTORY_SHA256,
      body_keccak256: COMPLETE_INVENTORY_KECCAK,
    });
    expect(catalogWire.payload.bundle_binding).toMatchObject({
      source_inventory_body_sha256: COMPLETE_INVENTORY_SHA256,
      source_inventory_body_keccak256: COMPLETE_INVENTORY_KECCAK,
    });
    expect(INVENTORY_SELF_SHA256).not.toBe(COMPLETE_INVENTORY_SHA256);
    expect(INVENTORY_SELF_KECCAK).not.toBe(COMPLETE_INVENTORY_KECCAK);

    const calls: string[] = [];
    const source = new GitHubMuseumPublicationSource({
      ref: CATALOG_COMMIT,
      assembler: legacyCaseyPublicationAssembler,
      catalogResolver: museumPublicationCatalogResolver,
      fetch: createCanonicalCatalogFetch(SOURCE_ROOT, calls),
      now: () => new Date("2026-08-09T20:05:00.000Z"),
    });
    const result = await source.load();

    if (result.status !== "current") {
      throw new Error(
        `canonical_catalog_source:${result.errorCode ?? "unknown"}`
      );
    }
    expect(result.publication.identity).toMatchObject({
      commit: SOURCE_COMMIT,
      requestedRef: CATALOG_COMMIT,
      catalogId: CATALOG_ID,
      catalogContentHash: CATALOG_ENVELOPE,
    });
    expect(calls).toHaveLength(5);
    expect(calls).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`/${CATALOG_COMMIT}/${POINTER_PATH}`),
        expect.stringContaining(`/${CATALOG_COMMIT}/${CATALOG_PATH}`),
        expect.stringContaining(
          `/${SOURCE_COMMIT}/release-artifacts/latest/record-manifest.json`
        ),
        expect.stringContaining(
          `/${SOURCE_COMMIT}/schemas/public-publication-inventory.json`
        ),
        expect.stringContaining(
          `/${SOURCE_COMMIT}/records/publication/visitor-corpus-bundle-v1.json`
        ),
      ])
    );
    expect(
      calls.every(
        (url) =>
          !url.includes("/main/") &&
          !url.includes("/HEAD/") &&
          !url.includes("github.com/6529-Collections") &&
          !url.includes("media/")
      )
    ).toBe(true);
  });

  it("activates the same local fixture through the runtime binding", async () => {
    if (SOURCE_ROOT === undefined || SOURCE_ROOT.trim().length === 0) {
      throw new Error("wp1_source_root_required");
    }
    const result = await getMuseumPublicationState();
    if (result.status !== "current") {
      throw new Error(`local_fixture_runtime:${result.errorCode ?? "unknown"}`);
    }
  });
});
