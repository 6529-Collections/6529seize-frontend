import type { AppWallet } from "@/components/app-wallets/AppWalletsContext";
import { decryptData } from "@/components/app-wallets/app-wallet-helpers";
import { areEqualAddresses } from "@/helpers/Helpers";
import {
  InvalidPasswordError,
  PrivateKeyDecryptionError,
  WalletAuthenticationError,
} from "@/errors/wallet-auth";
import { getAppWalletAvatarDataUri } from "@/helpers/app-wallet-avatar.helpers";
import type {
  Address,
  Chain,
  Hex,
  LocalAccount,
  PrivateKeyAccount,
  Transport,
  WalletClient,
} from "viem";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount, toAccount } from "viem/accounts";
import {
  type CreateConnectorFn,
  createConnector as createWagmiConnector,
} from "wagmi";
import { APP_WALLET_CONNECTOR_TYPE } from "./appWalletConnectorType";
import {
  confirmAppWalletSigningRequest,
  describeAppWalletMessage,
  describeAppWalletTransaction,
  describeAppWalletTypedData,
} from "./appWalletSigningConfirmation";

export { APP_WALLET_CONNECTOR_TYPE };

interface CreateAppWalletConnectorOptions {
  appWallet: AppWallet;
}

type AppWalletAccountWithCapabilities = {
  address: Address;
  capabilities: Record<string, unknown>;
};

type ConfiguredTransports = Record<number, Transport> | undefined;

// Used only when the wagmi config installing this connector has no transport
// for the chain. viem's default public RPC is never placed first.
const APP_WALLET_FALLBACK_RPC_URL = "https://rpc1.6529.io";

/**
 * Wraps the decrypted key so every message, typed-data signature and
 * transaction waits for the app's own confirmation dialog. Raw hash signing
 * and account delegations (EIP-7702) are not exposed.
 */
function createConfirmingAccount(
  signer: PrivateKeyAccount,
  chains: readonly Chain[]
): LocalAccount {
  const address = signer.address;
  return toAccount({
    address,
    async signMessage({ message }) {
      await confirmAppWalletSigningRequest(
        describeAppWalletMessage(address, message)
      );
      return signer.signMessage({ message });
    },
    async signTypedData(parameters) {
      await confirmAppWalletSigningRequest(
        describeAppWalletTypedData(address, parameters as never, chains)
      );
      return signer.signTypedData(parameters as never);
    },
    async signTransaction(transaction, options) {
      if (
        "authorizationList" in transaction &&
        Array.isArray(transaction.authorizationList) &&
        transaction.authorizationList.length > 0
      ) {
        throw new Error("App wallets do not sign account delegations.");
      }
      await confirmAppWalletSigningRequest(
        describeAppWalletTransaction(address, transaction, chains)
      );
      return signer.signTransaction(transaction, options as never);
    },
  });
}

type AppWalletConnectResult<withCapabilities extends boolean> = {
  accounts: withCapabilities extends true
    ? readonly AppWalletAccountWithCapabilities[]
    : readonly Address[];
  chainId: number;
};

export function createAppWalletConnector(
  chains: Chain[],
  options: CreateAppWalletConnectorOptions,
  requestPasswordModal: () => Promise<string>
) {
  let walletClient: WalletClient | undefined;
  let currentChainId: number = chains[0]?.id!;

  let decryptedPrivateKey: string | null = null;
  let configuredTransports: ConfiguredTransports;

  function getTransport(chainId: number): Transport {
    // Reuse the transport, and so the RPC order, of the wagmi config this
    // connector is installed on.
    return configuredTransports?.[chainId] ?? http(APP_WALLET_FALLBACK_RPC_URL);
  }

  // The chain and transports the cached client was built with.
  let walletClientChainId: number | undefined;
  let walletClientTransports: ConfiguredTransports;

  async function getOrCreateClient(chainId: number) {
    if (
      walletClient &&
      walletClientChainId === chainId &&
      walletClientTransports === configuredTransports
    ) {
      return walletClient;
    }

    if (!decryptedPrivateKey) {
      throw new Error("No decrypted key found. Call connect() first.");
    }

    const signer = privateKeyToAccount(ensureHexPrefix(decryptedPrivateKey));
    const account = createConfirmingAccount(signer, chains);

    const chain = chains.find((c) => c.id === chainId);

    walletClient = createWalletClient({
      account,
      chain,
      transport: getTransport(chainId),
    });
    walletClientChainId = chainId;
    walletClientTransports = configuredTransports;
    currentChainId = chainId;
    return walletClient;
  }

  function ensureHexPrefix(value: string): Hex {
    const hexValue = value.startsWith("0x") ? value : `0x${value}`;
    return hexValue as Hex;
  }

  // wagmi's createConnector, also keeping the transports of the wagmi config
  // that installs this connector.
  function createConnector<
    provider,
    properties extends Record<string, unknown>,
  >(
    connectorFn: CreateConnectorFn<provider, properties>
  ): CreateConnectorFn<provider, properties> {
    return createWagmiConnector<provider, properties>((config) => {
      configuredTransports = config.transports;
      return connectorFn(config);
    });
  }

  return createConnector(({ emitter }) => ({
    get icon() {
      return getAppWalletAvatarDataUri(options.appWallet.address);
    },
    get id() {
      return options.appWallet.address;
    },
    get name() {
      const shortAddress =
        options.appWallet.address.slice(0, 6) +
        "..." +
        options.appWallet.address.slice(-4);
      return `${options.appWallet.name} (${shortAddress})`;
    },
    get supportsSimulation() {
      return false;
    },
    get supportedConnectors() {
      return [APP_WALLET_CONNECTOR_TYPE];
    },
    get iconUrl() {
      return getAppWalletAvatarDataUri(options.appWallet.address);
    },
    get walletConnectId() {
      return undefined; // Not a WalletConnect connector
    },
    type: APP_WALLET_CONNECTOR_TYPE,

    async setPassword(password: string): Promise<void> {
      // Input validation - fail fast
      if (!password || typeof password !== "string") {
        throw new InvalidPasswordError(
          "Password is required and must be a string"
        );
      }

      try {
        // Check if we're in Capacitor for more lenient validation
        const isCapacitor = !!globalThis.window.Capacitor?.isNativePlatform?.();

        // Validate password by decrypting address hash
        const decryptedAddress = await decryptData(
          options.appWallet.address,
          options.appWallet.address_hashed,
          password
        );

        if (!decryptedAddress) {
          throw new InvalidPasswordError(
            "Password decryption resulted in empty data"
          );
        }

        // For Capacitor, be more lenient with address comparison
        if (isCapacitor) {
          const match =
            decryptedAddress.toLowerCase() ===
            options.appWallet.address.toLowerCase();
          if (!match) {
            throw new InvalidPasswordError("Password does not match wallet");
          }
        } else if (
          !areEqualAddresses(decryptedAddress, options.appWallet.address)
        ) {
          throw new InvalidPasswordError(
            "Password does not match wallet - address verification failed"
          );
        }

        // Decrypt the private key
        const privateKey = await decryptData(
          options.appWallet.address,
          options.appWallet.private_key,
          password
        );

        if (!privateKey) {
          throw new PrivateKeyDecryptionError(
            "Private key decryption returned empty result"
          );
        }

        let decryptedAccount;
        try {
          decryptedAccount = privateKeyToAccount(ensureHexPrefix(privateKey));
        } catch (error) {
          throw new PrivateKeyDecryptionError(
            "Private key format is invalid",
            error
          );
        }

        if (
          !areEqualAddresses(
            decryptedAccount.address,
            options.appWallet.address
          )
        ) {
          throw new WalletAuthenticationError(
            "Decrypted private key does not match wallet address"
          );
        }

        // Only set after all validations pass
        decryptedPrivateKey = privateKey;
      } catch (error) {
        // Clear any potentially set private key on error
        decryptedPrivateKey = null;

        // Re-throw our custom errors unchanged
        if (error instanceof WalletAuthenticationError) {
          throw error;
        }

        // Wrap unexpected errors
        throw new PrivateKeyDecryptionError(
          "Unexpected error during password validation",
          error
        );
      }
    },

    async setup() {
      // Optional initialization logic
    },

    async connect<withCapabilities extends boolean = false>(opts?: {
      chainId?: number | undefined;
      isReconnecting?: boolean | undefined;
      withCapabilities?: boolean | withCapabilities | undefined;
    }): Promise<AppWalletConnectResult<withCapabilities>> {
      const maybeChainId = opts?.chainId;
      const chainId = maybeChainId ?? chains[0]?.id;

      // Validate chainId
      const isValidChain = chains.some((c) => c.id === chainId);
      if (!isValidChain) {
        throw new Error(
          `Chain ID ${chainId} is not supported. Supported chains: ${chains
            .map((c) => c.id)
            .join(", ")}`
        );
      }

      if (!decryptedPrivateKey) {
        const password = await requestPasswordModal();
        if (!password) {
          throw new InvalidPasswordError(
            "Password is required for wallet connection"
          );
        }
        // Throws on failure
        await this.setPassword(password);
      }

      if (!decryptedPrivateKey) {
        throw new PrivateKeyDecryptionError(
          "Private key not available after password validation"
        );
      }

      const connectedChainId = chainId!;
      const client = await getOrCreateClient(connectedChainId);
      if (!client.account?.address) {
        throw new Error("No valid local account found after decryption.");
      }

      // Verify the account address matches the expected wallet address
      if (
        !areEqualAddresses(client.account.address, options.appWallet.address)
      ) {
        throw new WalletAuthenticationError(
          "Account address mismatch - potential security breach"
        );
      }

      // Keep internal state up to date
      currentChainId = connectedChainId;

      // Emit connect event (addresses only)
      emitter.emit("connect", {
        accounts: [client.account.address],
        chainId: connectedChainId,
      });

      const result = opts?.withCapabilities
        ? {
            accounts: [
              {
                address: client.account.address,
                capabilities: {},
              },
            ] satisfies readonly AppWalletAccountWithCapabilities[],
            chainId: connectedChainId,
          }
        : {
            accounts: [client.account.address] satisfies readonly Address[],
            chainId: connectedChainId,
          };

      // TypeScript cannot narrow wagmi's generic `withCapabilities` parameter
      // from the runtime option; this assertion is limited to the two account
      // shapes constructed above from the validated wallet client.
      return result as unknown as AppWalletConnectResult<withCapabilities>;
    },

    async disconnect() {
      walletClient = undefined;
      decryptedPrivateKey = null;
      emitter.emit("disconnect");
    },

    async getAccounts() {
      const client = await getOrCreateClient(currentChainId);
      return client.account?.address ? [client.account.address] : [];
    },

    async getChainId() {
      return currentChainId;
    },

    async getProvider() {
      return getOrCreateClient(currentChainId);
    },

    async getClient() {
      return getOrCreateClient(currentChainId);
    },

    async isAuthorized() {
      return !!decryptedPrivateKey;
    },

    async switchChain({ chainId: newChainId }) {
      currentChainId = newChainId;
      const newChain = chains.find((c) => c.id === newChainId);
      if (!newChain) {
        throw new Error(`Chain with id ${newChainId} not found!`);
      }

      walletClient = undefined;
      const client = await getOrCreateClient(newChainId);
      if (!client.account?.address) {
        throw new Error("No valid local account found after decryption.");
      }

      emitter.emit("change", { chainId: newChainId });

      return newChain;
    },

    onAccountsChanged(accounts) {
      emitter.emit("change", { accounts: accounts as Address[] });
    },
    onChainChanged(hexChainId) {
      const normalizedHexChainId = hexChainId.trim();
      if (!/^0x[0-9a-f]+$/i.test(normalizedHexChainId)) {
        return;
      }
      const numericId = Number.parseInt(normalizedHexChainId, 16);
      emitter.emit("change", { chainId: numericId });
    },
    onConnect() {
      emitter.emit("connect", {
        accounts: walletClient?.account?.address
          ? [walletClient.account.address]
          : [],
        chainId: currentChainId,
      });
    },
    onDisconnect() {
      emitter.emit("disconnect");
    },
    onMessage(message) {
      emitter.emit("message", message);
    },
  }));
}
