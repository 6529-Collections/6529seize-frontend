import {
  BaseError,
  ContractFunctionRevertedError,
  getAbiItem,
  hashTypedData,
  keccak256,
  parseEventLogs,
  toBytes,
  type Address,
  type Hex,
} from "viem";

import {
  accountsAbi,
  editionAuctionAbi,
  openGateAbi,
  packageRegistryAbi,
  saleStarterAbi,
  streamAbi,
  workFactsAbi,
} from "./abis";
import { getStreamClient } from "./client";
import type { StoredFile } from "./content";
import { cc0TextFileId, fileIdOf, tokenIdFromStart, type CreateIo, type SigningIo } from "./create";
import { acceptanceTypedData, moveTypedData, type PackageAcceptance } from "./curatedSigning";
import { profileDocHashOf, profileIdOf, walletProof } from "./independent";
import { getStreamInstance } from "./instances";
import { buildItem, encodeEditionOpenData, encodeStreamMint, mediaListOf, type MediaFile, type PackageItem } from "./item";
import { editionSaleExists, saleIdOf, scanLogs } from "./reads";
import { streamTx } from "./streamTx";

/**
 * The curated 6529 Stream path on a test instance with an open gate
 * (SepoliaOpenGate, r9 on): anyone creates a collection and registers a
 * package, the artist accepts it and signs the move, and anyone starts the
 * sale. Every step first reads the chain and skips what is done already, so a
 * run resumes after a failure or a reload. See 6529-works
 * `script/sepolia/open-gate.md` for the call sequence.
 */
export interface CuratedWorkContext {
  readonly media: StoredFile;
  readonly record: StoredFile;
  /** An existing collection, or null to create one named `newCollectionName`. */
  collectionId: bigint | null;
  readonly newCollectionName: string;
  /** Edition cap (0 = none), or null for a 1/1 only. */
  readonly editionCap: number | null;
  primaryFileId?: Hex;
  recordFileId?: Hex;
  item?: PackageItem;
  mediaList?: MediaFile[];
  itemHash?: Hex;
  packageRoot?: Hex;
  tokenId?: bigint;
}

/** Signatures expire after an hour: long enough for a slow wallet, short enough to be harmless. */
const SIGNATURE_LIFETIME_S = 3_600;
/** Move nonces are tried from 0; an artist will not have used more on a test instance. */
const MAX_MOVE_NONCE = 256n;

function gate(): Address {
  const address = getStreamInstance().addresses.openGate;
  if (!address) throw new Error("this instance has no open gate");
  return address;
}

function deadlineFromNow(): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + SIGNATURE_LIFETIME_S);
}

function isRevert(error: unknown, name?: string): boolean {
  if (!(error instanceof BaseError)) return false;
  const revert = error.walk((cause) => cause instanceof ContractFunctionRevertedError);
  if (!(revert instanceof ContractFunctionRevertedError)) return false;
  return name === undefined || revert.data?.errorName === name;
}

const COLLECTION_CREATED = getAbiItem({ abi: streamAbi, name: "CollectionCreated" });

/** Collections on the current instance, newest first. Collections have no owner: any work may name any. */
export async function readCollections(): Promise<{ id: bigint; name: string }[]> {
  const logs = await scanLogs({ address: getStreamInstance().addresses.stream, event: COLLECTION_CREATED });
  return logs
    .map((log) => ({ id: log.args.collectionId, name: log.args.name }))
    .sort((a, b) => (a.id > b.id ? -1 : 1));
}

/** Creates the collection through the gate, unless the artist picked an existing one. */
export async function ensureCollection(context: CuratedWorkContext, io: CreateIo): Promise<boolean> {
  if (context.collectionId !== null) return false;
  const name = context.newCollectionName.trim();
  const receipt = await io.send(
    streamTx({
      address: gate(),
      abi: openGateAbi,
      functionName: "createCollection",
      args: [name, keccak256(toBytes(name))],
    })
  );
  const created = parseEventLogs({ abi: streamAbi, logs: receipt.logs, eventName: "CollectionCreated" })[0];
  if (!created) throw new Error("no CollectionCreated");
  context.collectionId = created.args.collectionId;
  return true;
}

/** The work's item and package root, rebuilt from its files and the gate's pure helper. */
async function prepareCuratedItem(context: CuratedWorkContext, artist: Address) {
  if (context.collectionId === null) throw new Error("no collection yet");
  context.primaryFileId ??= await fileIdOf(context.media);
  context.recordFileId ??= await fileIdOf(context.record);
  const draft = {
    artist,
    collectionId: context.collectionId,
    contentHash: context.media.sha256,
    primaryFileId: context.primaryFileId,
    recordFileId: context.recordFileId,
    cc0TextFileId: await cc0TextFileId(),
    edition: context.editionCap === null ? undefined : { maxCount: context.editionCap },
  };
  context.item = buildItem(draft);
  context.mediaList = mediaListOf(draft);
  const [itemHash, packageRoot] = await getStreamClient().readContract({
    address: gate(),
    abi: openGateAbi,
    functionName: "oneItemPackage",
    args: [context.item],
  });
  context.itemHash = itemHash;
  context.packageRoot = packageRoot;
  return { item: context.item, mediaList: context.mediaList, itemHash, packageRoot };
}

async function ensurePrepared(context: CuratedWorkContext, artist: Address) {
  if (context.item && context.mediaList && context.itemHash && context.packageRoot) {
    return { item: context.item, mediaList: context.mediaList, itemHash: context.itemHash, packageRoot: context.packageRoot };
  }
  return prepareCuratedItem(context, artist);
}

const PACKAGE_APPROVED = 1;

/** Registers the one-item package with the gate's attestation. Anyone may have done it first. */
export async function registerCuratedPackage(context: CuratedWorkContext, io: CreateIo): Promise<boolean> {
  const { packageRoot } = await ensurePrepared(context, io.account);
  const client = getStreamClient();
  const registry = getStreamInstance().addresses.packageRegistry;
  const existing = await client.readContract({
    address: registry,
    abi: packageRegistryAbi,
    functionName: "packageOf",
    args: [packageRoot],
  });
  if (existing[0] === PACKAGE_APPROVED) return false;
  const [evidenceHash, attestation] = await client.readContract({
    address: gate(),
    abi: openGateAbi,
    functionName: "attestationOf",
    args: [packageRoot],
  });
  try {
    await io.send(
      streamTx({
        address: registry,
        abi: packageRegistryAbi,
        functionName: "registerPackage",
        args: [packageRoot, evidenceHash, attestation],
      })
    );
  } catch (error) {
    // Someone registered the same root in between: that is the result we wanted.
    if (isRevert(error, "PackageExists")) return false;
    throw error;
  }
  return true;
}

/** The profile fields an account repeats on every acceptance: stored ones if it has an account. */
async function profileFieldsOf(account: Address): Promise<{ profileId: Hex; profileDocHash: Hex }> {
  const client = getStreamClient();
  const accounts = getStreamInstance().addresses.accounts;
  const artistId = await client.readContract({ address: accounts, abi: accountsAbi, functionName: "artistIdOf", args: [account] });
  if (artistId === 0n) return { profileId: profileIdOf(account), profileDocHash: profileDocHashOf(account) };
  const [identity] = await client.readContract({ address: accounts, abi: accountsAbi, functionName: "artist", args: [artistId] });
  return { profileId: identity.profileId, profileDocHash: identity.profileDocHash };
}

/** Thrown when the page's typed data would not produce the digest the contract checks. */
class DigestMismatchError extends Error {
  constructor(what: string) {
    super(`${what}: the page's typed data does not match the contract's digest`);
    this.name = "DigestMismatchError";
  }
}

/** The artist accepts the package: one signature, then the transaction. */
export async function acceptCuratedPackage(context: CuratedWorkContext, io: SigningIo): Promise<boolean> {
  const { packageRoot } = await ensurePrepared(context, io.account);
  const client = getStreamClient();
  const registry = getStreamInstance().addresses.packageRegistry;
  const accepted = await client.readContract({
    address: registry,
    abi: packageRegistryAbi,
    functionName: "acceptedAs",
    args: [packageRoot, io.account],
  });
  if (accepted !== 0n) return false;
  const acceptance: PackageAcceptance = {
    account: io.account,
    ...(await profileFieldsOf(io.account)),
    deadline: deadlineFromNow(),
  };
  const typedData = acceptanceTypedData(registry, packageRoot, acceptance);
  const expected = await client.readContract({
    address: registry,
    abi: packageRegistryAbi,
    functionName: "acceptanceDigest",
    args: [packageRoot, acceptance],
  });
  if (hashTypedData(typedData) !== expected) throw new DigestMismatchError("PackageAcceptance");
  const signature = await io.signTypedData(typedData);
  await io.send(
    streamTx({
      address: registry,
      abi: packageRegistryAbi,
      functionName: "acceptPackage",
      args: [packageRoot, acceptance, walletProof(io.account, signature)],
    })
  );
  return true;
}

async function nextMoveNonce(artistId: bigint): Promise<bigint> {
  const client = getStreamClient();
  const registry = getStreamInstance().addresses.packageRegistry;
  for (let nonce = 0n; nonce < MAX_MOVE_NONCE; nonce++) {
    const used = await client.readContract({
      address: registry,
      abi: packageRegistryAbi,
      functionName: "isMoveNonceUsed",
      args: [artistId, nonce],
    });
    if (!used) return nonce;
  }
  throw new Error("no unused move nonce");
}

async function mintedTokenOf(context: CuratedWorkContext): Promise<bigint> {
  return getStreamClient().readContract({
    address: getStreamInstance().addresses.stream,
    abi: streamAbi,
    functionName: "tokenOfContent",
    args: [context.media.sha256],
  });
}

/** The artist signs the move; the starter then mints the work into the auction and opens its record. */
export async function startCuratedSale(context: CuratedWorkContext, io: SigningIo): Promise<boolean> {
  const { item, mediaList, itemHash, packageRoot } = await ensurePrepared(context, io.account);
  const minted = await mintedTokenOf(context);
  if (minted > 0n) {
    context.tokenId = minted;
    return false;
  }
  const instance = getStreamInstance();
  const client = getStreamClient();
  const nonce = await nextMoveNonce(BigInt(io.account));
  const move = { packageRoot, itemHash, nonce, deadline: deadlineFromNow() };
  const typedData = moveTypedData(instance.addresses.packageRegistry, move);
  const expected = await client.readContract({
    address: instance.addresses.packageRegistry,
    abi: packageRegistryAbi,
    functionName: "moveDigest",
    args: [packageRoot, itemHash, nonce, move.deadline],
  });
  if (hashTypedData(typedData) !== expected) throw new DigestMismatchError("MoveToStream");
  const signature = await io.signTypedData(typedData);
  const request = encodeStreamMint({
    packageRoot,
    item,
    proof: [],
    nonce,
    deadline: move.deadline,
    signature: walletProof(io.account, signature),
  });
  const receipt = await io.send(
    streamTx({
      address: instance.addresses.saleStarter,
      abi: saleStarterAbi,
      functionName: "start",
      args: [instance.addresses.englishAuction, instance.addresses.stream, request, mediaList],
    })
  );
  const tokenId = tokenIdFromStart(receipt, instance.addresses.stream);
  if (tokenId === null) throw new Error("no SaleStarted");
  context.tokenId = tokenId;
  return true;
}

async function ensureCuratedStarted(context: CuratedWorkContext, artist: Address) {
  const prepared = await ensurePrepared(context, artist);
  if (context.tokenId === undefined) {
    const minted = await mintedTokenOf(context);
    if (minted === 0n) throw new Error("the sale has not started");
    context.tokenId = minted;
  }
  return { ...prepared, tokenId: context.tokenId };
}

/** Opens the edition sale beside the 1/1 (edition masters only). Anyone may send it. */
export async function openCuratedEdition(context: CuratedWorkContext, io: CreateIo): Promise<boolean> {
  if (context.editionCap === null) return false;
  const { item, mediaList, packageRoot, tokenId } = await ensureCuratedStarted(context, io.account);
  const instance = getStreamInstance();
  const saleId = saleIdOf(instance.addresses.streamEditions, tokenId);
  if (await editionSaleExists(instance.addresses.editionAuction, saleId)) return false;
  await io.send(
    streamTx({
      address: instance.addresses.editionAuction,
      abi: editionAuctionAbi,
      functionName: "open",
      args: [
        instance.addresses.streamEditions,
        tokenId,
        encodeEditionOpenData({ item, media: mediaList, packageRoot, proof: [] }, true),
      ],
    })
  );
  return true;
}

/** The starter opened the record; this marks the media complete on chain so wallets show the art. */
export async function completeCuratedRecord(context: CuratedWorkContext, io: CreateIo): Promise<boolean> {
  const { item, mediaList, tokenId } = await ensureCuratedStarted(context, io.account);
  const instance = getStreamInstance();
  const facts = await getStreamClient().readContract({
    address: instance.addresses.workFacts,
    abi: workFactsAbi,
    functionName: "factsOf",
    args: [instance.addresses.stream, tokenId],
  });
  let sent = false;
  if (!facts.opened) {
    await io.send(
      streamTx({
        address: instance.addresses.workFacts,
        abi: workFactsAbi,
        functionName: "open",
        args: [instance.addresses.stream, tokenId, item, mediaList],
      })
    );
    sent = true;
  }
  if (!facts.onChainComplete) {
    await io.send(
      streamTx({
        address: instance.addresses.workFacts,
        abi: workFactsAbi,
        functionName: "markOnChainComplete",
        args: [instance.addresses.stream, tokenId],
      })
    );
    sent = true;
  }
  return sent;
}
