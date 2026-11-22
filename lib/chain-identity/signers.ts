import { hashTypedData, type Hex } from "viem";
import type { Config } from "wagmi";
import { getAccount, signMessage, signTypedData } from "wagmi/actions";
import {
  ChainOperationError,
  normalizeWalletSignature,
  typedDataForSigning,
  type ChainSigner,
} from "./operation";
import type {
  profileDocumentTypedData,
  ProfileDocSignature,
} from "./profileDoc";
import { signWithSessionKey, type StoredSessionKey } from "./sessionKey";
import { addressWord } from "./state";

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

/**
 * Signs a later profile document (P37 4.2): EIP-712 `ProfileDocument` in
 * the 6529 Network domain, by this browser's session key when it has one,
 * else by the identity's wallet.
 */
export async function signProfileDocument(
  config: Config,
  signer:
    | { readonly kind: "wallet"; readonly address: Hex }
    | { readonly kind: "session"; readonly record: StoredSessionKey },
  typedData: ReturnType<typeof profileDocumentTypedData>
): Promise<ProfileDocSignature> {
  if (signer.kind === "session") {
    return {
      keyType: 2,
      keyId: signer.record.keyId,
      signature: await signWithSessionKey(
        signer.record.keyPair.privateKey,
        hashTypedData(typedData)
      ),
    };
  }
  const account = assertConnectedWallet(config, signer.address);
  const signature = await signTypedData(config, {
    account,
    ...typedData,
  } as Parameters<typeof signTypedData>[1]);
  return {
    keyType: 1,
    keyId: addressWord(signer.address),
    signature: normalizeWalletSignature(signature),
  };
}
