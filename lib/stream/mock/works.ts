import { CC0_SPDX_ID } from "@/lib/stream/constants";
import { mediaKindOf, storageStatusOf } from "@/lib/stream/media";
import {
  generateHtml,
  generateSvg,
  htmlDataUri,
  svgDataUri,
} from "@/lib/stream/mock/art";
import type { MockStreamEngine } from "@/lib/stream/mock/engine";
import { mockHash } from "@/lib/stream/mock/ids";
import { englishState } from "@/lib/stream/mock/sales/englishAuction";
import type { MockToken } from "@/lib/stream/mock/state";
import type {
  Hex32,
  MediaFileView,
  MediaLocator,
  StatementView,
  StreamWork,
  StreamWorkSummary,
  TokenAttribute,
  TokenUriJson,
  WorkDisputeState,
  WorkLicense,
  WorkRecordInfo,
} from "@/lib/stream/types";

const BASE32 = "abcdefghijklmnopqrstuvwxyz234567";
const BASE64URL =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function encodeFrom(hash: Hex32, alphabet: string, length: number): string {
  const hex = hash.slice(2).repeat(3);
  let text = "";
  for (let index = 0; text.length < length; index += 2) {
    const byte = Number.parseInt(hex.slice(index, index + 2), 16);
    text += alphabet.charAt(byte % alphabet.length);
  }
  return text;
}

/** A well-formed but fake locator: `ar://` + 43 chars, or `ipfs://bafkrei…` (66 chars). */
function mockLocator(
  kind: MediaLocator["kind"],
  fileHash: Hex32
): MediaLocator {
  switch (kind) {
    case "ARWEAVE":
      return { kind, uri: `ar://${encodeFrom(fileHash, BASE64URL, 43)}` };
    case "IPFS":
      return { kind, uri: `ipfs://bafkrei${encodeFrom(fileHash, BASE32, 52)}` };
    case "ONCHAIN":
      return { kind, uri: "" };
  }
}

const contentCache = new Map<string, string>();

function cached(key: string, build: () => string): string {
  let value = contentCache.get(key);
  if (value === undefined) {
    value = build();
    contentCache.set(key, value);
  }
  return value;
}

function previewUri(token: MockToken): string {
  return cached(`svg:${token.art.seed}:${token.art.style}`, () =>
    svgDataUri(generateSvg(token.art.seed, token.art.style))
  );
}

function primaryUri(token: MockToken): string {
  if (token.art.style !== "canvas") {
    return previewUri(token);
  }
  return cached(`html:${token.art.seed}`, () =>
    htmlDataUri(generateHtml(token.art.seed))
  );
}

function primaryType(token: MockToken): string {
  return token.art.style === "canvas" ? "text/html" : "image/svg+xml";
}

/** The token whose record and media an edition shows: its master's, when linked. */
function recordSource(engine: MockStreamEngine, token: MockToken): MockToken {
  const master =
    token.standard === "ERC1155" && token.linked.master !== null
      ? engine.state.tokens.get(token.linked.master)
      : undefined;
  return master ?? token;
}

function mediaFiles(source: MockToken): MediaFileView[] {
  const type = primaryType(source);
  const primaryHash = mockHash(`file:primary:${source.key}`);
  // A file is stored on-chain once the work is complete, or while an upload
  // to the content store is under way (an ONCHAIN copy is registered).
  const onChain =
    source.storage.onChainComplete ||
    source.storage.locators.includes("ONCHAIN");
  const files: MediaFileView[] = [
    {
      fileId: mockHash(`file-id:primary:${source.key}`),
      sha256: primaryHash,
      role: "PRIMARY",
      contentType: type,
      kind: mediaKindOf(type),
      bytes: type === "text/html" ? 6_144 : 24_572,
      locators: source.storage.locators.map((kind) =>
        mockLocator(kind, primaryHash)
      ),
      preferred: source.storage.preferred,
      onChain,
      displayUri: primaryUri(source),
    },
  ];
  if (type === "text/html") {
    const previewHash = mockHash(`file:preview:${source.key}`);
    files.push({
      fileId: mockHash(`file-id:preview:${source.key}`),
      sha256: previewHash,
      role: "PREVIEW",
      contentType: "image/svg+xml",
      kind: "image",
      bytes: 18_230,
      locators: source.storage.locators.map((kind) =>
        mockLocator(kind, previewHash)
      ),
      preferred: source.storage.preferred,
      onChain,
      displayUri: previewUri(source),
    });
  }
  return files;
}

function licenseOf(spdxId: string): WorkLicense {
  const isRef = spdxId.startsWith("LicenseRef-");
  return {
    spdxId,
    textFileId: mockHash(`license-text:${spdxId}`),
    url: isRef ? null : `https://spdx.org/licenses/${spdxId}.html`,
    irrevocable: spdxId === CC0_SPDX_ID,
  };
}

function recordInfo(engine: MockStreamEngine, source: MockToken) {
  if (!source.storage.recordOpen) {
    return null;
  }
  const info: WorkRecordInfo = {
    recordFileId: mockHash(`record-file:${source.key}`),
    mediaHash: mockHash(`media-list:${source.key}`),
    licenseKey: mockHash(`license-key:${source.licenseSpdxId}`),
    version: source.storage.finalized ? 2 : 1,
    finalized: source.storage.finalized,
    onChainComplete: source.storage.onChainComplete,
    renderer: engine.contracts.workRecords,
  };
  return info;
}

function statementsAbout(
  engine: MockStreamEngine,
  source: MockToken
): StatementView[] {
  return engine.state.statements.filter(
    (statement) =>
      statement.subject.token === source.token &&
      statement.subject.id === source.tokenId
  );
}

function disputeStateOf(
  engine: MockStreamEngine,
  source: MockToken
): WorkDisputeState {
  const saleId =
    source.sale?.kind === "ENGLISH_AUCTION" ? source.sale.saleId : null;
  const auction =
    saleId === null ? undefined : engine.state.englishAuctions.get(saleId);
  const paused =
    auction !== undefined && englishState(engine, auction) === "PAUSED";
  const pausedAt = paused ? auction.pausedAt : null;
  const statements = statementsAbout(engine, source);
  const outcomes = statements.filter((item) => item.kind === "DISPUTE_OUTCOME");
  return {
    paused,
    pausedAt,
    decisionFrom: pausedAt === null ? null : pausedAt + 2 * 86_400,
    expiresAt: pausedAt === null ? null : pausedAt + 7 * 86_400,
    latestOutcome: outcomes.at(-1)?.entryHash ?? null,
    statements,
  };
}

/** An edition shows its master's record plus `Edition of`. */
function isLinkedEdition(entry: MockToken, source: MockToken): boolean {
  return entry.key !== source.key;
}

function rendererTraits(
  engine: MockStreamEngine,
  entry: MockToken,
  source: MockToken
): TokenAttribute[] {
  const traits: TokenAttribute[] = source.parties
    .filter((party) => party.role === "ARTIST")
    .map((party) => ({ trait_type: "Artist", value: party.displayName }));
  traits.push({ trait_type: "Year", value: source.year });
  traits.push({ trait_type: "Medium", value: source.medium });
  if (source.collection) {
    traits.push({ trait_type: "Collection", value: source.collection.name });
    traits.push({ trait_type: "Serial", value: source.collection.serial });
  }
  if (isLinkedEdition(entry, source)) {
    traits.push({ trait_type: "Edition of", value: source.tokenId });
  }
  const outcome = disputeStateOf(engine, source).latestOutcome;
  if (outcome !== null) {
    traits.push({ trait_type: "Dispute statement", value: outcome });
  }
  return traits;
}

function coreOnlyMetadata(entry: MockToken, source: MockToken): TokenUriJson {
  const attributes: TokenAttribute[] = [
    { trait_type: "Artist ID", value: source.artistId },
  ];
  if (source.collection) {
    attributes.push({
      trait_type: "Collection",
      value: source.collection.name,
    });
    attributes.push({ trait_type: "Serial", value: source.collection.serial });
  }
  if (isLinkedEdition(entry, source)) {
    attributes.push({ trait_type: "Edition of", value: source.tokenId });
  }
  return {
    name: source.collection
      ? `${source.collection.name} #${source.collection.serial}`
      : `#${source.tokenId}`,
    description: "The work record is not available.",
    record_status: "not_open",
    attributes,
  };
}

/** `tokenURI` / `uri`, decoded, as the renderer would build it. */
function metadataOf(
  engine: MockStreamEngine,
  token: MockToken
): TokenUriJson {
  const source = recordSource(engine, token);
  if (!source.storage.recordOpen) {
    return coreOnlyMetadata(token, source);
  }
  const [primary, preview] = mediaFiles(source);
  const inline = source.storage.onChainComplete;
  const locator = primary?.locators[primary.preferred]?.uri ?? "";
  const served = inline ? (primary?.displayUri ?? "") : locator;
  const isImage = primary?.kind === "image";
  const license = licenseOf(source.licenseSpdxId);
  // A stored preview is inlined; otherwise `image` is the preview's preferred copy.
  const previewImage = preview?.onChain
    ? (preview.displayUri ?? "")
    : (preview?.locators[preview.preferred]?.uri ?? "");
  return {
    name: source.title,
    description: source.description,
    ...(isImage ? { image: served } : { image: previewImage }),
    ...(isImage ? {} : { animation_url: served }),
    ...(inline ? {} : { media_url: locator }),
    content_type: primary?.contentType ?? "",
    content_hash: primary?.sha256 ?? mockHash("none"),
    license: license.spdxId,
    ...(license.url === null ? {} : { license_url: license.url }),
    ...(license.textFileId === null
      ? {}
      : { license_text_file: license.textFileId }),
    attributes: rendererTraits(engine, token, source),
  };
}

export function workView(
  engine: MockStreamEngine,
  token: MockToken
): StreamWork {
  const source = recordSource(engine, token);
  const record = recordInfo(engine, source);
  const media = source.storage.recordOpen ? mediaFiles(source) : [];
  const federated =
    token.federatedContract === null
      ? null
      : engine.state.federated.get(token.federatedContract);
  return {
    key: token.key,
    variant: token.variant,
    program: token.program,
    standard: token.standard,
    token: token.token,
    tokenId: token.tokenId,
    kind: token.kind,
    title: source.title,
    artistId: token.artistId,
    parties: source.parties,
    collection: source.collection,
    metadata: metadataOf(engine, token),
    record,
    media,
    storage: storageStatusOf(record, media),
    license: source.storage.recordOpen ? licenseOf(source.licenseSpdxId) : null,
    seed: {
      policy: source.seedPolicy,
      seed:
        source.seedPolicy === "NONE" ? null : mockHash(`seed:${source.key}`),
    },
    economics: token.economics,
    linked: { ...token.linked },
    owner: token.standard === "ERC721" && !token.burned ? token.owner : null,
    editionSupply:
      token.standard === "ERC1155" && token.created ? token.supply : null,
    sale: token.sale,
    primarySaleSettled: token.primarySaleSettled,
    dispute: disputeStateOf(engine, source),
    federated:
      federated === undefined || federated === null
        ? null
        : { contract: federated.address, status: federated.status },
    packageRoot: token.packageRoot,
    itemHash: token.itemHash,
    mintedAt: token.mintedAt,
    burned: token.burned,
  };
}

export function summaryOf(
  engine: MockStreamEngine,
  token: MockToken
): StreamWorkSummary {
  const source = recordSource(engine, token);
  const artist = engine.state.artists.get(token.artistId);
  const record = recordInfo(engine, source);
  const media = source.storage.recordOpen ? mediaFiles(source) : [];
  return {
    key: token.key,
    variant: token.variant,
    title: source.title,
    artistId: token.artistId,
    artistName: artist?.displayName ?? token.artistId,
    thumbnailUri: previewUri(source),
    storage: storageStatusOf(record, media),
    licenseSpdxId: source.storage.recordOpen ? source.licenseSpdxId : null,
  };
}
