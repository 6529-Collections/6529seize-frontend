import { useEffect, useState } from "react";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import { ethers } from "ethers";
import { encryptData } from "../components/app-wallets/app-wallet-helpers";
import { Time } from "../helpers/time";
import useCapacitor from "./useCapacitor";
import EventEmitter from "events";

export interface AppWallet {
  name: string;
  created_at: number;
  address: string;
  address_hashed: string;
  mnemonic: string;
  private_key: string;
  imported: boolean;
}

const WALLET_KEY_PREFIX = "app-wallet_";

export const useAppWallets = () => {
  const [fetchingAppWallets, setFetchingAppWallets] = useState(true);
  const [appWallets, setAppWallets] = useState<AppWallet[]>([]);

  const capacitor = useCapacitor();

  const fetchAppWallets = async () => {
    if (!capacitor.isCapacitor) {
      setFetchingAppWallets(false);
      setAppWallets([]);
      return;
    }

    setFetchingAppWallets(true);
    try {
      const keysResult = await SecureStoragePlugin.keys();
      const walletKeys = keysResult.value.filter((key) =>
        key.startsWith(WALLET_KEY_PREFIX)
      );

      const walletValues = await Promise.all(
        walletKeys.map(async (key) => {
          const valueResult = await SecureStoragePlugin.get({ key });
          return JSON.parse(valueResult.value);
        })
      );

      // Sort by created_at
      walletValues.sort((a, b) => a.created_at - b.created_at);

      setAppWallets(walletValues);
    } catch (error) {
      console.error("Error fetching wallets:", error);
    } finally {
      setFetchingAppWallets(false);
    }
  };

  useEffect(() => {
    fetchAppWallets();
  }, []);

  const createAppWallet = async (
    name: string,
    pass: string
  ): Promise<boolean> => {
    if (!capacitor.isCapacitor) {
      return false;
    }

    const wallet = ethers.Wallet.createRandom();
    const encryptedAddress = await encryptData(
      wallet.address,
      wallet.address,
      pass
    );
    const encryptedMnemonic = await encryptData(
      wallet.address,
      wallet.mnemonic?.phrase ?? "",
      pass
    );
    const encryptedPrivateKey = await encryptData(
      wallet.address,
      wallet.privateKey,
      pass
    );

    const seedWallet: AppWallet = {
      name,
      created_at: Time.now().toSeconds(),
      address: wallet.address,
      address_hashed: encryptedAddress,
      mnemonic: encryptedMnemonic,
      private_key: encryptedPrivateKey,
      imported: false,
    };

    const result = await SecureStoragePlugin.set({
      key: `${WALLET_KEY_PREFIX}${wallet.address}`,
      value: JSON.stringify(seedWallet),
    });

    // Refetch updated list
    await fetchAppWallets();

    appWalletsEventEmitter.emit("update");

    return result.value;
  };

  const importAppWallet = async (
    walletName: string,
    walletPass: string,
    address: string,
    mnemonic: string,
    privateKey: string
  ): Promise<boolean> => {
    if (!capacitor.isCapacitor) {
      return false;
    }

    const encryptedAddress = await encryptData(address, address, walletPass);
    const encryptedMnemonic = await encryptData(address, mnemonic, walletPass);
    const encryptedPrivateKey = await encryptData(
      address,
      privateKey,
      walletPass
    );

    const wallet: AppWallet = {
      name: walletName,
      created_at: Time.now().toSeconds(),
      address,
      address_hashed: encryptedAddress,
      mnemonic: encryptedMnemonic,
      private_key: encryptedPrivateKey,
      imported: true,
    };

    const result = await SecureStoragePlugin.set({
      key: `${WALLET_KEY_PREFIX}${address}`,
      value: JSON.stringify(wallet),
    });

    // Refetch updated list
    await fetchAppWallets();

    appWalletsEventEmitter.emit("update");

    return result.value;
  };

  const deleteAppWallet = async (address: string): Promise<boolean> => {
    if (!capacitor.isCapacitor) {
      return false;
    }

    const result = await SecureStoragePlugin.remove({
      key: `${WALLET_KEY_PREFIX}${address}`,
    });

    // Refetch updated list
    await fetchAppWallets();

    appWalletsEventEmitter.emit("update");

    return result.value;
  };

  return {
    fetchingAppWallets,
    appWallets,
    fetchAppWallets,
    createAppWallet,
    importAppWallet,
    deleteAppWallet,
  };
};

export default useAppWallets;

export const appWalletsEventEmitter = new EventEmitter();
