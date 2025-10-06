import type { AppWallet } from "@/components/app-wallets/AppWalletsContext";
import { decryptData } from "@/components/app-wallets/app-wallet-helpers";
import { areEqualAddresses } from "@/helpers/Helpers";
import {
  InvalidPasswordError,
  PrivateKeyDecryptionError,
  WalletAuthenticationError,
} from "@/src/errors/wallet-auth";
import type { Address, Chain, Hex } from "viem";
import { createWalletClient, fallback, http, WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createConnector } from "wagmi";

export const APP_WALLET_CONNECTOR_TYPE = "app-wallet";

interface CreateAppWalletConnectorOptions {
  appWallet: AppWallet;
}

export function createAppWalletConnector(
  chains: Chain[],
  options: CreateAppWalletConnectorOptions,
  requestPasswordModal: () => Promise<string>
) {
  let walletClient: WalletClient | undefined;
  let currentChainId: number = chains[0].id;

  let decryptedPrivateKey: string | null = null;

  async function getOrCreateClient(chainId: number) {
    if (walletClient) return walletClient;

    if (!decryptedPrivateKey) {
      throw new Error("No decrypted key found. Call connect() first.");
    }

    const account = privateKeyToAccount(ensureHexPrefix(decryptedPrivateKey));

    const chain = chains.find((c) => c.id === chainId);

    walletClient = createWalletClient({
      account,
      chain,
      transport: fallback([http(), http("https://rpc1.6529.io")], {
        retryCount: 3,
      }),
    });
    currentChainId = chainId;
    return walletClient;
  }

  function ensureHexPrefix(value: string): Hex {
    const hexValue = value.startsWith("0x") ? value : `0x${value}`;
    return hexValue as Hex;
  }

  return createConnector(({ emitter }) => ({
    get icon() {
      return `https://robohash.org/${options.appWallet.address}.png?size=64x64`;
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
      return `https://robohash.org/${options.appWallet.address}.png?size=64x64`;
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
        const isCapacitor =
          !!globalThis?.window?.Capacitor?.isNativePlatform?.();

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
      chainId?: number;
      isReconnecting?: boolean;
      withCapabilities?: boolean | withCapabilities;
    }): Promise<{
      accounts: withCapabilities extends true
        ? readonly {
            address: `0x${string}`;
            capabilities: Record<string, unknown>;
          }[]
        : readonly `0x${string}`[];
      chainId: number;
    }> {
      const maybeChainId = opts?.chainId;
      const chainId = maybeChainId ?? chains[0].id;

      // Validate chainId
      const validChain = chains.find((c) => c.id === chainId);
      if (!validChain) {
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

      const client = await getOrCreateClient(chainId);
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
      currentChainId = chainId;

      // Emit connect event (addresses only)
      emitter.emit("connect", {
        accounts: [client.account.address],
        chainId,
      });

      if (opts?.withCapabilities) {
        const accountsWithCaps = (
          [client.account.address] as readonly `0x${string}`[]
        ).map((address) => ({
          address,
          capabilities: {} as Record<string, unknown>,
        })) as unknown as readonly {
          address: `0x${string}`;
          capabilities: Record<string, unknown>;
        }[];

        return {
          accounts: accountsWithCaps as any,
          chainId,
        } as any;
      }

      return {
        accounts: [client.account.address] as readonly `0x${string}`[],
        chainId,
      } as any;
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
      const numericId = parseInt(hexChainId, 16);
      emitter.emit("change", { chainId: numericId });
    },
    onConnect(connectInfo) {
      emitter.emit("connect", {
        accounts: walletClient?.account?.address
          ? [walletClient.account.address]
          : [],
        chainId: currentChainId,
      });
    },
    onDisconnect(error) {
      emitter.emit("disconnect");
    },
    onMessage(message) {
      emitter.emit("message", message);
    },
  }));
}
