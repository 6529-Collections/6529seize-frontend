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
import type { WalletBridgeResponse } from "@/lib/desktop/wallet-forwarding";

/** wagmi connector id and type for 6529 Desktop wallet forwarding. */
export const DESKTOP_BROWSER_WALLET_CONNECTOR_ID = "desktopBrowserWallet";

interface DesktopBrowserWalletConnectorOptions {
  /** The signed-in profile this connector may sign for, or null. */
  readonly getAddress: () => string | null;
  /**
   * Whether the browser page would sign this request (the same allow-list);
   * false refuses it in the app, before the browser opens.
   */
  readonly canForward: (request: ForwardedRequest) => boolean;
  /** Opens the request in the browser through the shell and waits. */
  readonly runRequest: (
    request: ForwardedRequest
  ) => Promise<WalletBridgeResponse>;
}

interface ForwardedRequest {
  readonly method: string;
  readonly params: unknown;
  readonly address: string;
  readonly chainId: number;
}

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

/** The wallet's signature must be the bound account's, for this request. */
async function recoverSigner(
  method: string,
  params: readonly unknown[],
  signature: Hex
): Promise<Address | null> {
  try {
    if (method === "personal_sign") {
      return await recoverMessageAddress({
        message: { raw: params[0] as Hex },
        signature,
      });
    }
    const typedData = JSON.parse(params[1] as string) as {
      domain: Record<string, unknown>;
      types: Record<string, unknown>;
      primaryType: string;
      message: Record<string, unknown>;
    };
    const { EIP712Domain: _domainType, ...types } = typedData.types;
    return await recoverTypedDataAddress({
      ...typedData,
      types,
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

    const forward = async (method: string, params: unknown): Promise<Hex> => {
      const address = boundAddress();
      if (!address || !Array.isArray(params)) {
        throw toProviderError(address ? "invalid" : "not-signed-in");
      }
      const request = { method, params, address, chainId };
      if (!options.canForward(request)) throw toProviderError("refused");
      const response = await options.runRequest(request);
      if (!response.ok) throw toProviderError(response.code);
      const signer = await recoverSigner(method, params, response.value);
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
        } catch (failure) {
          return Promise.reject(failure as Error);
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
        } catch (failure) {
          return Promise.reject(failure as Error);
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
