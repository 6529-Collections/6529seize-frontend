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
      /** False when the content cannot be shown; it must not be approved. */
      readonly canShowContent: boolean;
    }
  | {
      readonly kind: "typedData";
      readonly walletAddress: Address;
      readonly primaryType: string;
      readonly domainName: string | null;
      readonly domainChainId: number | null;
      readonly domainChainName: string | null;
      readonly verifyingContract: Address | null;
      /** The message as JSON, or null when it cannot be shown. */
      readonly messageJson: string | null;
      readonly canShowContent: boolean;
    }
  | {
      readonly kind: "transaction";
      readonly walletAddress: Address;
      /** Recipient, or null for a contract deployment. */
      readonly to: Address | null;
      readonly valueWei: bigint;
      readonly chainId: number | null;
      readonly chainName: string | null;
      /** The native token of the chain, or null when the chain is unknown. */
      readonly nativeCurrency: Readonly<{
        symbol: string;
        decimals: number;
      }> | null;
      /** Length of the call data in bytes (0 when there is none). */
      readonly callDataBytes: number;
      /** The 4-byte function selector of a contract call, when present. */
      readonly selector: Hex | null;
      readonly canShowContent: boolean;
    };

type AppWalletSigningConfirmationDelegate = (
  request: AppWalletSigningRequest
) => Promise<boolean>;

type ActiveConfirmation = Readonly<{
  delegate: AppWalletSigningConfirmationDelegate;
  settle: (approved: boolean) => void;
}>;

let confirmationDelegate: AppWalletSigningConfirmationDelegate | null = null;
// One dialog at a time: later requests wait until earlier ones are settled.
let confirmationQueue: Promise<void> = Promise.resolve();
// The request currently shown. It is settled here when its dialog host goes
// away, so a host that never answers cannot block later requests.
let activeConfirmation: ActiveConfirmation | null = null;

/**
 * Registers the app-owned dialog that approves app-wallet requests. A new
 * host rejects the request an earlier host is showing. Returns an unregister
 * function that only clears this delegate and rejects its open request.
 */
export function setAppWalletSigningConfirmationDelegate(
  delegate: AppWalletSigningConfirmationDelegate
): () => void {
  activeConfirmation?.settle(false);
  confirmationDelegate = delegate;
  return () => {
    if (activeConfirmation?.delegate === delegate) {
      activeConfirmation.settle(false);
    }
    if (confirmationDelegate === delegate) {
      confirmationDelegate = null;
    }
  };
}

function waitForAnswer(
  delegate: AppWalletSigningConfirmationDelegate,
  request: AppWalletSigningRequest
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let settled = false;
    const settle = (approved: boolean) => {
      if (settled) return;
      settled = true;
      if (activeConfirmation?.settle === settle) {
        activeConfirmation = null;
      }
      resolve(approved);
    };
    activeConfirmation = { delegate, settle };
    delegate(request)
      .then((approved) => settle(approved === true))
      .catch(() => settle(false));
  });
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

  const approved = await waitForAnswer(delegate, request);
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
    return {
      kind: "message",
      walletAddress,
      text: message,
      rawHex: null,
      canShowContent: message.length > 0,
    };
  }
  const rawHex = readRawMessage(message.raw);
  return {
    kind: "message",
    walletAddress,
    text: null,
    rawHex,
    canShowContent: rawHex !== null && rawHex !== "0x",
  };
}

function readRawMessage(raw: unknown): Hex | null {
  try {
    if (typeof raw === "string") {
      return /^0x[0-9a-f]*$/i.test(raw) ? (raw as Hex) : null;
    }
    return raw instanceof Uint8Array ? toHex(raw) : null;
  } catch {
    return null;
  }
}

function stringifyTypedDataMessage(message: unknown): string | null {
  try {
    return JSON.stringify(
      message ?? null,
      (_key, value: unknown) =>
        typeof value === "bigint" ? value.toString() : value,
      2
    );
  } catch {
    // For example a circular structure: shown as unavailable, never empty.
    return null;
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

function findChain(
  chains: readonly Chain[],
  chainId: number | null
): Chain | null {
  if (chainId === null) {
    return null;
  }
  return chains.find((chain) => chain.id === chainId) ?? null;
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
  const messageJson = stringifyTypedDataMessage(parameters.message);
  return {
    kind: "typedData",
    walletAddress,
    primaryType: String(parameters.primaryType),
    domainName: typeof domainName === "string" ? domainName : null,
    domainChainId,
    domainChainName: findChain(chains, domainChainId)?.name ?? null,
    verifyingContract:
      typeof verifyingContract === "string"
        ? (verifyingContract as Address)
        : null,
    messageJson,
    canShowContent: messageJson !== null && messageJson.length > 0,
  };
}

export function describeAppWalletTransaction(
  walletAddress: Address,
  transaction: TransactionSerializable,
  chains: readonly Chain[]
): AppWalletSigningRequest {
  const data = transaction.data ?? "0x";
  const callDataBytes = Math.floor(Math.max(data.length - 2, 0) / 2);
  const chainId = transaction.chainId ?? null;
  const chain = findChain(chains, chainId);
  const to = transaction.to ?? null;
  return {
    kind: "transaction",
    walletAddress,
    to,
    valueWei: transaction.value ?? 0n,
    chainId,
    chainName: chain?.name ?? null,
    nativeCurrency: chain
      ? {
          symbol: chain.nativeCurrency.symbol,
          decimals: chain.nativeCurrency.decimals,
        }
      : null,
    callDataBytes,
    // Only a call to an existing contract has a function selector; shorter
    // data and contract creation code do not.
    selector:
      to !== null && callDataBytes >= 4 ? (data.slice(0, 10) as Hex) : null,
    canShowContent: true,
  };
}
