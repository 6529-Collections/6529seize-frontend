"use client";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import { ethers } from "ethers";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";


import { Time } from "@/helpers/time";
import useCapacitor from "@/hooks/useCapacitor";

import { encryptData } from "./app-wallet-helpers";

export interface AppWallet {
  name: string;
  created_at: number;
  address: string;
  address_hashed: string;
  mnemonic: string;
  private_key: string;
  imported: boolean;
}

interface AppWalletsContextProps {
  fetchingAppWallets: boolean;
  appWallets: AppWallet[];
  appWalletsSupported: boolean;
  createAppWallet: (name: string, pass: string) => Promise<boolean>;
  importAppWallet: (
    walletName: string,
    walletPass: string,
    address: string,
    mnemonic: string,
    privateKey: string
  ) => Promise<boolean>;
  deleteAppWallet: (address: string) => Promise<boolean>;
}

const AppWalletsContext = createContext<AppWalletsContextProps | undefined>(
  undefined
);

const WALLET_KEY_PREFIX = "app-wallet_";

export const AppWalletsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [fetchingAppWallets, setFetchingAppWallets] = useState(true);
  const [appWallets, setAppWallets] = useState<AppWallet[]>([]);
  const [appWalletsSupported, setAppWalletsSupported] = useState(false);

  const capacitor = useCapacitor();
  const { isCapacitor } = capacitor;

  const fetchAppWallets = useCallback(async () => {
    if (!appWalletsSupported) {
      setFetchingAppWallets(false);
      setAppWallets([]);
      return;
    }

    setFetchingAppWallets(true);

    const wallets = await getAllWallets();

    setAppWallets(wallets);
    setFetchingAppWallets(false);
  }, [appWalletsSupported]);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      let supported = false;
      if (isCapacitor) {
        try {
          await SecureStoragePlugin.keys();
          supported = true;
        } catch (error) {
          console.error("SecureStoragePlugin is not available:", error);
        }
      }

      if (cancelled) {
        return;
      }

      setAppWalletsSupported(supported);

      if (!supported) {
        setAppWallets([]);
        setFetchingAppWallets(false);
        return;
      }

      setFetchingAppWallets(true);
      const wallets = await getAllWallets();

      if (cancelled) {
        return;
      }

      setAppWallets(wallets);
      setFetchingAppWallets(false);
    };

    initialize();

    return () => {
      cancelled = true;
    };
  }, [isCapacitor]);

  const createAppWallet = useCallback(
    async (name: string, pass: string): Promise<boolean> => {
      if (!appWalletsSupported) return false;

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

      const appWallet: AppWallet = {
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
        value: JSON.stringify(appWallet),
      });

      await fetchAppWallets();

      return result.value;
    },
    [appWalletsSupported, fetchAppWallets]
  );

  const importAppWallet = useCallback(
    async (
      walletName: string,
      walletPass: string,
      address: string,
      mnemonic: string,
      privateKey: string
    ): Promise<boolean> => {
      if (!appWalletsSupported) return false;

      const encryptedAddress = await encryptData(address, address, walletPass);
      const encryptedMnemonic = await encryptData(
        address,
        mnemonic,
        walletPass
      );
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

      await fetchAppWallets();

      return result.value;
    },
    [appWalletsSupported, fetchAppWallets]
  );

  const deleteAppWallet = useCallback(
    async (address: string): Promise<boolean> => {
      if (!appWalletsSupported) return false;

      const result = await SecureStoragePlugin.remove({
        key: `${WALLET_KEY_PREFIX}${address}`,
      });

      await fetchAppWallets();

      return result.value;
    },
    [appWalletsSupported, fetchAppWallets]
  );

  const value = useMemo(
    () => ({
      fetchingAppWallets,
      appWallets,
      appWalletsSupported,
      createAppWallet,
      importAppWallet,
      deleteAppWallet,
    }),
    [
      fetchingAppWallets,
      appWallets,
      appWalletsSupported,
      createAppWallet,
      importAppWallet,
      deleteAppWallet,
    ]
  );

  return (
    <AppWalletsContext.Provider value={value}>
      {children}
    </AppWalletsContext.Provider>
  );
};

export const useAppWallets = () => {
  const context = useContext(AppWalletsContext);
  if (!context) {
    throw new Error("useAppWallets must be used within an AppWalletsProvider");
  }
  return context;
};

const getAllWallets = async () => {
  let wallets: AppWallet[] = [];
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

    wallets = walletValues.sort((a, b) => a.created_at - b.created_at);
  } catch (error) {
    console.error("Error fetching wallets:", error);
  }

  return wallets;
};
