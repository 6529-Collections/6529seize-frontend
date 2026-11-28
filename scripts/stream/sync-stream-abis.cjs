#!/usr/bin/env node
/**
 * Copies the 6529 Stream (6529-works) contract ABIs the Sepolia test pages
 * use into typed `as const` modules under lib/stream/generated/.
 *
 * Usage: node scripts/stream/sync-stream-abis.cjs <path-to-6529-works-checkout> [instance=r8]
 *          [--record deployments/11155111/<record>.json] [--gate 0x...] [--addresses-only]
 *
 * With --record it also writes the instance's addresses (addresses.ts) from the
 * deployment record, so no address is copied by hand. --gate adds the address of
 * a SepoliaOpenGate (a test-instance contract that is not in the record); its
 * ABI then comes from the checkout's build output (out/SepoliaOpenGate.sol/).
 * --addresses-only writes addresses.ts alone: an older instance is read with the
 * current instance's ABIs (later instances only add functions).
 *
 * The ABIs are taken from the contracts repository's exported `abi/` folder
 * (the edition auctions from `abi/full/`, which merges their lens views), so
 * the contract calls stay type-checked against what is deployed. Re-run it
 * when a new instance changes an ABI.
 *
 * Each ABI is cut down to the functions and events in ABI_ALLOW below, plus
 * every error (viem names a revert only from errors present in the ABI). Add a
 * name there before a page calls a new function or reads a new event, then
 * re-run. Entries are written one per line in the source order.
 */
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const CONTRACTS = [
  ["EnglishAuction", "abi/EnglishAuction.json", "englishAuctionAbi"],
  [
    "UniformEditionAuction",
    "abi/full/UniformEditionAuction.json",
    "editionAuctionAbi",
  ],
  [
    "IndependentEditionAuction",
    "abi/full/IndependentEditionAuction.json",
    "independentEditionAuctionAbi",
  ],
  ["SaleStarter", "abi/SaleStarter.json", "saleStarterAbi"],
  ["ContentStore", "abi/ContentStore.json", "contentStoreAbi"],
  ["Stream6529", "abi/Stream6529.json", "streamAbi"],
  ["StreamEditions6529", "abi/StreamEditions6529.json", "streamEditionsAbi"],
  ["StreamWorkFacts6529", "abi/StreamWorkFacts6529.json", "workFactsAbi"],
  [
    "IndependentStreamRegistry",
    "abi/IndependentStreamRegistry.json",
    "independentRegistryAbi",
  ],
  [
    "IndependentStreamDeployer",
    "abi/IndependentStreamDeployer.json",
    "independentDeployerAbi",
  ],
  ["Accounts", "abi/Accounts.json", "accountsAbi"],
  ["EconomicsResolver", "abi/EconomicsResolver.json", "economicsAbi"],
  ["SplitLedger", "abi/SplitLedger.json", "splitLedgerAbi"],
  ["PackageRegistry", "abi/PackageRegistry.json", "packageRegistryAbi"],
  ["AssetAllowlist", "abi/AssetAllowlist.json", "assetAllowlistAbi"],
];

/**
 * The functions and events the pages use, per contract (overloads of a name
 * are all kept). Errors are always kept in full; constructors, fallbacks and
 * everything else are dropped.
 */
const ABI_ALLOW = {
  Accounts: {
    functions: ["artist", "artistIdOf", "editions", "register", "stream"],
    events: [],
  },
  AssetAllowlist: {
    functions: ["openingBid", "status"],
    events: [],
  },
  ContentStore: {
    functions: ["chunkPointer", "fileInfo", "isComplete", "read", "registerManifest", "writeChunk"],
    events: ["ManifestRegistered"],
  },
  EconomicsResolver: {
    functions: ["assetAllowlist", "cc0TextFileId", "economics", "museum"],
    events: [],
  },
  EnglishAuction: {
    functions: [
      "RESTART_DELAY", "auction", "auctionClock", "bid", "claim", "claimDelivery", "claimable",
      "config", "economics", "minimumBid", "paused", "pendingDelivery", "refusableAt", "restart",
      "sendRescuedToMuseum", "settle", "settleOrRefund", "start", "startWithBid", "stream", "withdrawBid",
    ],
    events: ["BidPlaced", "RescuedSaleClosed", "SaleSettled", "SaleStarted", "SettlementRefused"],
  },
  IndependentStreamDeployer: {
    functions: ["deploy"],
    events: ["Deployed"],
  },
  IndependentStreamRegistry: {
    functions: ["approveItem", "economics", "facts", "itemOf", "listingOf", "listingSubject", "preview", "register"],
    events: [],
  },
  PackageRegistry: {
    functions: [
      "acceptPackage", "acceptanceDigest", "acceptedAs", "cc0TextFileId", "economics", "isMoveNonceUsed",
      "moveDigest", "packageOf", "preview", "registerPackage", "stream",
    ],
    events: [],
  },
  SaleStarter: {
    functions: ["start"],
    events: [],
  },
  SepoliaOpenGate: {
    functions: ["attestationOf", "createCollection", "oneItemPackage", "stream"],
    events: [],
  },
  SplitLedger: {
    functions: ["network", "releasable", "release", "released", "walletFor"],
    events: [],
  },
  Stream6529: {
    functions: [
      "approve", "collectionCount", "collectionOf", "createCollection", "facts", "itemHashOf", "name",
      "ownerOf", "tokenOfContent", "tokenURI", "workOf",
    ],
    events: ["CollectionCreated", "WorkMinted"],
  },
  StreamEditions6529: {
    functions: ["name", "stream"],
    events: [],
  },
  StreamWorkFacts6529: {
    functions: ["cc0TextFileId", "factsOf", "markOnChainComplete", "open"],
    events: [],
  },
};

/** Both edition auctions are read through the same calls. */
const EDITION_AUCTION_ALLOW = {
  functions: [
    "CLOSE_OFFSET", "abandon", "abandonable", "auction", "bid", "bidOutcome", "claim", "claimBid", "claimable",
    "clearing", "config", "economics", "editions", "endTimes", "ladder", "open", "paused", "quote", "raise", "settle",
    "settlementOrderFor", "stepPrice", "stepTotals", "stream",
  ],
  events: ["AuctionCleared", "AuctionOpened", "BidClaimed", "BidPlaced", "BidRaised", "SaleSettled", "SaleStarted"],
};
ABI_ALLOW.UniformEditionAuction = EDITION_AUCTION_ALLOW;
ABI_ALLOW.IndependentEditionAuction = EDITION_AUCTION_ALLOW;

/** Record name -> the key the test pages use. */
const RECORD_ADDRESSES = [
  ["Accounts", "accounts"],
  ["ContentStore", "contentStore"],
  ["EconomicsResolver", "economics"],
  ["EnglishAuction", "englishAuction"],
  ["UniformEditionAuction", "editionAuction"],
  ["IndependentEditionAuction", "independentEditionAuction"],
  ["IndependentStreamRegistry", "independentRegistry"],
  ["IndependentStream721Deployer", "independent721Deployer"],
  ["IndependentStreamEditionsDeployer", "independentEditionsDeployer"],
  ["PackageRegistry", "packageRegistry"],
  ["Renderer", "renderer"],
  ["SaleStarter", "saleStarter"],
  ["SplitFactory", "splitLedger"],
  ["Stream6529", "stream"],
  ["StreamDirectory6529", "streamDirectory"],
  ["StreamEditions6529", "streamEditions"],
  ["StreamWorkFacts6529", "workFacts"],
  ["MuseumVault", "museumVault"],
];

const ADDRESS = /^0x[0-9a-fA-F]{40}$/;

function optionValue(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  const value = args[index + 1];
  if (value === undefined || value.startsWith("--")) throw new Error(`${name} needs a value`);
  return value;
}

/**
 * Writes an instance's addresses.ts from its deployment record.
 * Exported for its unit test (__tests__/scripts/syncStreamAbis.test.ts).
 */
function writeAddresses({ source, record, gate, outDir, commit }) {
  const data = JSON.parse(fs.readFileSync(path.join(source, record), "utf8"));
  if (Number(data.chainId) !== 11155111) throw new Error(`${record} is not a Sepolia record`);
  if (data.confirmed !== true) throw new Error(`${record} is not confirmed`);
  if (data.startBlock === undefined) throw new Error(`${record} has no startBlock`);
  const lines = [];
  for (const [recordName, key] of RECORD_ADDRESSES) {
    const value = data[recordName];
    if (typeof value !== "string" || !ADDRESS.test(value)) {
      throw new Error(`${record} has no address for ${recordName}`);
    }
    lines.push(`  ${key}: "${value}",`);
  }
  if (gate) lines.push(`  openGate: "${gate}",`);
  const body = [
    `// Generated by scripts/stream/sync-stream-abis.cjs from 6529-works ${record} at ${commit}. Do not edit by hand.`,
    `export const startBlock = ${BigInt(data.startBlock).toString()}n;`,
    `export const record = ${JSON.stringify(record)};`,
    `export const sourceCommit = ${JSON.stringify(String(data.sourceCommit ?? ""))};`,
    "export const addresses = {",
    ...lines,
    "} as const;",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(outDir, "addresses.ts"), body);
}

function stripInternalTypes(node) {
  if (Array.isArray(node)) return node.map(stripInternalTypes);
  if (node && typeof node === "object") {
    const out = {};
    for (const [key, value] of Object.entries(node)) {
      if (key === "internalType") continue;
      out[key] = stripInternalTypes(value);
    }
    return out;
  }
  return node;
}

/**
 * Keeps the allowed functions and events and every error, in source order.
 * Throws when an allowed name is missing, so a renamed function fails here
 * rather than at the first call. Exported for its unit test.
 */
function filterAbi(abi, allow, name = "ABI") {
  const keep = new Map([
    ["function", new Set(allow.functions)],
    ["event", new Set(allow.events)],
  ]);
  const found = new Map([
    ["function", new Set()],
    ["event", new Set()],
  ]);
  const kept = abi.filter((entry) => {
    if (entry.type === "error") return true;
    if (!keep.get(entry.type)?.has(entry.name)) return false;
    found.get(entry.type).add(entry.name);
    return true;
  });
  for (const [type, names] of keep) {
    const missing = [...names].filter((wanted) => !found.get(type).has(wanted));
    if (missing.length > 0) throw new Error(`${name} has no ${type} ${missing.join(", ")}`);
  }
  return kept;
}

/** An `as const` array module with one ABI entry per line. Exported for its unit test. */
function formatAbiModule(exportName, abi, header) {
  const lines = abi.map((entry) => `  ${JSON.stringify(entry)},`);
  return [header, `export const ${exportName} = [`, ...lines, "] as const;", ""].join("\n");
}

function main() {
  const source = process.argv[2];
  if (!source) {
    console.error("usage: sync-stream-abis.cjs <6529-works checkout>");
    process.exit(1);
  }
  let commit = "unknown";
  try {
    commit = execFileSync("git", ["-C", source, "rev-parse", "--short=10", "HEAD"])
      .toString()
      .trim();
  } catch {
    // The commit is informational only.
  }
  const args = process.argv.slice(3);
  const instance = args[0] && !args[0].startsWith("--") ? args[0] : "r8";
  const record = optionValue(args, "--record");
  const gate = optionValue(args, "--gate");
  if (gate && !ADDRESS.test(gate)) throw new Error(`--gate ${gate} is not an address`);
  const addressesOnly = args.includes("--addresses-only");
  if (addressesOnly && !record) throw new Error("--addresses-only needs --record");
  const contracts = gate
    ? [...CONTRACTS, ["SepoliaOpenGate", "out/SepoliaOpenGate.sol/SepoliaOpenGate.json", "openGateAbi"]]
    : CONTRACTS;
  const outDir = path.join(__dirname, "..", "..", "lib", "stream", "generated", instance);
  fs.mkdirSync(outDir, { recursive: true });
  for (const [name, file, exportName] of addressesOnly ? [] : contracts) {
    const raw = JSON.parse(fs.readFileSync(path.join(source, file), "utf8"));
    const allow = ABI_ALLOW[name];
    if (!allow) throw new Error(`${name} has no ABI_ALLOW entry`);
    const abi = filterAbi(stripInternalTypes(Array.isArray(raw) ? raw : raw.abi), allow, name);
    const header =
      `// Generated by scripts/stream/sync-stream-abis.cjs from 6529-works ${file}` +
      ` at ${commit} (the functions and events the pages use, and every error). Do not edit by hand.`;
    fs.writeFileSync(path.join(outDir, `${name}.ts`), formatAbiModule(exportName, abi, header));
  }
  if (record) writeAddresses({ source, record, gate, outDir, commit });
  const abiCount = addressesOnly ? 0 : contracts.length;
  console.log(`wrote ${abiCount} ABIs${record ? " and addresses" : ""} from ${commit} to ${outDir}`);
}

if (require.main === module) main();

module.exports = { writeAddresses, filterAbi, formatAbiModule };
