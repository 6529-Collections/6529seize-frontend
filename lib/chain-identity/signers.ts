import type { Hex } from "viem";
import type { Config } from "wagmi";
import { getAccount, signMessage, signTypedData } from "wagmi/actions";
import {
  ChainOperationError,
  normalizeWalletSignature,
  typedDataForSigning,
  type ChainSigner,
} from "./operation";
import { signWithSessionKey, type StoredSessionKey } from "./sessionKey";

const short = (address: Hex): string =>
  `${address.slice(0, 6)}…${address.slice(-4)}`;

/** Throws unless the connected wallet is `address`. */
function assertConnectedWallet(config: Config, address: Hex): Hex {
  const connected = getAccount(config).address;
  if (connected?.toLowerCase() !== address.toLowerCase()) {
    throw new ChainOperationError(
      "signer_mismatch",
      `Switch your wallet to ${short(address)} and try again.`
    );
  }
  return address;
}

/** The connected wallet signs the draft's typed data (keyType 1). */
export const walletSigner = (config: Config, address: Hex): ChainSigner => ({
  keyType: 1,
  sign: async (draft) => {
    const account = assertConnectedWallet(config, address);
    const signature = await signTypedData(config, {
      account,
      ...typedDataForSigning(draft.typedData),
    } as Parameters<typeof signTypedData>[1]);
    return normalizeWalletSignature(signature);
  },
});

/** This browser's session key signs the draft's txId (keyType 2). */
export const sessionSigner = (record: StoredSessionKey): ChainSigner => ({
  keyType: 2,
  sign: (draft) => signWithSessionKey(record.keyPair.privateKey, draft.txId),
});

/** The connected wallet signs a plain message (`personal_sign`). */
export async function signWalletMessage(
  config: Config,
  address: Hex,
  message: string
): Promise<Hex> {
  const account = assertConnectedWallet(config, address);
  return signMessage(config, { account, message });
}
