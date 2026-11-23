import type { Address, Hex } from "viem";
import type { RegistryPin } from "@/lib/provenance-core/config/registries";
import {
  signSafeTx,
  type Eip1193Provider,
  type GovernanceSafeTx,
} from "@/lib/provenance-core/governance";

/**
 * The page signs through the connected wallet's own EIP-1193 provider. The site's wallet
 * configuration lists Sepolia only when its testnet flag is set, so the page asks the wallet to
 * switch chains directly instead of going through the site's chain list. Wallets refuse to sign
 * typed data whose domain chain differs from their active chain.
 */

const SEPOLIA_PARAMS = {
  chainId: "0xaa36a7",
  chainName: "Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://ethereum-sepolia-rpc.publicnode.com"],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
} as const;

const CHAIN_NOT_ADDED = 4902;

function errorCode(e: unknown): number | string | undefined {
  if (typeof e !== "object" || e === null) return undefined;
  const o = e as { code?: number | string; cause?: unknown };
  return o.code ?? errorCode(o.cause);
}

export function isUserRejection(e: unknown): boolean {
  const code = errorCode(e);
  const name =
    typeof e === "object" && e !== null
      ? (e as { name?: unknown }).name
      : undefined;
  return (
    code === 4001 || code === "4001" || name === "UserRejectedRequestError"
  );
}

export async function ensureChain(
  provider: Eip1193Provider,
  chainId: number
): Promise<void> {
  const current = Number(await provider.request({ method: "eth_chainId" }));
  if (current === chainId) return;
  const hex = `0x${chainId.toString(16)}`;
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hex }],
    });
  } catch (e) {
    if (errorCode(e) !== CHAIN_NOT_ADDED || chainId !== 11155111) throw e;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [SEPOLIA_PARAMS],
    });
  }
  const after = Number(await provider.request({ method: "eth_chainId" }));
  if (after !== chainId)
    throw new Error(`The wallet is on chain ${after}, not ${chainId}.`);
}

/** Switches the wallet to the pin's chain, then asks it for the owner's SafeTx signature. */
export async function signWithWallet(
  provider: Eip1193Provider,
  signer: Address,
  pin: RegistryPin,
  g: GovernanceSafeTx
): Promise<Hex> {
  await ensureChain(provider, pin.chainId);
  return signSafeTx(provider, signer, pin.chainId, pin.safe, g.tx);
}
