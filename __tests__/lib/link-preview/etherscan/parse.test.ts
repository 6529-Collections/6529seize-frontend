import {
  isEtherscanEntityTarget,
  isEtherscanUrl,
  parseEtherscanUrl,
} from "@/lib/link-preview/etherscan/parse";

const ADDRESS = "0x0000000000000000000000000000000000000001";
const HASH = `0x${"a".repeat(64)}`;

describe("parseEtherscanUrl", () => {
  it.each([
    ["https://etherscan.io", 1, "ethereum", "current"],
    ["https://www.etherscan.io", 1, "ethereum", "current"],
    ["https://sepolia.etherscan.io", 11155111, "sepolia", "current"],
    ["https://hoodi.etherscan.io", 560048, "hoodi", "current"],
    ["https://ropsten.etherscan.io", 3, "ropsten", "legacy"],
    ["https://rinkeby.etherscan.io", 4, "rinkeby", "legacy"],
    ["https://goerli.etherscan.io", 5, "goerli", "legacy"],
    ["https://kovan.etherscan.io", 42, "kovan", "legacy"],
    ["https://holesky.etherscan.io", 17000, "holesky", "legacy"],
  ])(
    "maps %s to its correlated network identity",
    (url, chainId, key, status) => {
      expect(parseEtherscanUrl(url)?.network).toEqual(
        expect.objectContaining({ chainId, key, status })
      );
    }
  );

  it.each([
    [`https://etherscan.io/tx/${HASH}`, "transaction", "/tx/{hash}"],
    [
      `https://etherscan.io/address/${ADDRESS}`,
      "address",
      "/address/{address}",
    ],
    [
      `https://etherscan.io/address/${ADDRESS}/advanced`,
      "address",
      "/address/{address}/advanced",
    ],
    [
      `https://etherscan.io/token/${ADDRESS}?a=42#balances`,
      "token",
      "/token/{contract}",
    ],
    [
      `https://etherscan.io/nft/${ADDRESS}/0x2a`,
      "nft",
      "/nft/{contract}/{tokenId}",
    ],
    ["https://etherscan.io/block/123", "block", "/block/{identifier}"],
    [
      "https://etherscan.io/block/countdown/456",
      "block",
      "/block/countdown/{height}",
    ],
    [`https://etherscan.io/uncle/${HASH}`, "uncle", "/uncle/{hash}"],
    [`https://etherscan.io/blob/${HASH}?bid=2`, "blob", "/blob/{hash}"],
    ["https://etherscan.io/verifysig/12", "signature", "/verifySig/{id}"],
  ])("parses entity route %s", (url, kind, routeFamily) => {
    const target = parseEtherscanUrl(url);

    expect(target).toEqual(expect.objectContaining({ kind, routeFamily }));
    expect(target && isEtherscanEntityTarget(target)).toBe(true);
  });

  it.each([
    [`https://etherscan.io/getrawtx?tx=${HASH}`, "transaction"],
    [`https://etherscan.io/vmtrace?txhash=${HASH}`, "transaction"],
    [`https://etherscan.io/inputdatadecoder?tx=${HASH}`, "transaction"],
    [`https://etherscan.io/tx-decoder?tx=${HASH}`, "transaction"],
    [`https://etherscan.io/tokenholdings?a=${ADDRESS}`, "address"],
    [`https://etherscan.io/balancecheck-tool?a=${ADDRESS}`, "address"],
    [`https://etherscan.io/tokenapprovalchecker?search=${ADDRESS}`, "address"],
    ["https://etherscan.io/name-lookup-search?id=vitalik.eth", "address"],
    [`https://etherscan.io/tokencheck-tool?t=${ADDRESS}`, "token"],
    [`https://etherscan.io/tokentracker?contractAddress=${ADDRESS}`, "token"],
    [`https://etherscan.io/search?q=${ADDRESS}`, "address"],
    [`https://etherscan.io/search?q=${HASH}`, "transaction"],
    ["https://etherscan.io/search?q=123456", "block"],
    ["https://etherscan.io/search?q=vitalik.eth", "address"],
  ])("promotes identity-bearing deep link %s to %s", (url, kind) => {
    expect(parseEtherscanUrl(url)?.kind).toBe(kind);
  });

  const LIST_ROUTES = [
    "/txs",
    "/txspending",
    "/txsinternal",
    "/txcrosschain",
    "/txsbeacondeposit",
    "/txsbeaconwithdrawal",
    "/txsblobs",
    "/txsaa",
    "/txsaabundle",
    "/txnauthlist",
    "/advanced-filter",
    "/blocks",
    "/blocks_forked",
    "/uncles",
    "/accounts",
    "/contractsverified",
    "/tokens",
    "/tokentxns",
    "/nft-top-contracts",
    "/nft-top-mints",
    "/nft-trades",
    "/nft-transfers",
    "/nft-latest-mints",
    "/txs/label/exchange",
    "/accounts/label/exchange",
    "/blocks/label/mev",
    "/tokens/label/stablecoin",
  ] as const;

  const ANALYTICS_ROUTES = [
    "/charts",
    "/stat/supply",
    "/gastracker",
    "/dex",
    "/nodetracker",
    "/chart/tx",
    "/dex/uniswap",
    "/nodetracker/nodes",
  ] as const;

  const TOOL_ROUTES = [
    "/inputdataencoder",
    "/inputdatadecoder",
    "/tx-decoder",
    "/code-reader",
    "/verifycontract",
    "/find-similar-contracts",
    "/searchcontract",
    "/contractdiffchecker",
    "/bytecode-decompiler",
    "/proxycontractchecker",
    "/contract-license-types",
    "/solcbuginfo",
    "/vyper",
    "/opcode-tool",
    "/pushtx",
    "/getrawtx",
    "/vmtrace",
    "/viewsvg",
    "/api",
    "/api/contractsVerified",
    "/exportdata",
    "/balancecheck-tool",
    "/unitconverter",
    "/base64converter",
    "/blockdateconverter",
    "/utf8converter",
    "/methodidconverter",
    "/tokenapprovalchecker",
    "/tokencheck-tool",
    "/tokentracker",
    "/verifiedsignatures",
    "/idm",
    "/name-lookup",
    "/name-lookup-search",
  ] as const;

  const PAGE_ROUTES = [
    "/leaderboard",
    "/leaderboard/reputation",
    "/directory",
    "/directory/Contract",
    "/labelcloud",
    "/login",
    "/myaddress",
    "/mynotes_address",
    "/mynotes_tx",
    "/settings",
    "/premium-account",
    "/priority-support",
    "/aboutus",
    "/careers",
    "/contactus",
    "/contactusadvertise",
    "/brandassets",
    "/explorer-as-a-service-eaas",
    "/terms",
    "/privacypolicy",
    "/bugbounty",
  ] as const;

  it.each([
    ...LIST_ROUTES.map((path) => [path, "list"] as const),
    ...ANALYTICS_ROUTES.map((path) => [path, "analytics"] as const),
    ...TOOL_ROUTES.map((path) => [path, "tool"] as const),
    ...PAGE_ROUTES.map((path) => [path, "page"] as const),
  ])("classifies route-only page %s as %s", (path, kind) => {
    const target = parseEtherscanUrl(`https://etherscan.io${path}`);

    expect(target?.kind).toBe(kind);
    expect(target && isEtherscanEntityTarget(target)).toBe(false);
  });

  it("canonicalizes identity, query order, tracking, www, and fragments", () => {
    const target = parseEtherscanUrl(
      `https://www.etherscan.io/token/${ADDRESS.toLowerCase()}/?utm_source=x&a=42#balances`
    );

    expect(target).toEqual(
      expect.objectContaining({
        canonicalUrl: `https://etherscan.io/token/${ADDRESS}?a=42#balances`,
        cacheKey: `etherscan:v1:1:token:${ADDRESS.toLowerCase()}`,
        secondaryIdentifier: "42",
      })
    );
    expect(target?.contexts).toEqual([
      expect.objectContaining({
        labelKey: "linkPreview.etherscan.context.balances",
      }),
    ]);
  });

  it.each([
    "http://etherscan.io/tx/0x1",
    `https://foo.etherscan.io/tx/${HASH}`,
    `https://maliciousetherscan.io/tx/${HASH}`,
    `https://user:pass@etherscan.io/tx/${HASH}`,
    `https://etherscan.io:444/tx/${HASH}`,
    "https://etherscan.io/assets/app.js",
    "https://etherscan.io/images/logo.svg",
    "https://etherscan.io/address/not-an-address",
    "https://etherscan.io/%E0%A4%A",
  ])("rejects unsupported or unsafe URL %s", (url) => {
    expect(parseEtherscanUrl(url)).toBeNull();
    expect(isEtherscanUrl(url)).toBe(false);
  });

  it("rejects conflicting identity query parameters", () => {
    expect(
      parseEtherscanUrl(
        `https://etherscan.io/tokentracker?contractAddress=${ADDRESS}&a=0x0000000000000000000000000000000000000002`
      )
    ).toBeNull();
  });

  it("keeps unknown approved-host routes as safe generic pages", () => {
    expect(
      parseEtherscanUrl("https://etherscan.io/a-new-route?utm_source=waves")
    ).toEqual(
      expect.objectContaining({
        kind: "page",
        page: expect.objectContaining({
          titleKey: "linkPreview.etherscan.page.generic",
        }),
      })
    );
  });
});
