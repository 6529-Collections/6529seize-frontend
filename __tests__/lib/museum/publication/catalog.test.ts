import { createHash } from "node:crypto";
import { keccak256, toBytes } from "viem";
import {
  assertMuseumPublicationCatalog,
  assertMuseumPublicationCatalogAssemblyBundle,
  assertMuseumPublicationInventoryManifestBinding,
  assertMuseumPublicationInventoryDocument,
  assertSortedUniquePaths,
  canonicalMuseumJson,
  decodePublicationAssemblyBundle,
  MUSEUM_PUBLICATION_INVENTORY_PATH,
  MUSEUM_PUBLICATION_INVENTORY_MAX_BYTES,
  MUSEUM_PUBLICATION_BUNDLE_PATH,
  MUSEUM_PUBLICATION_BUNDLE_MAX_BYTES,
  MUSEUM_PUBLICATION_CANONICALIZATION_ID,
  museumPublicationCatalogResolver,
  normalizeMuseumCatalogBytes,
  parseMuseumPublicationJson,
  type MuseumPublicationCatalog,
  type MuseumPublicationCatalogDocument,
  type MuseumPublicationCatalogPointer,
  verifyMuseumPublicationCatalogContentHash,
} from "@/lib/museum/publication";

const B = "a".repeat(40);
const C = "b".repeat(40);
const SHA_ZERO = `sha256:${"0".repeat(64)}` as `sha256:${string}`;
const KECCAK_ZERO = `0x${"0".repeat(64)}` as `0x${string}`;
const C4_PUBLICATION_INVENTORY_FILE_SIZE = 163_984;
function sha(bytes: Uint8Array): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function sourceUrl(path: string): string {
  return `https://github.com/6529-Collections/6529networkmuseum/blob/${B}/${path}`;
}

function rawUrl(path: string): string {
  return `https://raw.githubusercontent.com/6529-Collections/6529networkmuseum/${B}/${path}`;
}

function document(
  path: string,
  bytes: Uint8Array,
  options: Partial<MuseumPublicationCatalogDocument> = {}
): MuseumPublicationCatalogDocument {
  return {
    path,
    size: bytes.byteLength,
    byteMode: "raw",
    sha256: sha(bytes),
    sourceUrl: sourceUrl(path),
    rawUrl: rawUrl(path),
    ...options,
  };
}

function buildFixture(): {
  pointer: MuseumPublicationCatalogPointer;
  catalog: MuseumPublicationCatalog;
  bundleBytes: Uint8Array;
  bundleDocuments: readonly { path: string; bytes: Uint8Array }[];
  inventoryDocument: { path: string; bytes: Uint8Array };
} {
  const manuscriptBytes = new TextEncoder().encode("# Museum\n");
  const inventoryPath = MUSEUM_PUBLICATION_INVENTORY_PATH;
  const mediaBytes = Uint8Array.from([1, 2, 3, 4]);
  const inventoryValue = {
    $schema:
      "https://6529networkmuseum.org/schemas/public-publication-inventory-v1.json",
    inventory_version: "1.0.0",
    inventory_id: "6529NM_PUBLIC_VISITOR_CORPUS",
    scope: "visitor_publication_corpus",
    integrity: {
      canonicalization_id: KECCAK_ZERO,
      body_sha256: "computed",
      body_keccak256: "computed",
    },
    assembler: {
      required_paths: ["docs/a.md"],
      activation_mode: "atomic",
      bundle_path: "records/publication/visitor-corpus-bundle-v1.json",
    },
    bundle: {
      path: "records/publication/visitor-corpus-bundle-v1.json",
      schema:
        "https://6529networkmuseum.org/schemas/public-publication-bundle-v1.json",
      required_in_catalog: true,
      activation_mode: "atomic",
      max_serialized_bytes: MUSEUM_PUBLICATION_BUNDLE_MAX_BYTES,
    },
    entries: [
      {
        path: "docs/a.md",
        kind: "public_curatorial_manuscript",
        delivery_role: "assembly_document",
        required_in_catalog: true,
        activation_mode: "atomic",
      },
      {
        path: "media/a.webp",
        kind: "approved_public_media",
        delivery_role: "media_asset",
        required_in_catalog: true,
        activation_mode: "deferred_on_demand",
      },
    ],
    counts: {
      approved_public_media: 1,
      public_curatorial_manuscript: 1,
    },
    required_source_sets: {
      fixture_required_paths: ["docs/a.md"],
    },
  };
  const inventorySelfIntegrityBody = {
    ...inventoryValue,
  } as Record<string, unknown>;
  delete inventorySelfIntegrityBody["integrity"];
  const inventorySelfIntegrityBytes = new TextEncoder().encode(
    canonicalMuseumJson(inventorySelfIntegrityBody)
  );
  inventoryValue.integrity = {
    canonicalization_id: MUSEUM_PUBLICATION_CANONICALIZATION_ID,
    body_sha256: sha(inventorySelfIntegrityBytes),
    body_keccak256: keccak256(
      toBytes(canonicalMuseumJson(inventorySelfIntegrityBody))
    ),
  };
  const completeInventoryJcs = canonicalMuseumJson(inventoryValue);
  const completeInventoryJcsBytes = new TextEncoder().encode(
    completeInventoryJcs
  );
  const inventoryBytes = new TextEncoder().encode(
    `${JSON.stringify(inventoryValue)}\n`
  );
  const assemblyDocuments = [
    document("docs/a.md", manuscriptBytes, {
      byteMode: "lf-normalized",
    }),
  ];
  const mediaAssets = [document("media/a.webp", mediaBytes)];
  const bundleValue = {
    $schema: "../../schemas/public-publication-bundle.schema.json",
    bundle_version: "1.0.0",
    bundle_id: "6529NM_PUBLIC_VISITOR_CORPUS_BUNDLE_V1",
    source_inventory_path: inventoryPath,
    source_inventory_body_sha256: sha(completeInventoryJcsBytes),
    source_inventory_body_keccak256: keccak256(toBytes(completeInventoryJcs)),
    canonicalization_id: MUSEUM_PUBLICATION_CANONICALIZATION_ID,
    entries: [
      {
        path: "docs/a.md",
        byte_mode: "lf-normalized",
        content: new TextDecoder().decode(manuscriptBytes),
        file_size: manuscriptBytes.byteLength,
        sha256: sha(manuscriptBytes),
        jcs_keccak256: null,
      },
    ],
    entry_count: 1,
    content_bytes: manuscriptBytes.byteLength,
  };
  const bundleBytes = new TextEncoder().encode(
    `${JSON.stringify(bundleValue)}\n`
  );
  const bundleDescriptor = document(
    MUSEUM_PUBLICATION_BUNDLE_PATH,
    bundleBytes
  );
  const completeInventorySha256 = sha(completeInventoryJcsBytes);
  const completeInventoryJcsKeccak = keccak256(toBytes(completeInventoryJcs));
  const payload = {
    catalog_id: `6529NM-PUBCAT-${B}`,
    catalog_version: "1.0.0",
    state: "immutable_binding",
  };
  const digest = keccak256(toBytes(canonicalMuseumJson(payload)));
  const catalog: MuseumPublicationCatalog = {
    id: `6529NM-PUBCAT-${B}`,
    reviewed: true,
    sourceCommit: B,
    candidateParentCommit: C,
    manifest: {
      path: "release-artifacts/latest/record-manifest.json",
      fileSha256: SHA_ZERO,
      fileSize: 10,
      sourceUrl: sourceUrl("release-artifacts/latest/record-manifest.json"),
      rawUrl: rawUrl("release-artifacts/latest/record-manifest.json"),
      sha256: SHA_ZERO,
      jcsKeccak: KECCAK_ZERO,
      canonicalizationId: MUSEUM_PUBLICATION_CANONICALIZATION_ID,
    },
    publicationInventory: {
      path: inventoryPath,
      fileSize: inventoryBytes.byteLength,
      fileSha256: sha(inventoryBytes),
      completeInventorySha256,
      completeInventoryJcsKeccak,
      inventoryVersion: "1.0.0",
      canonicalizationId: MUSEUM_PUBLICATION_CANONICALIZATION_ID,
      counts: {
        approved_public_media: 1,
        public_curatorial_manuscript: 1,
      },
      sourceUrl: sourceUrl(inventoryPath),
      rawUrl: rawUrl(inventoryPath),
    },
    assemblyDocuments,
    mediaAssets,
    assemblyBundle: {
      descriptor: bundleDescriptor,
      embeddedDocuments: assemblyDocuments,
      completeInventorySha256,
      completeInventoryJcsKeccak,
      fileSize: bundleBytes.byteLength,
      fileSha256: sha(bundleBytes),
      rawFileSize: bundleBytes.byteLength,
      rawFileSha256: sha(bundleBytes),
      bodySha256: sha(
        new TextEncoder().encode(canonicalMuseumJson(bundleValue))
      ),
      bodyKeccak: keccak256(toBytes(canonicalMuseumJson(bundleValue))),
      canonicalizationId: MUSEUM_PUBLICATION_CANONICALIZATION_ID,
    },
    contentHash: {
      algorithm: 1,
      canonicalizationId: MUSEUM_PUBLICATION_CANONICALIZATION_ID,
      digest,
      payload,
    },
  };
  const pointer: MuseumPublicationCatalogPointer = {
    catalogPath: `release-artifacts/catalog/6529NM-PUBCAT-${B}.json`,
    catalogSha256: SHA_ZERO,
    catalogEnvelopeContentHash: digest,
    sourceCommit: B,
  };
  return {
    pointer,
    catalog,
    bundleBytes,
    bundleDocuments: [{ path: "docs/a.md", bytes: manuscriptBytes }],
    inventoryDocument: { path: inventoryPath, bytes: inventoryBytes },
  };
}

describe("Museum publication catalog boundary", () => {
  it("uses the source contract's ordinal path order", () => {
    expect(() =>
      assertSortedUniquePaths(
        ["docs/README.md", "docs/a.md"],
        "publication_catalog_test_paths"
      )
    ).not.toThrow();
    expect(() =>
      assertSortedUniquePaths(
        ["docs/a.md", "docs/README.md"],
        "publication_catalog_test_paths"
      )
    ).toThrow("publication_catalog_test_paths");
  });

  it("accepts the source wire algorithm and explicit assembly/media roles", () => {
    const fixture = buildFixture();
    expect(() =>
      assertMuseumPublicationCatalog(fixture.pointer, fixture.catalog, [
        "docs/a.md",
      ])
    ).not.toThrow();
    expect(fixture.catalog.contentHash.algorithm).toBe(1);
    expect(fixture.catalog.assemblyDocuments[0]?.byteMode).toBe(
      "lf-normalized"
    );
    expect(() =>
      verifyMuseumPublicationCatalogContentHash(fixture.catalog)
    ).not.toThrow();
  });

  it("decodes the strict source envelopes instead of accepting a frontend-shaped catalog", () => {
    const fixture = buildFixture();
    const wireDocument = (entry: MuseumPublicationCatalogDocument) => ({
      path: entry.path,
      file_size: entry.size,
      byte_mode: entry.byteMode,
      sha256: entry.sha256,
      jcs_keccak256: entry.jcsKeccak ?? null,
      immutable_source_url: entry.sourceUrl,
      immutable_raw_url: entry.rawUrl,
    });
    const wirePayload = {
      catalog_id: fixture.catalog.id,
      catalog_version: "1.0.0",
      state: "immutable_binding",
      created_at: "2026-08-08T12:00:00Z",
      reviewed_source_head_commit: B,
      candidate_parent_commit: C,
      manifest_binding: {
        path: fixture.catalog.manifest.path,
        file_size: fixture.catalog.manifest.fileSize,
        file_sha256: fixture.catalog.manifest.fileSha256,
        body_sha256: fixture.catalog.manifest.sha256,
        body_keccak256: fixture.catalog.manifest.jcsKeccak,
        canonicalization_id: fixture.catalog.manifest.canonicalizationId,
        immutable_source_url: fixture.catalog.manifest.sourceUrl,
        immutable_raw_url: fixture.catalog.manifest.rawUrl,
      },
      publication_inventory_binding: {
        path: fixture.catalog.publicationInventory.path,
        file_size: fixture.catalog.publicationInventory.fileSize,
        file_sha256: fixture.catalog.publicationInventory.fileSha256,
        body_sha256:
          fixture.catalog.publicationInventory.completeInventorySha256,
        body_keccak256:
          fixture.catalog.publicationInventory.completeInventoryJcsKeccak,
        canonicalization_id:
          fixture.catalog.publicationInventory.canonicalizationId,
        inventory_version:
          fixture.catalog.publicationInventory.inventoryVersion,
        counts: fixture.catalog.publicationInventory.counts,
        immutable_source_url: fixture.catalog.publicationInventory.sourceUrl,
        immutable_raw_url: fixture.catalog.publicationInventory.rawUrl,
      },
      assembly_documents: fixture.catalog.assemblyDocuments.map(wireDocument),
      media_assets: fixture.catalog.mediaAssets.map(wireDocument),
      bundle_binding: {
        path: fixture.catalog.assemblyBundle.descriptor.path,
        file_size: fixture.catalog.assemblyBundle.fileSize,
        file_sha256: fixture.catalog.assemblyBundle.fileSha256,
        raw_file_size: fixture.catalog.assemblyBundle.rawFileSize,
        raw_file_sha256: fixture.catalog.assemblyBundle.rawFileSha256,
        body_sha256: fixture.catalog.assemblyBundle.bodySha256,
        body_keccak256: fixture.catalog.assemblyBundle.bodyKeccak,
        canonicalization_id: fixture.catalog.assemblyBundle.canonicalizationId,
        source_inventory_body_sha256:
          fixture.catalog.assemblyBundle.completeInventorySha256,
        source_inventory_body_keccak256:
          fixture.catalog.assemblyBundle.completeInventoryJcsKeccak,
        immutable_source_url:
          fixture.catalog.assemblyBundle.descriptor.sourceUrl,
        immutable_raw_url: fixture.catalog.assemblyBundle.descriptor.rawUrl,
      },
      activation_policy: "frontend_activates_only_verified_catalog",
    };
    const wireCatalog = {
      $schema:
        "https://6529networkmuseum.org/schemas/publication-catalog-v1.json",
      envelope: {
        recordType: "PUBLICATION_CATALOG",
        contentHash: {
          algorithm: 1,
          digest: fixture.catalog.contentHash.digest,
          canonicalizationId: fixture.catalog.contentHash.canonicalizationId,
        },
        uri: `https://6529networkmuseum.org/release/catalog/${fixture.catalog.id}.json`,
      },
      payload: wirePayload,
    };
    const decoded = museumPublicationCatalogResolver.decodeCatalog(wireCatalog);
    expect(decoded.assemblyDocuments.map((entry) => entry.path)).toEqual(
      fixture.catalog.assemblyDocuments.map((entry) => entry.path)
    );
    expect(decoded.mediaAssets.map((entry) => entry.path)).toEqual([
      "media/a.webp",
    ]);
    expect(() =>
      museumPublicationCatalogResolver.decodeCatalog({
        ...wireCatalog,
        payload: { ...wirePayload, unexpected: true },
      })
    ).toThrow("publication_catalog_payload");
    expect(() =>
      museumPublicationCatalogResolver.decodeCatalog({
        ...wireCatalog,
        payload: { ...wirePayload, catalog_version: "1.1.0" },
      })
    ).toThrow("publication_catalog_version");
    expect(() =>
      museumPublicationCatalogResolver.decodeCatalog({
        ...wireCatalog,
        payload: {
          ...wirePayload,
          publication_inventory_binding: {
            ...wirePayload.publication_inventory_binding,
            file_size: MUSEUM_PUBLICATION_INVENTORY_MAX_BYTES + 1,
          },
        },
      })
    ).toThrow("publication_catalog_inventory_too_large");
  });

  it("decodes the v1 relative-schema visitor bundle and verifies its body commitment", () => {
    const fixture = buildFixture();
    const decoded = decodePublicationAssemblyBundle(
      fixture.bundleBytes,
      fixture.catalog
    );
    expect(decoded.documents.map((entry) => entry.path)).toEqual(["docs/a.md"]);
    expect(decoded.completeInventorySha256).toBe(
      fixture.catalog.publicationInventory.completeInventorySha256
    );
    expect(decoded.completeInventoryJcsKeccak).toBe(
      fixture.catalog.publicationInventory.completeInventoryJcsKeccak
    );
  });

  it.each([
    [
      "pointer/catalog commit mismatch",
      (f: ReturnType<typeof buildFixture>) => ({
        ...f.pointer,
        sourceCommit: C,
      }),
    ],
    [
      "pointer envelope hash mismatch",
      (f: ReturnType<typeof buildFixture>) => ({
        ...f.pointer,
        catalogEnvelopeContentHash: KECCAK_ZERO,
      }),
    ],
    [
      "blob URL used as runtime URL",
      (f: ReturnType<typeof buildFixture>) => ({
        ...f.catalog,
        manifest: {
          ...f.catalog.manifest,
          rawUrl: f.catalog.manifest.sourceUrl,
        },
      }),
    ],
    [
      "legacy utf8-lf byte mode",
      (f: ReturnType<typeof buildFixture>) => ({
        ...f.catalog,
        assemblyDocuments: [
          { ...f.catalog.assemblyDocuments[0], byteMode: "utf8-lf" },
        ],
      }),
    ],
    [
      "missing required assembly document",
      (f: ReturnType<typeof buildFixture>) => ({
        ...f.catalog,
        assemblyDocuments: [],
        assemblyBundle: {
          ...f.catalog.assemblyBundle,
          embeddedDocuments: [],
        },
      }),
    ],
    [
      "assembly/media overlap",
      (f: ReturnType<typeof buildFixture>) => ({
        ...f.catalog,
        mediaAssets: [f.catalog.assemblyDocuments[0]],
      }),
    ],
    [
      "text-normalized deferred media",
      (f: ReturnType<typeof buildFixture>) => ({
        ...f.catalog,
        mediaAssets: [{ ...f.catalog.mediaAssets[0], byteMode: "lf-normalized" }],
      }),
    ],
    [
      "non-media deferred path",
      (f: ReturnType<typeof buildFixture>) => ({
        ...f.catalog,
        mediaAssets: [{ ...f.catalog.mediaAssets[0], path: "media/a.json" }],
      }),
    ],
  ])("rejects %s", (_name, mutate) => {
    const fixture = buildFixture();
    expect(() =>
      assertMuseumPublicationCatalog(
        fixture.pointer,
        mutate(fixture) as MuseumPublicationCatalog,
        ["docs/a.md"]
      )
    ).toThrow();
  });

  it("rejects duplicate JSON keys before catalog commitments are trusted", () => {
    expect(() => parseMuseumPublicationJson('{"path":"a","path":"b"}')).toThrow(
      "publication_catalog_duplicate_key"
    );
  });

  it("validates the decoded bundle as an exact assembly set", () => {
    const fixture = buildFixture();
    expect(() =>
      assertMuseumPublicationCatalogAssemblyBundle(
        {
          documents: fixture.bundleDocuments,
          completeInventorySha256:
            fixture.catalog.assemblyBundle.completeInventorySha256,
          completeInventoryJcsKeccak:
            fixture.catalog.assemblyBundle.completeInventoryJcsKeccak,
        },
        fixture.catalog
      )
    ).not.toThrow();
    expect(() =>
      assertMuseumPublicationCatalogAssemblyBundle(
        {
          documents: [
            ...fixture.bundleDocuments,
            { path: "docs/extra.md", bytes: new TextEncoder().encode("extra") },
          ],
          completeInventorySha256:
            fixture.catalog.assemblyBundle.completeInventorySha256,
          completeInventoryJcsKeccak:
            fixture.catalog.assemblyBundle.completeInventoryJcsKeccak,
        },
        fixture.catalog
      )
    ).toThrow();
  });

  it("accepts the exact v1 bundle ceiling and rejects one byte beyond it", () => {
    const fixture = buildFixture();
    expect(() =>
      assertMuseumPublicationCatalog(
        fixture.pointer,
        {
          ...fixture.catalog,
          assemblyBundle: {
            ...fixture.catalog.assemblyBundle,
            descriptor: {
              ...fixture.catalog.assemblyBundle.descriptor,
              size: MUSEUM_PUBLICATION_BUNDLE_MAX_BYTES,
            },
            fileSize: MUSEUM_PUBLICATION_BUNDLE_MAX_BYTES,
            rawFileSize: MUSEUM_PUBLICATION_BUNDLE_MAX_BYTES,
          },
        },
        ["docs/a.md"]
      )
    ).not.toThrow();
    expect(() =>
      assertMuseumPublicationCatalog(
        fixture.pointer,
        {
          ...fixture.catalog,
          assemblyBundle: {
            ...fixture.catalog.assemblyBundle,
            descriptor: {
              ...fixture.catalog.assemblyBundle.descriptor,
              size: MUSEUM_PUBLICATION_BUNDLE_MAX_BYTES + 1,
            },
            fileSize: MUSEUM_PUBLICATION_BUNDLE_MAX_BYTES + 1,
            rawFileSize: MUSEUM_PUBLICATION_BUNDLE_MAX_BYTES + 1,
          },
        },
        ["docs/a.md"]
      )
    ).toThrow("publication_catalog_bundle_too_large");
  });

  it("accepts the real C4 inventory and hard boundary, then rejects max plus one", () => {
    const fixture = buildFixture();
    expect(C4_PUBLICATION_INVENTORY_FILE_SIZE).toBeLessThanOrEqual(
      MUSEUM_PUBLICATION_INVENTORY_MAX_BYTES
    );
    for (const fileSize of [
      C4_PUBLICATION_INVENTORY_FILE_SIZE,
      MUSEUM_PUBLICATION_INVENTORY_MAX_BYTES,
    ]) {
      expect(() =>
        assertMuseumPublicationCatalog(
          fixture.pointer,
          {
            ...fixture.catalog,
            publicationInventory: {
              ...fixture.catalog.publicationInventory,
              fileSize,
            },
          },
          ["docs/a.md"]
        )
      ).not.toThrow();
    }
    expect(() =>
      assertMuseumPublicationCatalog(
        fixture.pointer,
        {
          ...fixture.catalog,
          publicationInventory: {
            ...fixture.catalog.publicationInventory,
            fileSize: MUSEUM_PUBLICATION_INVENTORY_MAX_BYTES + 1,
          },
        },
        ["docs/a.md"]
      )
    ).toThrow("publication_catalog_inventory_too_large");
  });

  it("normalizes only the catalog-declared text mode and fails fixity drift", () => {
    const fixture = buildFixture();
    const entry = fixture.catalog.assemblyDocuments[0];
    if (entry === undefined) throw new Error("test_entry_missing");
    const crlf = new TextEncoder().encode(
      JSON.stringify({ ok: true }).replaceAll("}", "}\r\n")
    );
    expect(normalizeMuseumCatalogBytes({ ...entry, size: 0 }, crlf)).toEqual(
      new TextEncoder().encode('{"ok":true}\n')
    );
  });

  it("checks the separately bound inventory's manifest fixity", () => {
    const fixture = buildFixture();
    const entry = {
      path: fixture.catalog.publicationInventory.path,
      size: fixture.catalog.publicationInventory.fileSize,
      sha256: fixture.catalog.publicationInventory.fileSha256,
    };
    expect(() =>
      assertMuseumPublicationInventoryManifestBinding(entry, fixture.catalog)
    ).not.toThrow();
    expect(() =>
      assertMuseumPublicationInventoryManifestBinding(
        { ...entry, size: entry.size + 1 },
        fixture.catalog
      )
    ).toThrow("publication_catalog_inventory_manifest_mismatch");
    expect(() =>
      assertMuseumPublicationInventoryManifestBinding(
        undefined,
        fixture.catalog
      )
    ).toThrow("publication_catalog_inventory_manifest_mismatch");
  });

  it("checks the separately bound inventory's role set and body commitment", () => {
    const fixture = buildFixture();
    const inventory = fixture.inventoryDocument;
    expect(() =>
      assertMuseumPublicationInventoryDocument(inventory, fixture.catalog)
    ).not.toThrow();
    const changed = new TextEncoder().encode(
      new TextDecoder()
        .decode(inventory.bytes)
        .replace("approved_public_media", "public_entity_record")
    );
    expect(() =>
      assertMuseumPublicationInventoryDocument(
        { ...inventory, bytes: changed },
        fixture.catalog
      )
    ).toThrow();
  });

  it("keeps inventory self-integrity distinct from the complete-inventory catalog commitment", () => {
    const fixture = buildFixture();
    const inventoryValue = JSON.parse(
      new TextDecoder().decode(fixture.inventoryDocument.bytes)
    ) as Record<string, unknown>;
    const integrity = inventoryValue["integrity"] as Record<string, unknown>;
    integrity["body_sha256"] = SHA_ZERO;
    const changedBytes = new TextEncoder().encode(
      `${JSON.stringify(inventoryValue)}\n`
    );
    const completeInventoryText = canonicalMuseumJson(inventoryValue);
    const catalog = {
      ...fixture.catalog,
      publicationInventory: {
        ...fixture.catalog.publicationInventory,
        fileSize: changedBytes.byteLength,
        fileSha256: sha(changedBytes),
        completeInventorySha256: sha(
          new TextEncoder().encode(completeInventoryText)
        ),
        completeInventoryJcsKeccak: keccak256(toBytes(completeInventoryText)),
      },
    };
    expect(() =>
      assertMuseumPublicationInventoryDocument(
        { ...fixture.inventoryDocument, bytes: changedBytes },
        catalog
      )
    ).toThrow("publication_catalog_inventory_commitment_mismatch");
  });

  it("rejects a complete-inventory catalog commitment drift even when self-integrity is valid", () => {
    const fixture = buildFixture();
    expect(() =>
      assertMuseumPublicationInventoryDocument(fixture.inventoryDocument, {
        ...fixture.catalog,
        publicationInventory: {
          ...fixture.catalog.publicationInventory,
          completeInventorySha256: SHA_ZERO,
        },
      })
    ).toThrow("publication_catalog_inventory_commitment_mismatch");
  });

  it("rejects catalog count drift from the complete bound inventory", () => {
    const fixture = buildFixture();
    expect(() =>
      assertMuseumPublicationInventoryDocument(fixture.inventoryDocument, {
        ...fixture.catalog,
        publicationInventory: {
          ...fixture.catalog.publicationInventory,
          counts: {
            ...fixture.catalog.publicationInventory.counts,
            public_entity_record: 2,
          },
        },
      })
    ).toThrow("publication_catalog_inventory_counts_mismatch");
  });

  it.each([
    [
      "duplicate required source-set path",
      (paths: string[]) => paths.push(paths[0] ?? ""),
    ],
    [
      "unlisted required source-set path",
      (paths: string[]) => paths.splice(0, paths.length, "docs/missing.md"),
    ],
  ])("rejects %s after fixity is updated", (_name, mutatePaths) => {
    const fixture = buildFixture();
    const inventory = fixture.inventoryDocument;
    const inventoryValue = JSON.parse(
      new TextDecoder().decode(inventory.bytes)
    ) as Record<string, unknown>;
    const requiredSourceSets = inventoryValue["required_source_sets"] as Record<
      string,
      string[]
    >;
    mutatePaths(requiredSourceSets["fixture_required_paths"] ?? []);
    const selfIntegrityBody = { ...inventoryValue };
    delete selfIntegrityBody["integrity"];
    const selfIntegrityBodyText = canonicalMuseumJson(selfIntegrityBody);
    const selfIntegrityBodyBytes = new TextEncoder().encode(
      selfIntegrityBodyText
    );
    inventoryValue["integrity"] = {
      canonicalization_id: MUSEUM_PUBLICATION_CANONICALIZATION_ID,
      body_sha256: sha(selfIntegrityBodyBytes),
      body_keccak256: keccak256(toBytes(selfIntegrityBodyText)),
    };
    const completeInventoryText = canonicalMuseumJson(inventoryValue);
    const completeInventorySha256 = sha(
      new TextEncoder().encode(completeInventoryText)
    );
    const completeInventoryJcsKeccak = keccak256(
      toBytes(completeInventoryText)
    );
    const inventoryBytes = new TextEncoder().encode(
      `${JSON.stringify(inventoryValue)}\n`
    );
    const catalog = {
      ...fixture.catalog,
      publicationInventory: {
        ...fixture.catalog.publicationInventory,
        fileSize: inventoryBytes.byteLength,
        fileSha256: sha(inventoryBytes),
        completeInventorySha256,
        completeInventoryJcsKeccak,
      },
      assemblyBundle: {
        ...fixture.catalog.assemblyBundle,
        completeInventorySha256,
        completeInventoryJcsKeccak,
      },
    };
    expect(() =>
      assertMuseumPublicationInventoryDocument(
        { ...inventory, bytes: inventoryBytes },
        catalog
      )
    ).toThrow();
  });
});
