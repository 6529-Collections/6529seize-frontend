import type { MessageKey } from "@/i18n/messages";
import type { EtherscanPageTarget, EtherscanRouteOnlyKind } from "./types";

type RouteDefinition = EtherscanPageTarget & {
  readonly kind: EtherscanRouteOnlyKind;
};

const list = (
  titleKey: MessageKey,
  descriptionKey: MessageKey = "linkPreview.etherscan.description.list"
): RouteDefinition => ({ kind: "list", titleKey, descriptionKey });

const analytics = (
  titleKey: MessageKey,
  descriptionKey: MessageKey = "linkPreview.etherscan.description.analytics"
): RouteDefinition => ({ kind: "analytics", titleKey, descriptionKey });

const tool = (
  titleKey: MessageKey,
  descriptionKey: MessageKey = "linkPreview.etherscan.description.tool"
): RouteDefinition => ({ kind: "tool", titleKey, descriptionKey });

const page = (
  titleKey: MessageKey,
  descriptionKey: MessageKey = "linkPreview.etherscan.description.page"
): RouteDefinition => ({ kind: "page", titleKey, descriptionKey });

const ROUTES: Readonly<Partial<Record<string, RouteDefinition>>> = {
  "/txs": list("linkPreview.etherscan.page.transactions"),
  "/txspending": list("linkPreview.etherscan.page.pendingTransactions"),
  "/txsinternal": list("linkPreview.etherscan.page.internalTransactions"),
  "/txcrosschain": list("linkPreview.etherscan.page.crossChainTransactions"),
  "/txsbeacondeposit": list("linkPreview.etherscan.page.beaconDeposits"),
  "/txsbeaconwithdrawal": list("linkPreview.etherscan.page.beaconWithdrawals"),
  "/txsblobs": list("linkPreview.etherscan.page.blobTransactions"),
  "/txsaa": list("linkPreview.etherscan.page.aaTransactions"),
  "/txsaabundle": list("linkPreview.etherscan.page.aaBundles"),
  "/txnauthlist": list("linkPreview.etherscan.page.authorizations"),
  "/advanced-filter": list("linkPreview.etherscan.page.advancedFilter"),
  "/blocks": list("linkPreview.etherscan.page.blocks"),
  "/blocks_forked": list("linkPreview.etherscan.page.forkedBlocks"),
  "/uncles": list("linkPreview.etherscan.page.uncles"),
  "/accounts": list("linkPreview.etherscan.page.accounts"),
  "/contractsverified": list("linkPreview.etherscan.page.verifiedContracts"),
  "/tokens": list("linkPreview.etherscan.page.tokens"),
  "/tokentxns": list("linkPreview.etherscan.page.tokenTransfers"),
  "/nft-top-contracts": list("linkPreview.etherscan.page.topNftContracts"),
  "/nft-top-mints": list("linkPreview.etherscan.page.topNftMints"),
  "/nft-trades": list("linkPreview.etherscan.page.nftTrades"),
  "/nft-transfers": list("linkPreview.etherscan.page.nftTransfers"),
  "/nft-latest-mints": list("linkPreview.etherscan.page.latestNftMints"),
  "/charts": analytics("linkPreview.etherscan.page.charts"),
  "/stat/supply": analytics("linkPreview.etherscan.page.supply"),
  "/gastracker": analytics("linkPreview.etherscan.page.gasTracker"),
  "/dex": analytics("linkPreview.etherscan.page.dexTracker"),
  "/nodetracker": analytics("linkPreview.etherscan.page.nodeTracker"),
  "/inputdataencoder": tool("linkPreview.etherscan.page.inputEncoder"),
  "/inputdatadecoder": tool("linkPreview.etherscan.page.inputDecoder"),
  "/tx-decoder": tool("linkPreview.etherscan.page.transactionDecoder"),
  "/code-reader": tool("linkPreview.etherscan.page.codeReader"),
  "/verifycontract": tool("linkPreview.etherscan.page.verifyContract"),
  "/find-similar-contracts": tool(
    "linkPreview.etherscan.page.similarContracts"
  ),
  "/searchcontract": tool("linkPreview.etherscan.page.contractSearch"),
  "/contractdiffchecker": tool("linkPreview.etherscan.page.contractDiff"),
  "/bytecode-decompiler": tool("linkPreview.etherscan.page.decompiler"),
  "/proxycontractchecker": tool("linkPreview.etherscan.page.proxyChecker"),
  "/contract-license-types": tool(
    "linkPreview.etherscan.page.licenseReference"
  ),
  "/solcbuginfo": tool("linkPreview.etherscan.page.solidityBugs"),
  "/vyper": tool("linkPreview.etherscan.page.vyper"),
  "/opcode-tool": tool("linkPreview.etherscan.page.opcode"),
  "/pushtx": tool("linkPreview.etherscan.page.broadcast"),
  "/getrawtx": tool("linkPreview.etherscan.page.rawTransaction"),
  "/vmtrace": tool("linkPreview.etherscan.page.vmTrace"),
  "/viewsvg": tool("linkPreview.etherscan.page.svgViewer"),
  "/api": tool("linkPreview.etherscan.page.api"),
  "/exportdata": tool("linkPreview.etherscan.page.export"),
  "/balancecheck-tool": tool("linkPreview.etherscan.page.balanceChecker"),
  "/unitconverter": tool("linkPreview.etherscan.page.unitConverter"),
  "/base64converter": tool("linkPreview.etherscan.page.base64Converter"),
  "/blockdateconverter": tool("linkPreview.etherscan.page.blockDateConverter"),
  "/utf8converter": tool("linkPreview.etherscan.page.utf8Converter"),
  "/methodidconverter": tool("linkPreview.etherscan.page.methodConverter"),
  "/tokenapprovalchecker": tool("linkPreview.etherscan.page.approvalChecker"),
  "/tokencheck-tool": tool("linkPreview.etherscan.page.tokenChecker"),
  "/tokentracker": tool("linkPreview.etherscan.page.tokenTracker"),
  "/verifiedsignatures": tool("linkPreview.etherscan.page.signatures"),
  "/idm": tool("linkPreview.etherscan.page.idm"),
  "/name-lookup": tool("linkPreview.etherscan.page.nameLookup"),
  "/name-lookup-search": tool("linkPreview.etherscan.page.nameLookup"),
  "/leaderboard": page("linkPreview.etherscan.page.leaderboard"),
  "/directory": page("linkPreview.etherscan.page.directory"),
  "/labelcloud": page("linkPreview.etherscan.page.labelCloud"),
  "/login": page("linkPreview.etherscan.page.login"),
  "/myaddress": page("linkPreview.etherscan.page.myAddress"),
  "/mynotes_address": page("linkPreview.etherscan.page.privateNotes"),
  "/mynotes_tx": page("linkPreview.etherscan.page.privateNotes"),
  "/settings": page("linkPreview.etherscan.page.settings"),
  "/premium-account": page("linkPreview.etherscan.page.premium"),
  "/priority-support": page("linkPreview.etherscan.page.support"),
  "/aboutus": page("linkPreview.etherscan.page.about"),
  "/careers": page("linkPreview.etherscan.page.careers"),
  "/contactus": page("linkPreview.etherscan.page.contact"),
  "/contactusadvertise": page("linkPreview.etherscan.page.advertise"),
  "/brandassets": page("linkPreview.etherscan.page.brand"),
  "/explorer-as-a-service-eaas": page("linkPreview.etherscan.page.eaas"),
  "/terms": page("linkPreview.etherscan.page.terms"),
  "/privacypolicy": page("linkPreview.etherscan.page.privacy"),
  "/bugbounty": page("linkPreview.etherscan.page.bugBounty"),
};

const PREFIX_ROUTES: readonly [prefix: string, definition: RouteDefinition][] =
  [
    ["/txs/label/", list("linkPreview.etherscan.page.labeledTransactions")],
    ["/accounts/label/", list("linkPreview.etherscan.page.labeledAccounts")],
    ["/blocks/label/", list("linkPreview.etherscan.page.labeledBlocks")],
    ["/tokens/label/", list("linkPreview.etherscan.page.labeledTokens")],
    ["/chart/", analytics("linkPreview.etherscan.page.chart")],
    ["/leaderboard/", page("linkPreview.etherscan.page.leaderboard")],
    ["/directory/", page("linkPreview.etherscan.page.directory")],
    ["/dex/", analytics("linkPreview.etherscan.page.dexTracker")],
    ["/nodetracker/", analytics("linkPreview.etherscan.page.nodeTracker")],
    ["/api/", tool("linkPreview.etherscan.page.api")],
  ];

const UNKNOWN_ETHERSCAN_PAGE = page(
  "linkPreview.etherscan.page.generic",
  "linkPreview.etherscan.description.unknown"
);

export function getEtherscanRouteDefinition(pathname: string): RouteDefinition {
  const normalizedPath = pathname.toLowerCase();
  const exact = ROUTES[normalizedPath];
  if (exact !== undefined) {
    return exact;
  }

  return (
    PREFIX_ROUTES.find(([prefix]) => normalizedPath.startsWith(prefix))?.[1] ??
    UNKNOWN_ETHERSCAN_PAGE
  );
}
