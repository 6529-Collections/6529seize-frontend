import type {
  Address,
  Chain,
  Hex,
  SignableMessage,
  TransactionSerializable,
  TypedDataDefinition,
} from "viem";
import { toHex, UserRejectedRequestError } from "viem";

/**
 * What an app wallet is about to sign, in the terms the confirmation dialog
 * shows. Built by the connector from the exact parameters it then signs.
 */
export type AppWalletSigningRequest =
  | {
      readonly kind: "message";
      readonly walletAddress: Address;
      /** Plain text message, or null when the message is raw bytes. */
      readonly text: string | null;
      /** Raw bytes as hex, or null for a plain text message. */
      readonly rawHex: Hex | null;
    }
  | {
      readonly kind: "typedData";
      readonly walletAddress: Address;
      readonly primaryType: string;
      readonly domainName: string | null;
      readonly domainChainId: number | null;
      readonly domainChainName: string | null;
      readonly verifyingContract: Address | null;
      readonly messageJson: string;
    }
  | {
      readonly kind: "transaction";
      readonly walletAddress: Address;
      /** Recipient, or null for a contract deployment. */
      readonly to: Address | null;
      readonly valueWei: bigint;
      readonly chainId: number | null;
      readonly chainName: string | null;
      readonly hasCallData: boolean;
      /** The 4-byte function selector of the call data, when present. */
      readonly selector: Hex | null;
    };

type AppWalletSigningConfirmationDelegate = (
  request: AppWalletSigningRequest
) => Promise<boolean>;

let confirmationDelegate: AppWalletSigningConfirmationDelegate | null = null;
// One dialog at a time: later requests wait until earlier ones are settled.
let confirmationQueue: Promise<void> = Promise.resolve();

/**
 * Registers the app-owned dialog that approves app-wallet requests. Returns
 * an unregister function that only clears this delegate.
 */
export function setAppWalletSigningConfirmationDelegate(
  delegate: AppWalletSigningConfirmationDelegate
): () => void {
  confirmationDelegate = delegate;
  return () => {
    if (confirmationDelegate === delegate) {
      confirmationDelegate = null;
    }
  };
}

function createUserRejectedError(reason: string): UserRejectedRequestError {
  return new UserRejectedRequestError(new Error(reason));
}

async function askForConfirmation(
  request: AppWalletSigningRequest
): Promise<void> {
  const delegate = confirmationDelegate;
  if (!delegate) {
    throw createUserRejectedError(
      "No confirmation dialog is available for this wallet request."
    );
  }

  let approved = false;
  try {
    approved = (await delegate(request)) === true;
  } catch {
    approved = false;
  }
  if (!approved) {
    throw createUserRejectedError("The wallet request was cancelled.");
  }
}

/**
 * Resolves only after the user approves this exact request in the app's own
 * dialog. Cancelling, or having no dialog mounted, rejects with the standard
 * EIP-1193 user-rejected error (code 4001).
 */
export function confirmAppWalletSigningRequest(
  request: AppWalletSigningRequest
): Promise<void> {
  const run = () => askForConfirmation(request);
  const result = confirmationQueue.then(run, run);
  confirmationQueue = result.catch(() => undefined);
  return result;
}

export function describeAppWalletMessage(
  walletAddress: Address,
  message: SignableMessage
): AppWalletSigningRequest {
  if (typeof message === "string") {
    return { kind: "message", walletAddress, text: message, rawHex: null };
  }
  const rawHex =
    typeof message.raw === "string" ? message.raw : toHex(message.raw);
  return { kind: "message", walletAddress, text: null, rawHex };
}

function stringifyTypedDataMessage(message: unknown): string {
  try {
    return JSON.stringify(
      message ?? null,
      (_key, value: unknown) =>
        typeof value === "bigint" ? value.toString() : value,
      2
    );
  } catch {
    return "";
  }
}

function toChainId(value: unknown): number | null {
  if (typeof value === "number" && Number.isSafeInteger(value)) {
    return value;
  }
  if (typeof value === "bigint") {
    const asNumber = Number(value);
    return Number.isSafeInteger(asNumber) ? asNumber : null;
  }
  // EIP-712 domains may carry the chain ID as a hex or decimal string.
  if (
    typeof value === "string" &&
    /^(0x[0-9a-f]+|[0-9]+)$/i.test(value.trim())
  ) {
    return toChainId(BigInt(value.trim()));
  }
  return null;
}

function getChainName(
  chains: readonly Chain[],
  chainId: number | null
): string | null {
  if (chainId === null) {
    return null;
  }
  return chains.find((chain) => chain.id === chainId)?.name ?? null;
}

export function describeAppWalletTypedData(
  walletAddress: Address,
  parameters: TypedDataDefinition,
  chains: readonly Chain[]
): AppWalletSigningRequest {
  const domain: Record<string, unknown> = parameters.domain ?? {};
  const domainName = domain["name"];
  const verifyingContract = domain["verifyingContract"];
  const domainChainId = toChainId(domain["chainId"]);
  return {
    kind: "typedData",
    walletAddress,
    primaryType: String(parameters.primaryType),
    domainName: typeof domainName === "string" ? domainName : null,
    domainChainId,
    domainChainName: getChainName(chains, domainChainId),
    verifyingContract:
      typeof verifyingContract === "string"
        ? (verifyingContract as Address)
        : null,
    messageJson: stringifyTypedDataMessage(parameters.message),
  };
}

export function describeAppWalletTransaction(
  walletAddress: Address,
  transaction: TransactionSerializable,
  chains: readonly Chain[]
): AppWalletSigningRequest {
  const data =
    transaction.data && transaction.data !== "0x" ? transaction.data : null;
  const chainId = transaction.chainId ?? null;
  return {
    kind: "transaction",
    walletAddress,
    to: transaction.to ?? null,
    valueWei: transaction.value ?? 0n,
    chainId,
    chainName: getChainName(chains, chainId),
    hasCallData: data !== null,
    selector:
      data !== null && data.length >= 10 ? (data.slice(0, 10) as Hex) : null,
  };
}
