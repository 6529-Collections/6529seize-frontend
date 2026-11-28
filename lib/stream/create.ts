import { accountsAbi, contentStoreAbi, englishAuctionAbi, independentDeployerAbi, independentEditionAuctionAbi, independentRegistryAbi, streamAbi, workFactsAbi } from "./abis";
import {
  BaseError,
  bytesToHex,
  ContractFunctionRevertedError,
  encodeAbiParameters,
  keccak256,
  parseEventLogs,
  type Address,
  type Hex,
  type TransactionReceipt,
} from "viem";

import { chainDeadline } from "./chainTime";
import { artistIdFor } from "./accounts";
import { assertRunWallet, CreateRunError } from "./createErrors";
import { getStreamClient } from "./client";
import { ENCODING_IDENTITY, toStoredFile, type StoredFile } from "./content";
import {
  consentTypedData,
  FORM,
  listingSubject,
  profileDocHashOf,
  profileIdOf,
  registrationTypedData,
  walletProof,
} from "./independent";
import { getStreamInstance } from "./instances";
import { encodeStartFile, START_FILE_MIME } from "./startFile";
import { streamTx, type StreamTxRequest } from "./streamTx";
import {
  buildItem,
  encodeEditionOpenData,
  encodeIndependentMint,
  itemHashOf,
  mediaListOf,
  type MediaFile,
  type PackageItem,
} from "./item";
import { editionSaleExists, saleIdOf } from "./reads";
import { ZERO_ADDRESS } from "./state";

/** What a create step may send. Matches the UI's transaction request shape. */
export interface CreateIo {
  readonly account: Address;
  send(request: StreamTxRequest): Promise<TransactionReceipt>;
}

export interface IndependentWorkContext {
  /** The wallet the run was started with. Every step refuses another account. */
  readonly artist: Address;
  readonly token: Address;
  readonly editionsToken: Address | null;
  readonly media: StoredFile;
  readonly record: StoredFile;
  /** Royalty on later sales, out of 100,000. */
  readonly royaltyRate: number;
  /** Edition cap (0 = none), or null for a 1/1 only. */
  readonly editionCap: number | null;
  artistId?: bigint;
  primaryFileId?: Hex;
  recordFileId?: Hex;
  item?: PackageItem;
  mediaList?: MediaFile[];
  tokenId?: bigint;
}

function manifestOf(file: StoredFile) {
  return [file.chunkHashes, BigInt(file.bytes.length), ENCODING_IDENTITY, file.mimeType, file.sha256] as const;
}

/**
 * A stored file's ID: `ContentStore.manifestId`, a pure hash of its manifest,
 * computed here so the ID that goes into a signed item never comes from an RPC.
 */
export function fileIdOf(file: StoredFile): Hex {
  return keccak256(
    encodeAbiParameters(
      [{ type: "bytes32[]" }, { type: "uint256" }, { type: "uint8" }, { type: "string" }, { type: "bytes32" }],
      manifestOf(file)
    )
  );
}

/** Writes a file's missing chunks and registers its manifest. Returns its file ID and whether anything was sent. */
export async function storeFile(
  file: StoredFile,
  io: CreateIo
): Promise<{ fileId: Hex; sent: boolean }> {
  const client = getStreamClient();
  const store = getStreamInstance().addresses.contentStore;
  let sent = false;
  for (let index = 0; index < file.chunks.length; index++) {
    const pointer = await client.readContract({
      address: store,
      abi: contentStoreAbi,
      functionName: "chunkPointer",
      args: [file.chunkHashes[index]!],
    });
    if (/^0x0{40}$/i.test(pointer)) {
      const data = bytesToHex(file.chunks[index]!);
      await io.send(streamTx({ address: store, abi: contentStoreAbi, functionName: "writeChunk", args: [data] }));
      sent = true;
    }
  }
  const manifest = manifestOf(file);
  const fileId = fileIdOf(file);
  const registered = await client
    .readContract({ address: store, abi: contentStoreAbi, functionName: "fileInfo", args: [fileId] })
    .then(() => true)
    .catch((error: unknown) => {
      // Only the store's own refusal means "not registered"; an RPC failure stops the step.
      if (error instanceof BaseError && error.walk((cause) => cause instanceof ContractFunctionRevertedError)) {
        return false;
      }
      throw error;
    });
  if (!registered) {
    await io.send(streamTx({
      address: store,
      abi: contentStoreAbi,
      functionName: "registerManifest",
      args: manifest,
    }));
    sent = true;
  }
  return { fileId, sent };
}

export function cc0TextFileId(): Promise<Hex> {
  return getStreamClient().readContract({
    address: getStreamInstance().addresses.workFacts,
    abi: workFactsAbi,
    functionName: "cc0TextFileId",
  });
}

/**
 * Builds the work's item from its files. Every step calls it, so a step that
 * runs after a reload rebuilds what earlier steps knew from the chain.
 */
async function prepareIndependentItem(context: IndependentWorkContext, artist: Address) {
  // The payee is the artist's account ID, read from Accounts (not assumed to be the address).
  context.artistId ??= await artistIdFor(artist);
  context.primaryFileId ??= fileIdOf(context.media);
  context.recordFileId ??= fileIdOf(context.record);
  const draft = {
    artist,
    artistId: context.artistId,
    collectionId: 1n,
    contentHash: context.media.sha256,
    primaryFileId: context.primaryFileId,
    recordFileId: context.recordFileId,
    cc0TextFileId: await cc0TextFileId(),
    edition: context.editionCap === null ? undefined : { maxCount: context.editionCap },
  };
  context.item = buildItem(draft);
  context.mediaList = mediaListOf(draft);
}

export async function approveIndependentItem(context: IndependentWorkContext, io: CreateIo): Promise<boolean> {
  assertRunWallet(context.artist, io.account);
  if (!context.item) await prepareIndependentItem(context, io.account);
  const registry = getStreamInstance().addresses.independentRegistry;
  const itemHash = itemHashOf(context.item!);
  const current = await getStreamClient().readContract({
    address: registry,
    abi: independentRegistryAbi,
    functionName: "itemOf",
    args: [context.token, itemHash],
  });
  if (current.used || (current.approved && current.royaltyRate === context.royaltyRate)) return false;
  await io.send(streamTx({
    address: registry,
    abi: independentRegistryAbi,
    functionName: "approveItem",
    args: [context.token, itemHash, context.royaltyRate],
  }));
  return true;
}

/**
 * Stores the start request as a public file, so that anyone can start the sale
 * of the approved work (an approval alone is only a hash). Returns false when
 * the sale already started or the file is already stored.
 */
export async function storeStartFile(context: IndependentWorkContext, io: CreateIo): Promise<boolean> {
  assertRunWallet(context.artist, io.account);
  if (!context.item || !context.mediaList) await prepareIndependentItem(context, io.account);
  const minted = await getStreamClient().readContract({
    address: context.token,
    abi: streamAbi,
    functionName: "tokenOfContent",
    args: [context.media.sha256],
  });
  if (minted > 0n) return false;
  const file = await toStoredFile(encodeStartFile(context.token, context.item!, context.mediaList!), START_FILE_MIME);
  const { sent } = await storeFile(file, io);
  return sent;
}

/** The token a sale start minted, from its SaleStarted log. */
export function tokenIdFromStart(receipt: TransactionReceipt, token: Address): bigint | null {
  const logs = parseEventLogs({ abi: englishAuctionAbi, logs: receipt.logs, eventName: "SaleStarted" });
  const match = logs.find((log) => log.args.token.toLowerCase() === token.toLowerCase());
  return match ? match.args.tokenId : null;
}

/**
 * The token already minted from this run's item in the artist's contract, or 0.
 * A token minted from the same image but another item is a different work:
 * that stops the run instead of being adopted.
 */
async function mintedFromThisItem(context: IndependentWorkContext): Promise<bigint> {
  const client = getStreamClient();
  const minted = await client.readContract({
    address: context.token,
    abi: streamAbi,
    functionName: "tokenOfContent",
    args: [context.media.sha256],
  });
  if (minted === 0n) return 0n;
  // itemHashOf reverts for a burned token; the start then fails with the contract's own error.
  const mintedItem = await client
    .readContract({ address: context.token, abi: streamAbi, functionName: "itemHashOf", args: [minted] })
    .catch(() => null);
  if (mintedItem === null) return 0n;
  if (mintedItem !== itemHashOf(context.item!)) {
    throw new CreateRunError("contentMinted", "this image is already another work in this contract");
  }
  return minted;
}

export async function startIndependentSale(context: IndependentWorkContext, io: CreateIo): Promise<boolean> {
  assertRunWallet(context.artist, io.account);
  if (!context.item || !context.mediaList) await prepareIndependentItem(context, io.account);
  const minted = await mintedFromThisItem(context);
  if (minted > 0n) {
    context.tokenId = minted;
    return false;
  }
  const receipt = await io.send(streamTx({
    address: getStreamInstance().addresses.englishAuction,
    abi: englishAuctionAbi,
    functionName: "start",
    args: [context.token, encodeIndependentMint(context.item!, context.mediaList!)],
  }));
  const tokenId = tokenIdFromStart(receipt, context.token);
  if (tokenId === null) throw new Error("no SaleStarted");
  context.tokenId = tokenId;
  return true;
}

/** The work's item and token, rebuilt from the chain when a step runs after a reload. Throws if the sale never started. */
async function ensureStarted(context: IndependentWorkContext, artist: Address) {
  if (!context.item || !context.mediaList) await prepareIndependentItem(context, artist);
  if (context.tokenId === undefined) {
    const minted = await mintedFromThisItem(context);
    if (minted === 0n) throw new CreateRunError("notStarted", "the sale has not started");
    context.tokenId = minted;
  }
  return { item: context.item!, mediaList: context.mediaList!, tokenId: context.tokenId };
}

export async function openIndependentEdition(context: IndependentWorkContext, io: CreateIo): Promise<boolean> {
  assertRunWallet(context.artist, io.account);
  if (!context.editionsToken) return false;
  const { item, tokenId } = await ensureStarted(context, io.account);
  const address = getStreamInstance().addresses.independentEditionAuction;
  const saleId = saleIdOf(context.editionsToken, tokenId);
  if (await editionSaleExists(address, saleId)) return false;
  await io.send(streamTx({
    address,
    abi: independentEditionAuctionAbi,
    functionName: "open",
    args: [context.editionsToken, tokenId, encodeEditionOpenData({ item, media: [] }, false)],
  }));
  return true;
}

/** Opens the work's on-chain record and marks its media complete, so wallets show the art. */
export async function openWorkRecord(context: IndependentWorkContext, io: CreateIo): Promise<boolean> {
  assertRunWallet(context.artist, io.account);
  const { item, mediaList, tokenId } = await ensureStarted(context, io.account);
  const facts = getStreamInstance().addresses.workFacts;
  const client = getStreamClient();
  let sent = false;
  const current = await client.readContract({
    address: facts,
    abi: workFactsAbi,
    functionName: "factsOf",
    args: [context.token, tokenId],
  });
  if (!current.opened) {
    await io.send(streamTx({
      address: facts,
      abi: workFactsAbi,
      functionName: "open",
      args: [context.token, tokenId, item, mediaList],
    }));
    sent = true;
  }
  if (!current.onChainComplete) {
    await io.send(streamTx({
      address: facts,
      abi: workFactsAbi,
      functionName: "markOnChainComplete",
      args: [context.token, tokenId],
    }));
    sent = true;
  }
  return sent;
}

export interface SigningIo extends CreateIo {
  signTypedData(data: unknown): Promise<Hex>;
}

/** Deploys an artist's own contract and returns its address, from the deployer's Deployed log. */
export async function deployIndependent(args: {
  readonly editions: boolean;
  readonly config: Hex;
  readonly salt: Hex;
  readonly io: CreateIo;
}): Promise<Address> {
  const instance = getStreamInstance();
  const deployer = args.editions
    ? instance.addresses.independentEditionsDeployer
    : instance.addresses.independent721Deployer;
  const receipt = await args.io.send(streamTx({
    address: deployer,
    abi: independentDeployerAbi,
    functionName: "deploy",
    args: [args.salt, args.config],
  }));
  const logs = parseEventLogs({ abi: independentDeployerAbi, logs: receipt.logs, eventName: "Deployed" });
  const token = logs[0]?.args.token;
  if (!token) throw new Error("no Deployed log");
  return token;
}

/**
 * Lists an artist's contract in the Independent Stream module: one or two
 * wallet signatures (the account, if new, and the listing consent), then the
 * register transaction. Returns false when it is already listed.
 */
export async function listIndependent(args: {
  readonly token: Address;
  readonly editions: boolean;
  /** For an editions contract: its 1/1 contract. */
  readonly partner: Address | null;
  readonly io: SigningIo;
}): Promise<boolean> {
  const instance = getStreamInstance();
  const client = getStreamClient();
  const listing = await client.readContract({
    address: instance.addresses.independentRegistry,
    abi: independentRegistryAbi,
    functionName: "listingOf",
    args: [args.token],
  });
  if (listing.status !== 0) return false;
  const account = args.io.account;
  const deadline = await chainDeadline(86_400);
  const artistId = await client.readContract({
    address: instance.addresses.accounts,
    abi: accountsAbi,
    functionName: "artistIdOf",
    args: [account],
  });
  const registration =
    artistId === 0n ? await args.io.signTypedData(registrationTypedData(account, deadline)) : "0x";
  const { subject } = await listingSubject({
    token: args.token,
    form: args.editions ? FORM.ERC1155 : FORM.ERC721,
    partner: args.editions && args.partner ? args.partner : ZERO_ADDRESS,
    deadline,
  });
  const consent = await args.io.signTypedData(consentTypedData(subject));
  await args.io.send(streamTx({
    address: instance.addresses.independentRegistry,
    abi: independentRegistryAbi,
    functionName: "register",
    args: [
      args.token,
      {
        deployer: args.editions
          ? instance.addresses.independentEditionsDeployer
          : instance.addresses.independent721Deployer,
        profileId: profileIdOf(account),
        profileDocHash: profileDocHashOf(account),
        deadline,
        registration,
        consent: walletProof(account, consent),
      },
    ],
  }));
  return true;
}
