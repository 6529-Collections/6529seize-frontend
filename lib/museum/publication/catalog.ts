import { verifyMuseumSha256 } from "./manifest";
import { assertMuseumPublicationCatalog } from "./catalog-contract";
import {
  MUSEUM_PUBLICATION_CATALOG_POINTER_PATH,
  asRecord,
  type MuseumPublicationCatalogFetchResult,
  type MuseumPublicationCatalogResolver,
} from "./catalog-contract";
import {
  decodePublicationAssemblyBundle,
  verifyDocumentJcs,
} from "./catalog-bundle-decoder";
import { decodePublicationCatalog } from "./catalog-decoder";
import {
  decodePublicationCatalogPointer,
  parseMuseumPublicationJson,
} from "./catalog-json";
import {
  assertSafeMuseumRepositoryPath,
  buildImmutableMuseumRawUrl,
  isExactGitCommit,
} from "./security";
import { verifyMuseumPublicationCatalogContentHash } from "./catalog-delivery";

export * from "./catalog-contract";
export {
  assertMuseumCatalogDocumentBytes,
  assertMuseumPublicationCatalogAssemblyBundle,
  assertMuseumPublicationInventoryDocument,
  normalizeMuseumCatalogBytes,
} from "./catalog-delivery";
export { verifyMuseumPublicationCatalogContentHash };
export { parseMuseumPublicationJson } from "./catalog-json";
export { decodePublicationAssemblyBundle } from "./catalog-bundle-decoder";

export const museumPublicationCatalogResolver: MuseumPublicationCatalogResolver = {
  pointerPath: MUSEUM_PUBLICATION_CATALOG_POINTER_PATH,
  decodePointer: decodePublicationCatalogPointer,
  decodeCatalog: decodePublicationCatalog,
  decodeAssemblyBundle: decodePublicationAssemblyBundle,
  verifyCatalogEnvelope(value, catalog) {
    const root = asRecord(value, "publication_catalog_envelope");
    const envelope = asRecord(root.envelope, "publication_catalog_envelope");
    const contentHash = asRecord(
      envelope.contentHash,
      "publication_catalog_content_hash"
    );
    if (
      envelope.recordType !== "PUBLICATION_CATALOG" ||
      contentHash.algorithm !== 1 ||
      contentHash.digest !== catalog.contentHash.digest ||
      contentHash.canonicalizationId !== catalog.contentHash.canonicalizationId ||
      envelope.uri !==
        `https://6529networkmuseum.org/release/catalog/${catalog.id}.json`
    ) {
      throw new Error("publication_catalog_envelope_mismatch");
    }
  },
  verifyDocumentCommitment: verifyDocumentJcs,
};

export async function resolveMuseumPublicationCatalog(input: {
  readonly resolvedMainCommit: string;
  readonly resolver: MuseumPublicationCatalogResolver;
  readonly requiredPaths: readonly string[];
  readonly fetchBytes: (url: string, maxBytes: number, accept: string) => Promise<Uint8Array>;
}): Promise<MuseumPublicationCatalogFetchResult> {
  if (
    !isExactGitCommit(input.resolvedMainCommit) ||
    input.resolver.pointerPath !== MUSEUM_PUBLICATION_CATALOG_POINTER_PATH
  ) {
    throw new Error("publication_catalog_pointer_contract");
  }
  const pointerUrl = buildImmutableMuseumRawUrl(
    input.resolvedMainCommit,
    MUSEUM_PUBLICATION_CATALOG_POINTER_PATH
  );
  const pointerBytes = await input.fetchBytes(
    pointerUrl,
    256_000,
    "application/json"
  );
  let pointerValue: unknown;
  try {
    pointerValue = parseMuseumPublicationJson(
      new TextDecoder("utf-8", { fatal: true }).decode(pointerBytes)
    );
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("publication_catalog_")) {
      throw error;
    }
    throw new Error("publication_catalog_pointer_json_invalid");
  }
  const pointer = input.resolver.decodePointer(pointerValue);
  assertSafeMuseumRepositoryPath(pointer.catalogPath);
  const catalogUrl = buildImmutableMuseumRawUrl(
    input.resolvedMainCommit,
    pointer.catalogPath
  );
  const catalogBytes = await input.fetchBytes(
    catalogUrl,
    2_000_000,
    "application/json"
  );
  if (!verifyMuseumSha256(catalogBytes, pointer.catalogSha256)) {
    throw new Error("publication_catalog_pointer_hash_mismatch");
  }
  let catalogValue: unknown;
  try {
    catalogValue = parseMuseumPublicationJson(
      new TextDecoder("utf-8", { fatal: true }).decode(catalogBytes)
    );
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("publication_catalog_")) {
      throw error;
    }
    throw new Error("publication_catalog_json_invalid");
  }
  const catalog = input.resolver.decodeCatalog(catalogValue);
  assertMuseumPublicationCatalog(pointer, catalog, input.requiredPaths);
  verifyMuseumPublicationCatalogContentHash(catalog);
  input.resolver.verifyCatalogEnvelope(catalogValue, catalog);
  return { pointer, catalog };
}
