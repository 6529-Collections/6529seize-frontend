import {
  type Address,
  getAddress,
  InternalRpcError,
  isAddress,
  recoverMessageAddress,
  recoverTypedDataAddress,
  type Hex,
  UnauthorizedProviderError,
  UnsupportedProviderMethodError,
  UserRejectedRequestError,
} from "viem";
import { ChainNotConfiguredError, createConnector } from "wagmi";
import {
  parseWalletRequest,
  type WalletBridgeResponse,
  type WalletRequest,
  type WalletRequestInput,
} from "@/lib/desktop/wallet-forwarding";

/** wagmi connector id and type for 6529 Desktop wallet forwarding. */
export const DESKTOP_BROWSER_WALLET_CONNECTOR_ID = "desktopBrowserWallet";

/** What the app adds to a request it forwards. */
export interface PreparedWalletRequest {
  /**
   * For a `personal_sign` drop or decision signature: the content behind
   * its payload hash, which the browser page checks and shows.
   */
  readonly context?: string;
  /** The short payload hash the waiting dialog shows, or null. */
  readonly fingerprint: string | null;
}

interface DesktopBrowserWalletConnectorOptions {
  /** The signed-in profile this connector may sign for, or null. */
  readonly getAddress: () => string | null;
  /**
   * Null when the browser page would not sign this request (the same
   * allow-list), which refuses it in the app before the browser opens;
   * otherwise what to add to it.
   */
  readonly prepare: (request: WalletRequest) => PreparedWalletRequest | null;
  /** Opens the request in the browser through the shell and waits. */
  readonly runRequest: (
    request: WalletRequestInput,
    fingerprint: string | null
  ) => Promise<WalletBridgeResponse>;
  /**
   * Called when the app asks to send a transaction, which this connector
   * does not forward, so the app can point to the website.
   */
  readonly onTransactionRefused?: () => void;
}

/** Wallet methods that send (or sign for sending) a transaction. */
const TRANSACTION_METHODS: ReadonlySet<string> = new Set([
  "eth_sendTransaction",
  "wallet_sendTransaction",
  "eth_signTransaction",
  "wallet_sendCalls",
]);

interface ProviderRequest {
  readonly method: string;
  readonly params?: unknown;
}

const asError = (message: string) => new Error(message);

/** The EIP-1193 error for a forwarding failure. */
function toProviderError(code: string): Error {
  switch (code) {
    case "rejected":
    case "cancelled":
      return new UserRejectedRequestError(asError("Declined in the browser."));
    case "not-signed-in":
    case "wrong-account":
      return new UnauthorizedProviderError(
        asError("This profile cannot sign through the browser.")
      );
    case "unsupported":
    case "refused":
    case "invalid":
      return new UnsupportedProviderMethodError(
        asError("The browser page will not sign this request.")
      );
    default:
      return new InternalRpcError(asError(`Browser signing ${code}.`));
  }
}

const sameAddress = (left: string, right: string) =>
  left.toLowerCase() === right.toLowerCase();

/**
 * The request in the form the shell receives, rebuilt from the validated
 * request alone: `personal_sign` as `[message, address]` (with the content
 * behind its payload hash, when the app has it), typed data as
 * `[address, json]` with the exact JSON that was validated.
 */
function toShellInput(
  request: WalletRequest,
  typedDataJson: string | null,
  context: string | undefined
): WalletRequestInput {
  const { method, address, chainId } = request;
  if (request.method === "personal_sign") {
    return {
      method,
      params: [request.message, address],
      address,
      chainId,
      ...(context === undefined ? {} : { context }),
    };
  }
  return { method, params: [address, typedDataJson], address, chainId };
}

/**
 * The signer of `signature` over exactly the validated request: the
 * message bytes, or the EIP-712 digest of the validated typed data.
 */
async function recoverSigner(
  request: WalletRequest,
  signature: Hex
): Promise<Address | null> {
  try {
    if (request.method === "personal_sign") {
      return await recoverMessageAddress({
        message: { raw: request.message },
        signature,
      });
    }
    const { domain, primaryType, message } = request.typedData;
    const { EIP712Domain: _domainType, ...types } = request.typedData.types;
    return await recoverTypedDataAddress({
      domain,
      types,
      primaryType,
      message,
      signature,
    } as Parameters<typeof recoverTypedDataAddress>[0]);
  } catch {
    return null;
  }
}

/**
 * wagmi connector for a 6529 Desktop profile that signed in with a browser
 * wallet. It holds no keys: it reports the signed-in address, answers chain
 * questions itself, and forwards `personal_sign` and `eth_signTypedData_v4`
 * to the user's browser through the desktop shell. Everything else is
 * unsupported, transactions included. A returned signature is accepted only
 * when it recovers to the signed-in address for the exact request.
 */
export function desktopBrowserWalletConnector(
  options: DesktopBrowserWalletConnectorOptions
) {
  return createConnector((config) => {
    let chainId = config.chains[0].id;

    const boundAddress = (): Address | null => {
      const address = options.getAddress();
      return address && isAddress(address, { strict: false })
        ? getAddress(address)
        : null;
    };

    /**
     * Validates the EIP-1193 request once (method, exact params, signer =
     * the bound address, chain, size) into a typed request; that object is
     * what is sent to the shell and what the signature is checked against.
     * Anything else (swapped or extra params, another signer, a typed-data
     * object instead of JSON text) is refused, never guessed.
     */
    const forward = async (method: string, params: unknown): Promise<Hex> => {
      const address = boundAddress();
      if (!address) throw toProviderError("not-signed-in");
      const parsed = parseWalletRequest(
        { method, params, address, chainId },
        config.chains.map((chain) => chain.id)
      );
      if (!parsed.ok) throw toProviderError("invalid");
      const request = parsed.value;
      const prepared = options.prepare(request);
      if (!prepared) throw toProviderError("refused");
      const typedDataJson =
        request.method === "eth_signTypedData_v4"
          ? ((params as readonly unknown[])[1] as string)
          : null;
      const response = await options.runRequest(
        toShellInput(request, typedDataJson, prepared.context),
        prepared.fingerprint
      );
      if (!response.ok) throw toProviderError(response.code);
      const signer = await recoverSigner(request, response.value);
      if (!signer || !sameAddress(signer, address)) {
        throw toProviderError("failed");
      }
      return response.value;
    };

    /** Chain switching is answered here; the browser page checks the chain. */
    const selectChain = (next: number) => {
      const chain = config.chains.find((candidate) => candidate.id === next);
      if (!chain) throw new ChainNotConfiguredError();
      chainId = chain.id;
      config.emitter.emit("change", { chainId });
      return chain;
    };

    const provider = {
      request: async ({ method, params }: ProviderRequest) => {
        switch (method) {
          case "eth_chainId":
            return `0x${chainId.toString(16)}`;
          case "eth_accounts":
          case "eth_requestAccounts": {
            const address = boundAddress();
            return address ? [address] : [];
          }
          case "personal_sign":
          case "eth_signTypedData_v4":
            return forward(method, params);
          default:
            if (TRANSACTION_METHODS.has(method)) {
              options.onTransactionRefused?.();
            }
            throw new UnsupportedProviderMethodError(
              asError(`${method} is not available through the browser.`)
            );
        }
      },
    };

    return {
      id: DESKTOP_BROWSER_WALLET_CONNECTOR_ID,
      name: "Browser wallet",
      type: DESKTOP_BROWSER_WALLET_CONNECTOR_ID,
      connect(parameters) {
        try {
          const address = boundAddress();
          if (!address) throw toProviderError("not-signed-in");
          if (parameters?.chainId !== undefined)
            selectChain(parameters.chainId);
          const accounts = parameters?.withCapabilities
            ? [{ address, capabilities: {} }]
            : [address];
          return Promise.resolve({ accounts, chainId } as never);
        } catch (error_) {
          return Promise.reject(error_ as Error);
        }
      },
      // Nothing to release: the shell keeps no connection.
      disconnect: () => Promise.resolve(),
      getAccounts() {
        const address = boundAddress();
        return Promise.resolve(address ? [address] : []);
      },
      getChainId: () => Promise.resolve(chainId),
      getProvider: () => Promise.resolve(provider),
      isAuthorized: () => Promise.resolve(boundAddress() !== null),
      switchChain({ chainId: next }) {
        try {
          return Promise.resolve(selectChain(next));
        } catch (error_) {
          return Promise.reject(error_ as Error);
        }
      },
      onAccountsChanged(accounts) {
        if (accounts.length === 0) {
          config.emitter.emit("disconnect");
          return;
        }
        config.emitter.emit("change", {
          accounts: accounts.map((account) => getAddress(account)),
        });
      },
      onChainChanged(next) {
        chainId = Number(next);
        config.emitter.emit("change", { chainId });
      },
      onDisconnect() {
        config.emitter.emit("disconnect");
      },
    };
  });
}
