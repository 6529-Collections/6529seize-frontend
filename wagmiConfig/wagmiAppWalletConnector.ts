import { createConnector } from "wagmi";
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, fallback, http, WalletClient } from "viem";
import type { Address, Hex } from "viem";
import type { AppWallet } from "../components/app-wallets/AppWalletsContext";
import { decryptData } from "../components/app-wallets/app-wallet-helpers";
import { getChains } from "../pages/_app";
import { areEqualAddresses } from "../helpers/Helpers";

export const APP_WALLET_CONNECTOR_TYPE = "app-wallet";

interface CreateAppWalletConnectorOptions {
  appWallet: AppWallet;
}

export function createAppWalletConnector(
  options: CreateAppWalletConnectorOptions
) {
  const chains = getChains();

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
      return `https://robohash.org/${options.appWallet.address}.png`;
    },
    get id() {
      return options.appWallet.address;
    },
    get name() {
      return options.appWallet.name;
    },
    get supportsSimulation() {
      return false;
    },
    type: APP_WALLET_CONNECTOR_TYPE,

    async setPassword(password: string): Promise<boolean> {
      try {
        const test = await decryptData(
          options.appWallet.address,
          options.appWallet.address_hashed,
          password
        );

        if (!areEqualAddresses(test, options.appWallet.address)) {
          return false;
        }

        decryptedPrivateKey = await decryptData(
          options.appWallet.address,
          options.appWallet.private_key,
          password
        );

        if (!decryptedPrivateKey) {
          return false;
        }

        return true;
      } catch (error) {
        console.error("Error decrypting private key", error);
        return false;
      }
    },

    async setup() {
      // Optional initialization logic
    },

    async connect({
      chainId: maybeChainId,
      isReconnecting,
    }: {
      chainId?: number;
      isReconnecting?: boolean;
    } = {}) {
      const chainId = maybeChainId ?? chains[0].id;

      if (!decryptedPrivateKey)
        throw new Error("Failed to decrypt private key.");
      const client = await getOrCreateClient(chainId);
      if (!client.account?.address) {
        throw new Error("No valid local account found after decryption.");
      }

      emitter.emit("connect", {
        accounts: [client.account.address],
        chainId: chainId,
      });

      return {
        accounts: [client.account.address],
        chainId: chainId,
      };
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
      if (!newChain) throw new Error(`Chain with id ${newChainId} not found!`);

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
