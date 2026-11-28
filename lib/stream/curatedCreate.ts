import {
  BaseError,
  ContractFunctionRevertedError,
  hashTypedData,
  keccak256,
  parseEventLogs,
  sha256,
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
import { artistIdFor } from "./accounts";
import { chainDeadline } from "./chainTime";
import { getStreamClient } from "./client";
import type { StoredFile } from "./content";
import { cc0TextFileId, fileIdOf, tokenIdFromStart, type CreateIo, type SigningIo } from "./create";
import { assertRunWallet, CreateRunError } from "./createErrors";
import { acceptanceTypedData, moveTypedData, type PackageAcceptance } from "./curatedSigning";
import { profileDocHashOf, profileIdOf, walletProof } from "./independent";
import { getStreamInstance } from "./instances";
import {
  buildItem,
  encodeEditionOpenData,
  encodeStreamMint,
  itemHashOf,
  mediaListOf,
  oneItemPackageRoot,
  type MediaFile,
  type PackageItem,
} from "./item";
import { editionSaleExists, saleIdOf } from "./reads";
import { sameAddress } from "./state";
import { streamTx } from "./streamTx";

/**
 * The curated 6529 Stream path on a test instance with an open gate
 * (SepoliaOpenGate, r9 on): anyone creates a collection and registers a
 * package, the artist accepts it and signs the move, and anyone starts the
 * sale. Every step first reads the chain and skips what is done already, so a
 * run resumes after a failure, a lost receipt or (for a new collection) a
 * reload. See 6529-works `script/sepolia/open-gate.md` for the call sequence.
 */
export interface CuratedWorkContext {
  /** The wallet the run was started with. Every step refuses another account. */
  readonly artist: Address;
  readonly media: StoredFile;
  readonly record: StoredFile;
  /** The instance's shared test collection, or null until it is created (once, by the first run). */
  collectionId: bigint | null;
  /** Edition cap (0 = none), or null for a 1/1 only. */
  readonly editionCap: number | null;
  /** The artist's ID in Accounts, read from the chain (an address's own number only for a new account). */
  artistId?: bigint;
  primaryFileId?: Hex;
  recordFileId?: Hex;
  item?: PackageItem;
  mediaList?: MediaFile[];
  itemHash?: Hex;
  packageRoot?: Hex;
  tokenId?: bigint;
}

/** Signatures expire an hour after the chain's latest block. */
const SIGNATURE_LIFETIME_S = 3_600;
/** Move nonces are read 32 at a time (one multicall) from 0 up to this bound. */
const MOVE_NONCE_BATCH = 32n;
const MAX_MOVE_NONCE = 1_024n;

function gate(): Address {
  const address = getStreamInstance().addresses.openGate;
  if (!address) throw new CreateRunError("gateClosed", "this instance has no open gate");
  return address;
}

export function isRevert(error: unknown, name?: string): boolean {
  if (!(error instanceof BaseError)) return false;
  const revert = error.walk((cause) => cause instanceof ContractFunctionRevertedError);
  if (!(revert instanceof ContractFunctionRevertedError)) return false;
  return name === undefined || revert.data?.errorName === name;
}

function assertArtist(context: CuratedWorkContext, account: Address): void {
  assertRunWallet(context.artist, account);
}

async function ensureArtistId(context: CuratedWorkContext): Promise<bigint> {
  context.artistId ??= await artistIdFor(context.artist);
  return context.artistId;
}

/**
 * Every curated work on a test instance goes into one shared collection
 * (collections are a network matter, not the artist's). It is found by this
 * name, and created through the gate only by the first run on an instance.
 */
const SHARED_COLLECTION_NAME = "6529 Stream test works";

/** The shared test collection's ID, or null if nobody has created it yet. Reads the chain, so a reload or lost receipt finds it. */
async function findSharedCollection(): Promise<bigint | null> {
  const client = getStreamClient();
  const stream = getStreamInstance().addresses.stream;
  const count = await client.readContract({ address: stream, abi: streamAbi, functionName: "collectionCount" });
  const ids: bigint[] = [];
  for (let id = count; id >= 1n; id--) ids.push(id);
  const collections = await Promise.all(
    ids.map((id) => client.readContract({ address: stream, abi: streamAbi, functionName: "collectionOf", args: [id] }))
  );
  // IDs are newest first; the oldest match wins if two were ever created at the same moment.
  const matches = ids.filter((_id, at) => collections[at]!.name === SHARED_COLLECTION_NAME);
  return matches.at(-1) ?? null;
}

/**
 * Checks before any paid step: the gate still creates collections and approves
 * packages (the network can close it at once), and the image is not already a
 * work on this instance (a content hash mints once). An image already minted
 * passes only when the same artist minted it, so a resumed run can finish.
 */
export async function curatedPreflight(args: {
  readonly media: StoredFile;
  readonly account: Address;
}): Promise<{ sharedCollectionId: bigint | null }> {
  const client = getStreamClient();
  const instance = getStreamInstance();
  const probeRoot = keccak256(toBytes(`6529 stream page gate check ${args.account}`));
  const [evidenceHash, attestation] = await client.readContract({
    address: gate(),
    abi: openGateAbi,
    functionName: "attestationOf",
    args: [probeRoot],
  });
  const [collectionsOpen, packagesOpen] = await Promise.all([
    client
      .simulateContract({
        address: gate(),
        abi: openGateAbi,
        functionName: "createCollection",
        args: ["gate check", sha256(toBytes("gate check"))],
        account: args.account,
      })
      .then(() => true)
      .catch((error: unknown) => (isRevert(error) ? false : Promise.reject(error))),
    client
      .simulateContract({
        address: instance.addresses.packageRegistry,
        abi: packageRegistryAbi,
        functionName: "registerPackage",
        args: [probeRoot, evidenceHash, attestation],
        account: args.account,
      })
      .then(() => true)
      .catch((error: unknown) => (isRevert(error) ? false : Promise.reject(error))),
  ]);
  if (!collectionsOpen || !packagesOpen) throw new CreateRunError("gateClosed", "the test gate is closed");
  const minted = await client.readContract({
    address: instance.addresses.stream,
    abi: streamAbi,
    functionName: "tokenOfContent",
    args: [args.media.sha256],
  });
  const sharedCollectionId = await findSharedCollection();
  if (minted === 0n) return { sharedCollectionId };
  const work = await client.readContract({ address: instance.addresses.stream, abi: streamAbi, functionName: "workOf", args: [minted] });
  if (work.artistId !== (await artistIdFor(args.account))) {
    throw new CreateRunError("contentMinted", "this image is already a work on this instance");
  }
  return { sharedCollectionId };
}

/** Uses the shared test collection, creating it through the gate only if nobody has yet. */
export async function ensureCollection(context: CuratedWorkContext, io: CreateIo): Promise<boolean> {
  assertArtist(context, io.account);
  if (context.collectionId !== null) return false;
  // Read the chain again: another run (or this one, before a lost receipt or a reload) may have made it.
  const existing = await findSharedCollection();
  if (existing !== null) {
    context.collectionId = existing;
    return false;
  }
  const receipt = await io.send(
    streamTx({
      address: gate(),
      abi: openGateAbi,
      functionName: "createCollection",
      // The gate records this as the hash of a metadata document; the test pages have none,
      // so it is the name's hash (not read on chain).
      args: [SHARED_COLLECTION_NAME, keccak256(toBytes(SHARED_COLLECTION_NAME))],
    })
  );
  const stream = getStreamInstance().addresses.stream;
  const created = parseEventLogs({ abi: streamAbi, logs: receipt.logs, eventName: "CollectionCreated" }).find((log) =>
    sameAddress(log.address, stream)
  );
  if (!created) throw new CreateRunError("failed", "no CollectionCreated");
  context.collectionId = created.args.collectionId;
  return true;
}

/**
 * The work's item, item hash and package root. They are built here from what
 * the page shows; the gate's helper must give the same answer, so the wallet
 * never signs a hash that only an RPC supplied.
 */
async function prepareCuratedItem(context: CuratedWorkContext) {
  if (context.collectionId === null) throw new CreateRunError("failed", "no collection yet");
  context.primaryFileId ??= fileIdOf(context.media);
  context.recordFileId ??= fileIdOf(context.record);
  const draft = {
    artist: context.artist,
    artistId: await ensureArtistId(context),
    collectionId: context.collectionId,
    contentHash: context.media.sha256,
    primaryFileId: context.primaryFileId,
    recordFileId: context.recordFileId,
    cc0TextFileId: await cc0TextFileId(),
    edition: context.editionCap === null ? undefined : { maxCount: context.editionCap },
  };
  const item = buildItem(draft);
  const itemHash = itemHashOf(item);
  const packageRoot = oneItemPackageRoot(itemHash);
  const [gateItemHash, gateRoot] = await getStreamClient().readContract({
    address: gate(),
    abi: openGateAbi,
    functionName: "oneItemPackage",
    args: [item],
  });
  if (gateItemHash !== itemHash || gateRoot !== packageRoot) {
    throw new CreateRunError("digestMismatch", "the gate's item hash differs from the page's");
  }
  context.item = item;
  context.mediaList = mediaListOf(draft);
  context.itemHash = itemHash;
  context.packageRoot = packageRoot;
  return { item, mediaList: context.mediaList, itemHash, packageRoot };
}

async function ensurePrepared(context: CuratedWorkContext, account: Address) {
  assertArtist(context, account);
  if (context.item && context.mediaList && context.itemHash && context.packageRoot) {
    return { item: context.item, mediaList: context.mediaList, itemHash: context.itemHash, packageRoot: context.packageRoot };
  }
  return prepareCuratedItem(context);
}

/** PackageRegistry statuses (`packageOf`): 0 none, 1 approved, 2 revoked (also when the signer's approvals were killed). */
const PACKAGE_STATUS = { NONE: 0, APPROVED: 1 } as const;

async function packageStatus(packageRoot: Hex): Promise<number> {
  const [status] = await getStreamClient().readContract({
    address: getStreamInstance().addresses.packageRegistry,
    abi: packageRegistryAbi,
    functionName: "packageOf",
    args: [packageRoot],
  });
  return status;
}

function requireApproved(status: number): boolean {
  if (status === PACKAGE_STATUS.APPROVED) return true;
  if (status !== PACKAGE_STATUS.NONE) throw new CreateRunError("packageRevoked", "this package was revoked");
  return false;
}

/** Registers the one-item package with the gate's attestation. Anyone may have done it first. */
export async function registerCuratedPackage(context: CuratedWorkContext, io: CreateIo): Promise<boolean> {
  const { packageRoot } = await ensurePrepared(context, io.account);
  if (requireApproved(await packageStatus(packageRoot))) return false;
  const [evidenceHash, attestation] = await getStreamClient().readContract({
    address: gate(),
    abi: openGateAbi,
    functionName: "attestationOf",
    args: [packageRoot],
  });
  try {
    await io.send(
      streamTx({
        address: getStreamInstance().addresses.packageRegistry,
        abi: packageRegistryAbi,
        functionName: "registerPackage",
        args: [packageRoot, evidenceHash, attestation],
      })
    );
  } catch (error) {
    // Someone registered the same root in between: done, if it is approved.
    if (isRevert(error, "PackageExists") && requireApproved(await packageStatus(packageRoot))) return false;
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
    deadline: await chainDeadline(SIGNATURE_LIFETIME_S),
  };
  const typedData = acceptanceTypedData(registry, packageRoot, acceptance);
  const expected = await client.readContract({
    address: registry,
    abi: packageRegistryAbi,
    functionName: "acceptanceDigest",
    args: [packageRoot, acceptance],
  });
  if (hashTypedData(typedData) !== expected) {
    throw new CreateRunError("digestMismatch", "PackageAcceptance typed data does not match the contract");
  }
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

/** The artist's first unused move nonce, read 32 at a time. */
export async function nextMoveNonce(artistId: bigint): Promise<bigint> {
  const client = getStreamClient();
  const registry = getStreamInstance().addresses.packageRegistry;
  for (let start = 0n; start < MAX_MOVE_NONCE; start += MOVE_NONCE_BATCH) {
    const nonces = Array.from({ length: Number(MOVE_NONCE_BATCH) }, (_unused, index) => start + BigInt(index));
    const used = await Promise.all(
      nonces.map((nonce) =>
        client.readContract({ address: registry, abi: packageRegistryAbi, functionName: "isMoveNonceUsed", args: [artistId, nonce] })
      )
    );
    const free = used.indexOf(false);
    if (free !== -1) return nonces[free]!;
  }
  throw new CreateRunError("noNonce", "no unused move nonce");
}

/**
 * The token already minted from this run's item, or 0. A token minted from the
 * same image but another item (another artist, collection or title) is someone
 * else's work: that stops the run instead of being adopted.
 */
async function mintedTokenOf(context: CuratedWorkContext, itemHash: Hex): Promise<bigint> {
  const client = getStreamClient();
  const stream = getStreamInstance().addresses.stream;
  const minted = await client.readContract({ address: stream, abi: streamAbi, functionName: "tokenOfContent", args: [context.media.sha256] });
  if (minted === 0n) return 0n;
  const mintedItem = await client.readContract({ address: stream, abi: streamAbi, functionName: "itemHashOf", args: [minted] });
  if (mintedItem !== itemHash) throw new CreateRunError("contentMinted", "this image is already another work");
  return minted;
}

/** The artist signs the move; the starter then mints the work into the auction and opens its record. */
export async function startCuratedSale(context: CuratedWorkContext, io: SigningIo): Promise<boolean> {
  const { item, mediaList, itemHash, packageRoot } = await ensurePrepared(context, io.account);
  const minted = await mintedTokenOf(context, itemHash);
  if (minted > 0n) {
    context.tokenId = minted;
    return false;
  }
  const instance = getStreamInstance();
  const client = getStreamClient();
  const nonce = await nextMoveNonce(await ensureArtistId(context));
  const move = { packageRoot, itemHash, nonce, deadline: await chainDeadline(SIGNATURE_LIFETIME_S) };
  const typedData = moveTypedData(instance.addresses.packageRegistry, move);
  const expected = await client.readContract({
    address: instance.addresses.packageRegistry,
    abi: packageRegistryAbi,
    functionName: "moveDigest",
    args: [packageRoot, itemHash, nonce, move.deadline],
  });
  if (hashTypedData(typedData) !== expected) {
    throw new CreateRunError("digestMismatch", "MoveToStream typed data does not match the contract");
  }
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
  if (tokenId === null) throw new CreateRunError("failed", "no SaleStarted");
  context.tokenId = tokenId;
  return true;
}

async function ensureCuratedStarted(context: CuratedWorkContext, account: Address) {
  const prepared = await ensurePrepared(context, account);
  if (context.tokenId === undefined) {
    const minted = await mintedTokenOf(context, prepared.itemHash);
    if (minted === 0n) throw new CreateRunError("notStarted", "the sale has not started");
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

async function readFacts(tokenId: bigint) {
  const instance = getStreamInstance();
  return getStreamClient().readContract({
    address: instance.addresses.workFacts,
    abi: workFactsAbi,
    functionName: "factsOf",
    args: [instance.addresses.stream, tokenId],
  });
}

/** The starter opened the record; this marks the media complete on chain so wallets show the art. */
export async function completeCuratedRecord(context: CuratedWorkContext, io: CreateIo): Promise<boolean> {
  const { item, mediaList, tokenId } = await ensureCuratedStarted(context, io.account);
  const instance = getStreamInstance();
  let sent = false;
  if (!(await readFacts(tokenId)).opened) {
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
  // Read again: someone may have completed it in between.
  if (!(await readFacts(tokenId)).onChainComplete) {
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
