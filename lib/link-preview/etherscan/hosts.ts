import type { EtherscanNetwork } from "./types";

const ETHEREUM = {
  chainId: 1,
  key: "ethereum",
  label: "Ethereum",
  status: "current",
} as const satisfies EtherscanNetwork;

const ETHERSCAN_NETWORK_BY_HOST = {
  "etherscan.io": ETHEREUM,
  "www.etherscan.io": ETHEREUM,
  "sepolia.etherscan.io": {
    chainId: 11155111,
    key: "sepolia",
    label: "Sepolia",
    status: "current",
  },
  "hoodi.etherscan.io": {
    chainId: 560048,
    key: "hoodi",
    label: "Hoodi",
    status: "current",
  },
  "ropsten.etherscan.io": {
    chainId: 3,
    key: "ropsten",
    label: "Ropsten",
    status: "legacy",
  },
  "rinkeby.etherscan.io": {
    chainId: 4,
    key: "rinkeby",
    label: "Rinkeby",
    status: "legacy",
  },
  "goerli.etherscan.io": {
    chainId: 5,
    key: "goerli",
    label: "Goerli",
    status: "legacy",
  },
  "kovan.etherscan.io": {
    chainId: 42,
    key: "kovan",
    label: "Kovan",
    status: "legacy",
  },
  "holesky.etherscan.io": {
    chainId: 17000,
    key: "holesky",
    label: "Holesky",
    status: "legacy",
  },
} as const satisfies Readonly<Record<string, EtherscanNetwork>>;

type EtherscanHost = keyof typeof ETHERSCAN_NETWORK_BY_HOST;

function normalizeEtherscanHost(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/, "");
}

export function getEtherscanNetwork(hostname: string): EtherscanNetwork | null {
  const normalized = normalizeEtherscanHost(hostname);
  if (!Object.hasOwn(ETHERSCAN_NETWORK_BY_HOST, normalized)) {
    return null;
  }

  return ETHERSCAN_NETWORK_BY_HOST[normalized as EtherscanHost];
}

export function getCanonicalEtherscanHost(hostname: string): string {
  const normalized = normalizeEtherscanHost(hostname);
  return normalized === "www.etherscan.io" ? "etherscan.io" : normalized;
}
