import { ens_normalize } from "@adraffy/ens-normalize";
import { getAddress, isAddress } from "viem";

import { getCanonicalEtherscanHost, getEtherscanNetwork } from "./hosts";
import { getEtherscanRouteDefinition } from "./routes";
import type {
  EtherscanContext,
  EtherscanEntityKind,
  EtherscanPageTarget,
  EtherscanTarget,
  EtherscanTargetKind,
} from "./types";

const MAX_URL_LENGTH = 4096;
const MAX_PATH_SEGMENTS = 16;
const MAX_DECODED_SEGMENT_LENGTH = 256;
const MAX_QUERY_KEYS = 24;
const MAX_QUERY_KEY_LENGTH = 64;
const MAX_QUERY_VALUE_LENGTH = 512;
const MAX_NUMERIC_ID_LENGTH = 78;
const HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/;
const CONTROL_OR_BIDI_PATTERN =
  /[\u0000-\u001f\u007f\u200e\u200f\u202a-\u202e\u2066-\u2069]/;
const STATIC_PREFIXES = ["/assets/", "/images/", "/cdn-cgi/"] as const;
const TRACKING_KEYS = new Set([
  "fbclid",
  "gclid",
  "ref",
  "source",
  "utm_campaign",
  "utm_content",
  "utm_medium",
  "utm_source",
  "utm_term",
]);

const TRANSACTION_FRAGMENT_KEYS = {
  blobs: "linkPreview.etherscan.context.blobs",
  eventlog: "linkPreview.etherscan.context.eventLog",
  statechange: "linkPreview.etherscan.context.stateChanges",
} as const;

const ADDRESS_FRAGMENT_KEYS = {
  internaltx: "linkPreview.etherscan.context.internalTransactions",
  tokentxns: "linkPreview.etherscan.context.tokenTransfers",
  nfttransfers: "linkPreview.etherscan.context.nftTransfers",
  code: "linkPreview.etherscan.context.contractCode",
  readcontract: "linkPreview.etherscan.context.readContract",
  writecontract: "linkPreview.etherscan.context.writeContract",
  events: "linkPreview.etherscan.context.events",
  analytics: "linkPreview.etherscan.context.analytics",
  assets: "linkPreview.etherscan.context.assets",
  cards: "linkPreview.etherscan.context.cards",
  comments: "linkPreview.etherscan.context.comments",
} as const;

const TOKEN_FRAGMENT_KEYS = {
  balances: "linkPreview.etherscan.context.balances",
  transfers: "linkPreview.etherscan.context.transfers",
  inventory: "linkPreview.etherscan.context.inventory",
  analytics: "linkPreview.etherscan.context.analytics",
  comments: "linkPreview.etherscan.context.comments",
  contract: "linkPreview.etherscan.context.contract",
} as const;

class EtherscanParseError extends Error {}

function safeDecode(value: string): string {
  try {
    const decoded = decodeURIComponent(value);
    if (
      decoded.length > MAX_DECODED_SEGMENT_LENGTH ||
      CONTROL_OR_BIDI_PATTERN.test(decoded)
    ) {
      throw new EtherscanParseError("Unsafe Etherscan URL segment");
    }
    return decoded;
  } catch (error) {
    if (error instanceof EtherscanParseError) {
      throw error;
    }
    throw new EtherscanParseError("Malformed Etherscan URL encoding");
  }
}

function normalizeHash(value: string): string | null {
  return HASH_PATTERN.test(value) ? value.toLowerCase() : null;
}

function normalizeAddress(value: string): string | null {
  return isAddress(value) ? getAddress(value) : null;
}

function normalizeNumericId(value: string): string | null {
  if (
    !/^\d+$/.test(value) ||
    value.length > MAX_NUMERIC_ID_LENGTH ||
    BigInt(value) < 0n
  ) {
    return null;
  }
  return BigInt(value).toString(10);
}

function normalizeTokenId(value: string): string | null {
  const decimal = normalizeNumericId(value);
  if (decimal !== null) {
    return decimal;
  }
  if (!/^0x[0-9a-fA-F]{1,64}$/.test(value)) {
    return null;
  }
  return BigInt(value).toString(10);
}

function normalizeEnsName(value: string): string | null {
  if (!/\.eth$/i.test(value)) {
    return null;
  }
  try {
    return ens_normalize(value);
  } catch {
    return null;
  }
}

function normalizeAddressOrEns(value: string): string | null {
  return normalizeAddress(value) ?? normalizeEnsName(value);
}

function removeTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 1 && value[end - 1] === "/") {
    end -= 1;
  }
  return value.slice(0, end);
}

function validateUrlShape(url: URL): void {
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port !== "" && url.port !== "443")
  ) {
    throw new EtherscanParseError("Unsupported Etherscan URL");
  }

  const queryEntries = Array.from(url.searchParams.entries());
  if (queryEntries.length > MAX_QUERY_KEYS) {
    throw new EtherscanParseError("Too many Etherscan query parameters");
  }

  for (const [key, value] of queryEntries) {
    if (
      key.length > MAX_QUERY_KEY_LENGTH ||
      value.length > MAX_QUERY_VALUE_LENGTH ||
      CONTROL_OR_BIDI_PATTERN.test(key) ||
      CONTROL_OR_BIDI_PATTERN.test(value)
    ) {
      throw new EtherscanParseError("Unsafe Etherscan query parameter");
    }
  }
}

function getPathSegments(url: URL): string[] {
  const rawSegments = url.pathname.split("/").filter(Boolean);
  if (rawSegments.length > MAX_PATH_SEGMENTS) {
    throw new EtherscanParseError("Too many Etherscan URL segments");
  }
  return rawSegments.map(safeDecode);
}

function getSingleIdentityParam(
  url: URL,
  keys: readonly string[],
  normalize: (value: string) => string | null
): string | null {
  const values = keys.flatMap((key) => url.searchParams.getAll(key));
  if (values.length === 0) {
    return null;
  }

  const normalized = values.map(normalize);
  if (normalized.includes(null)) {
    throw new EtherscanParseError("Invalid Etherscan identity parameter");
  }

  const [first] = normalized;
  if (
    first === null ||
    first === undefined ||
    normalized.some((value) => value?.toLowerCase() !== first.toLowerCase())
  ) {
    throw new EtherscanParseError("Conflicting Etherscan identity parameters");
  }
  return first;
}

function getFragmentContext(
  url: URL,
  kind: EtherscanTargetKind
): EtherscanContext | null {
  if (!url.hash) {
    return null;
  }

  const fragment = safeDecode(url.hash.slice(1)).toLowerCase();
  const source = getFragmentLabels(kind);
  const labelKey = source?.[fragment];
  if (labelKey === undefined) {
    return null;
  }

  return {
    kind: "tab",
    labelKey,
  };
}

function getFragmentLabels(
  kind: EtherscanTargetKind
): Readonly<Partial<Record<string, EtherscanContext["labelKey"]>>> | null {
  switch (kind) {
    case "transaction":
      return TRANSACTION_FRAGMENT_KEYS;
    case "address":
      return ADDRESS_FRAGMENT_KEYS;
    case "token":
    case "nft":
      return TOKEN_FRAGMENT_KEYS;
    case "block":
    case "uncle":
    case "blob":
    case "signature":
    case "list":
    case "analytics":
    case "tool":
    case "page":
      return null;
  }
}

function buildCanonicalUrl(url: URL): string {
  const canonical = new URL(url.toString());
  canonical.hostname = getCanonicalEtherscanHost(url.hostname);
  canonical.username = "";
  canonical.password = "";
  canonical.port = "";

  const sortedEntries = Array.from(canonical.searchParams.entries())
    .filter(([key]) => !TRACKING_KEYS.has(key.toLowerCase()))
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      const keyOrder = leftKey.localeCompare(rightKey);
      return keyOrder === 0 ? leftValue.localeCompare(rightValue) : keyOrder;
    });
  canonical.search = "";
  for (const [key, value] of sortedEntries) {
    canonical.searchParams.append(key, value);
  }

  if (canonical.pathname.length > 1) {
    canonical.pathname = removeTrailingSlashes(canonical.pathname);
  }
  return canonical.toString();
}

function buildTarget(options: {
  readonly url: URL;
  readonly kind: EtherscanTargetKind;
  readonly routeFamily: string;
  readonly identifier?: string | undefined;
  readonly secondaryIdentifier?: string | undefined;
  readonly contexts?: readonly EtherscanContext[] | undefined;
  readonly page?: EtherscanPageTarget | undefined;
}): EtherscanTarget {
  const network = getEtherscanNetwork(options.url.hostname);
  if (!network) {
    throw new EtherscanParseError("Unknown Etherscan host");
  }

  const contexts = [...(options.contexts ?? [])];
  const fragmentContext = getFragmentContext(options.url, options.kind);
  if (fragmentContext) {
    contexts.push(fragmentContext);
  }

  const identity = [
    options.identifier?.toLowerCase() ?? options.routeFamily,
    options.secondaryIdentifier?.toLowerCase() ?? "",
  ].join(":");
  return {
    provider: "etherscan",
    requestUrl: options.url.toString(),
    canonicalUrl: buildCanonicalUrl(options.url),
    network,
    routeFamily: options.routeFamily,
    kind: options.kind,
    identifier: options.identifier,
    secondaryIdentifier: options.secondaryIdentifier,
    contexts,
    cacheKey: `etherscan:v1:${network.chainId}:${options.kind}:${identity}`,
    page: options.page,
  };
}

function requireIdentity(value: string | null, message: string): string {
  if (value === null) {
    throw new EtherscanParseError(message);
  }
  return value;
}

type EntityPathParser = (
  url: URL,
  segments: readonly string[]
) => EtherscanTarget | null;

function parseTransactionPath(
  url: URL,
  segments: readonly string[]
): EtherscanTarget | null {
  if (segments.length !== 2) {
    return null;
  }
  return buildTarget({
    url,
    kind: "transaction",
    routeFamily: "/tx/{hash}",
    identifier: requireIdentity(
      normalizeHash(segments[1] ?? ""),
      "Invalid transaction hash"
    ),
  });
}

function parseAddressPath(
  url: URL,
  segments: readonly string[]
): EtherscanTarget | null {
  const isAdvanced = segments.length === 3;
  if (
    (segments.length !== 2 && !isAdvanced) ||
    (isAdvanced && segments[2]?.toLowerCase() !== "advanced")
  ) {
    return null;
  }
  return buildTarget({
    url,
    kind: "address",
    routeFamily: isAdvanced
      ? "/address/{address}/advanced"
      : "/address/{address}",
    identifier: requireIdentity(
      normalizeAddressOrEns(segments[1] ?? ""),
      "Invalid address"
    ),
    contexts: isAdvanced
      ? [
          {
            kind: "tool",
            labelKey: "linkPreview.etherscan.context.advanced",
          },
        ]
      : [],
  });
}

function parseTokenPath(
  url: URL,
  segments: readonly string[]
): EtherscanTarget | null {
  if (segments.length !== 2) {
    return null;
  }
  return buildTarget({
    url,
    kind: "token",
    routeFamily: "/token/{contract}",
    identifier: requireIdentity(
      normalizeAddress(segments[1] ?? ""),
      "Invalid token contract"
    ),
    secondaryIdentifier:
      getSingleIdentityParam(
        url,
        ["a"],
        (value) => normalizeAddress(value) ?? normalizeTokenId(value)
      ) ?? undefined,
  });
}

function parseNftPath(
  url: URL,
  segments: readonly string[]
): EtherscanTarget | null {
  if (segments.length !== 3) {
    return null;
  }
  return buildTarget({
    url,
    kind: "nft",
    routeFamily: "/nft/{contract}/{tokenId}",
    identifier: requireIdentity(
      normalizeAddress(segments[1] ?? ""),
      "Invalid NFT contract"
    ),
    secondaryIdentifier: requireIdentity(
      normalizeTokenId(segments[2] ?? ""),
      "Invalid token ID"
    ),
  });
}

function parseBlockPath(
  url: URL,
  segments: readonly string[]
): EtherscanTarget | null {
  if (segments.length === 3 && segments[1]?.toLowerCase() === "countdown") {
    return buildTarget({
      url,
      kind: "block",
      routeFamily: "/block/countdown/{height}",
      identifier: requireIdentity(
        normalizeNumericId(segments[2] ?? ""),
        "Invalid block height"
      ),
      contexts: [
        {
          kind: "countdown",
          labelKey: "linkPreview.etherscan.context.countdown",
        },
      ],
    });
  }
  if (segments.length !== 2) {
    return null;
  }
  const identifier = segments[1] ?? "";
  return buildTarget({
    url,
    kind: "block",
    routeFamily: "/block/{identifier}",
    identifier: requireIdentity(
      normalizeNumericId(identifier) ?? normalizeHash(identifier),
      "Invalid block identifier"
    ),
  });
}

function parseHashEntityPath(
  url: URL,
  segments: readonly string[],
  kind: "uncle" | "blob"
): EtherscanTarget | null {
  if (segments.length !== 2) {
    return null;
  }
  return buildTarget({
    url,
    kind,
    routeFamily: kind === "uncle" ? "/uncle/{hash}" : "/blob/{hash}",
    identifier: requireIdentity(
      normalizeHash(segments[1] ?? ""),
      `Invalid ${kind} hash`
    ),
    secondaryIdentifier:
      kind === "blob"
        ? (getSingleIdentityParam(url, ["bid"], normalizeNumericId) ??
          undefined)
        : undefined,
  });
}

function parseSignaturePath(
  url: URL,
  segments: readonly string[]
): EtherscanTarget | null {
  if (segments.length !== 2) {
    return null;
  }
  return buildTarget({
    url,
    kind: "signature",
    routeFamily: "/verifySig/{id}",
    identifier: requireIdentity(
      normalizeNumericId(segments[1] ?? ""),
      "Invalid signature record"
    ),
  });
}

const ENTITY_PATH_PARSERS: Readonly<Partial<Record<string, EntityPathParser>>> =
  {
    tx: parseTransactionPath,
    address: parseAddressPath,
    token: parseTokenPath,
    nft: parseNftPath,
    block: parseBlockPath,
    uncle: (url, segments) => parseHashEntityPath(url, segments, "uncle"),
    blob: (url, segments) => parseHashEntityPath(url, segments, "blob"),
    verifysig: parseSignaturePath,
  };

function parseEntityPath(
  url: URL,
  segments: readonly string[]
): EtherscanTarget | null {
  const root = segments[0]?.toLowerCase();
  return root ? (ENTITY_PATH_PARSERS[root]?.(url, segments) ?? null) : null;
}

interface QueryDefinition {
  readonly keys: readonly string[];
  readonly labelKey: EtherscanContext["labelKey"];
}

interface TransactionQueryDefinition extends QueryDefinition {
  readonly contextKind: "raw" | "trace" | "decoder";
}

const TRANSACTION_QUERY_BY_PATH: Readonly<
  Partial<Record<string, TransactionQueryDefinition>>
> = {
  "/getrawtx": {
    keys: ["tx"],
    contextKind: "raw",
    labelKey: "linkPreview.etherscan.context.rawTransaction",
  },
  "/vmtrace": {
    keys: ["txhash"],
    contextKind: "trace",
    labelKey: "linkPreview.etherscan.context.executionTrace",
  },
  "/inputdatadecoder": {
    keys: ["tx"],
    contextKind: "decoder",
    labelKey: "linkPreview.etherscan.context.inputDecoder",
  },
  "/tx-decoder": {
    keys: ["tx"],
    contextKind: "decoder",
    labelKey: "linkPreview.etherscan.context.transactionDecoder",
  },
};

const ADDRESS_QUERY_BY_PATH: Readonly<
  Partial<Record<string, QueryDefinition>>
> = {
  "/tokenholdings": {
    keys: ["a"],
    labelKey: "linkPreview.etherscan.context.tokenHoldings",
  },
  "/balancecheck-tool": {
    keys: ["a"],
    labelKey: "linkPreview.etherscan.context.balanceCheck",
  },
  "/tokenapprovalchecker": {
    keys: ["search"],
    labelKey: "linkPreview.etherscan.context.tokenApprovals",
  },
};

const TOKEN_QUERY_BY_PATH: Readonly<Partial<Record<string, QueryDefinition>>> =
  {
    "/tokencheck-tool": {
      keys: ["t"],
      labelKey: "linkPreview.etherscan.context.tokenCheck",
    },
    "/tokentracker": {
      keys: ["contractAddress", "contractaddress", "a"],
      labelKey: "linkPreview.etherscan.context.tokenTracker",
    },
  };

function parseTransactionQuery(
  url: URL,
  pathname: string
): EtherscanTarget | null {
  const definition = TRANSACTION_QUERY_BY_PATH[pathname];
  if (definition === undefined) {
    return null;
  }
  const hash = getSingleIdentityParam(url, definition.keys, normalizeHash);
  return hash
    ? buildTarget({
        url,
        kind: "transaction",
        routeFamily: `${pathname}?tx={hash}`,
        identifier: hash,
        contexts: [
          {
            kind: definition.contextKind,
            labelKey: definition.labelKey,
          },
        ],
      })
    : null;
}

function parseAddressQuery(url: URL, pathname: string): EtherscanTarget | null {
  const definition = ADDRESS_QUERY_BY_PATH[pathname];
  if (definition === undefined) {
    return null;
  }
  const address = getSingleIdentityParam(
    url,
    definition.keys,
    normalizeAddress
  );
  return address
    ? buildTarget({
        url,
        kind: "address",
        routeFamily: `${pathname}?address={address}`,
        identifier: address,
        contexts: [{ kind: "tool", labelKey: definition.labelKey }],
      })
    : null;
}

function parseNameLookupQuery(
  url: URL,
  pathname: string
): EtherscanTarget | null {
  if (pathname !== "/name-lookup-search") {
    return null;
  }
  const name = getSingleIdentityParam(url, ["id"], normalizeEnsName);
  return name
    ? buildTarget({
        url,
        kind: "address",
        routeFamily: "/name-lookup-search?id={name}",
        identifier: name,
        contexts: [
          {
            kind: "tool",
            labelKey: "linkPreview.etherscan.context.nameLookup",
          },
        ],
      })
    : null;
}

function parseTokenQuery(url: URL, pathname: string): EtherscanTarget | null {
  const definition = TOKEN_QUERY_BY_PATH[pathname];
  if (definition === undefined) {
    return null;
  }
  const contract = getSingleIdentityParam(
    url,
    definition.keys,
    normalizeAddress
  );
  return contract
    ? buildTarget({
        url,
        kind: "token",
        routeFamily: `${pathname}?contract={address}`,
        identifier: contract,
        contexts: [{ kind: "tool", labelKey: definition.labelKey }],
      })
    : null;
}

function parseSearchQuery(url: URL, pathname: string): EtherscanTarget | null {
  if (pathname !== "/search") {
    return null;
  }
  const queryValues = url.searchParams.getAll("q");
  const normalizedQueryValues = queryValues.map((value) =>
    value.trim().toLowerCase()
  );
  if (
    normalizedQueryValues.length > 1 &&
    new Set(normalizedQueryValues).size > 1
  ) {
    throw new EtherscanParseError("Conflicting search identity");
  }
  const query = queryValues[0]?.trim();
  if (!query) {
    return null;
  }
  const candidates: readonly [
    normalize: (value: string) => string | null,
    kind: "address" | "transaction" | "block",
    routeFamily: string,
  ][] = [
    [normalizeAddress, "address", "/search?q={address}"],
    [normalizeHash, "transaction", "/search?q={hash}"],
    [normalizeNumericId, "block", "/search?q={height}"],
    [normalizeEnsName, "address", "/search?q={name}"],
  ];
  for (const [normalize, kind, routeFamily] of candidates) {
    const identifier = normalize(query);
    if (identifier) {
      return buildTarget({ url, kind, routeFamily, identifier });
    }
  }
  return null;
}

function parseEntityQuery(url: URL): EtherscanTarget | null {
  const pathname = removeTrailingSlashes(url.pathname.toLowerCase()) || "/";
  return (
    parseTransactionQuery(url, pathname) ??
    parseAddressQuery(url, pathname) ??
    parseNameLookupQuery(url, pathname) ??
    parseTokenQuery(url, pathname) ??
    parseSearchQuery(url, pathname)
  );
}

function parsePageTarget(url: URL): EtherscanTarget {
  const pathname = removeTrailingSlashes(url.pathname) || "/";
  const definition = getEtherscanRouteDefinition(pathname);
  return buildTarget({
    url,
    kind: definition.kind,
    routeFamily: pathname.toLowerCase() || "/",
    page: {
      titleKey: definition.titleKey,
      descriptionKey: definition.descriptionKey,
    },
  });
}

export function parseEtherscanUrl(raw: string | URL): EtherscanTarget | null {
  const rawValue = raw instanceof URL ? raw.toString() : raw.trim();
  if (
    rawValue.length === 0 ||
    rawValue.length > MAX_URL_LENGTH ||
    CONTROL_OR_BIDI_PATTERN.test(rawValue)
  ) {
    return null;
  }

  try {
    const url =
      raw instanceof URL ? new URL(raw.toString()) : new URL(rawValue);
    if (!getEtherscanNetwork(url.hostname)) {
      return null;
    }
    validateUrlShape(url);

    const pathname = url.pathname.toLowerCase();
    if (STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      return null;
    }

    const segments = getPathSegments(url);
    const entityPath = parseEntityPath(url, segments);
    if (entityPath) {
      return entityPath;
    }

    const entityQuery = parseEntityQuery(url);
    if (entityQuery) {
      return entityQuery;
    }

    return parsePageTarget(url);
  } catch {
    return null;
  }
}

export function isEtherscanUrl(raw: string): boolean {
  return parseEtherscanUrl(raw) !== null;
}

export function isEtherscanEntityTarget(
  target: EtherscanTarget
): target is EtherscanTarget & { readonly kind: EtherscanEntityKind } {
  return !["list", "analytics", "tool", "page"].includes(target.kind);
}
