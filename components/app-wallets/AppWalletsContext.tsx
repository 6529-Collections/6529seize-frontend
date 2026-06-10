"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import { ethers } from "ethers";
import {
  decryptData,
  encryptData,
  isAppWalletEncryptedEnvelope,
} from "./app-wallet-helpers";
import { Time } from "@/helpers/time";
import useCapacitor from "@/hooks/useCapacitor";
import { measureMobileLaunchAsync } from "@/utils/monitoring/mobileLaunchTiming";

export const APP_WALLET_MNEMONIC_UNAVAILABLE = "N/A";

export interface AppWallet {
  name: string;
  created_at: number;
  address: string;
  address_hashed: string;
  mnemonic: string;
  private_key: string;
  imported: boolean;
  encryption_version?: 1 | 2;
  has_mnemonic?: boolean;
  migrated_at?: number;
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
  migrateAppWallet: (address: string, pass: string) => Promise<boolean>;
}

const AppWalletsContext = createContext<AppWalletsContextProps | undefined>(
  undefined
);

const WALLET_KEY_PREFIX = "app-wallet_";

const isSameAddress = (a: string, b: string): boolean =>
  a.toLowerCase() === b.toLowerCase();

const isV2Wallet = (wallet: AppWallet): boolean =>
  wallet.encryption_version === 2 &&
  isAppWalletEncryptedEnvelope(wallet.address_hashed) &&
  isAppWalletEncryptedEnvelope(wallet.private_key) &&
  (wallet.has_mnemonic === false ||
    isAppWalletEncryptedEnvelope(wallet.mnemonic));

async function buildEncryptedAppWallet(params: {
  name: string;
  address: string;
  mnemonic: string;
  privateKey: string;
  pass: string;
  imported: boolean;
  createdAt?: number;
  migratedAt?: number;
}): Promise<AppWallet> {
  const hasMnemonic = params.mnemonic !== APP_WALLET_MNEMONIC_UNAVAILABLE;
  const [encryptedAddress, encryptedMnemonic, encryptedPrivateKey] =
    await Promise.all([
      encryptData(params.address, params.address, params.pass),
      encryptData(params.address, params.mnemonic, params.pass),
      encryptData(params.address, params.privateKey, params.pass),
    ]);

  const appWallet: AppWallet = {
    name: params.name,
    created_at: params.createdAt ?? Time.now().toSeconds(),
    address: params.address,
    address_hashed: encryptedAddress,
    mnemonic: encryptedMnemonic,
    private_key: encryptedPrivateKey,
    imported: params.imported,
    encryption_version: 2,
    has_mnemonic: hasMnemonic,
  };

  if (params.migratedAt !== undefined) {
    appWallet.migrated_at = params.migratedAt;
  }

  return appWallet;
}

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
          await measureMobileLaunchAsync(
            "app_wallets_secure_storage_support_check",
            () => SecureStoragePlugin.keys()
          );
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
      const wallets = await measureMobileLaunchAsync(
        "app_wallets_load",
        getAllWallets
      );

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
      const appWallet = await buildEncryptedAppWallet({
        name,
        address: wallet.address,
        mnemonic: wallet.mnemonic?.phrase ?? APP_WALLET_MNEMONIC_UNAVAILABLE,
        privateKey: wallet.privateKey,
        pass,
        imported: false,
      });

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

      const wallet = await buildEncryptedAppWallet({
        name: walletName,
        address,
        mnemonic,
        privateKey,
        pass: walletPass,
        imported: true,
      });

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

  const migrateAppWallet = useCallback(
    async (address: string, pass: string): Promise<boolean> => {
      if (!appWalletsSupported || !ethers.isAddress(address)) {
        return false;
      }

      try {
        const key = `${WALLET_KEY_PREFIX}${address}`;
        const valueResult = await SecureStoragePlugin.get({ key });
        const wallet = JSON.parse(valueResult.value) as AppWallet;

        if (!wallet || !isSameAddress(wallet.address, address)) {
          return false;
        }

        if (isV2Wallet(wallet)) {
          return true;
        }

        const decryptedAddress = await decryptData(
          wallet.address,
          wallet.address_hashed,
          pass
        );

        if (!isSameAddress(decryptedAddress, wallet.address)) {
          return false;
        }

        const hasMnemonic =
          wallet.has_mnemonic ??
          wallet.mnemonic !== APP_WALLET_MNEMONIC_UNAVAILABLE;
        const decryptedMnemonic = hasMnemonic
          ? await decryptData(wallet.address, wallet.mnemonic, pass)
          : APP_WALLET_MNEMONIC_UNAVAILABLE;
        const decryptedPrivateKey = await decryptData(
          wallet.address,
          wallet.private_key,
          pass
        );

        const migratedWallet = await buildEncryptedAppWallet({
          name: wallet.name,
          address: wallet.address,
          mnemonic: decryptedMnemonic,
          privateKey: decryptedPrivateKey,
          pass,
          imported: wallet.imported,
          createdAt: wallet.created_at,
          migratedAt: Time.now().toSeconds(),
        });

        const result = await SecureStoragePlugin.set({
          key,
          value: JSON.stringify(migratedWallet),
        });

        if (result.value) {
          await fetchAppWallets();
        }

        return result.value;
      } catch (error) {
        console.error("Error migrating app wallet:", error);
        return false;
      }
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
      migrateAppWallet,
    }),
    [
      fetchingAppWallets,
      appWallets,
      appWalletsSupported,
      createAppWallet,
      importAppWallet,
      deleteAppWallet,
      migrateAppWallet,
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
        return JSON.parse(valueResult.value) as AppWallet;
      })
    );

    wallets = walletValues.sort((a, b) => a.created_at - b.created_at);
  } catch (error) {
    console.error("Error fetching wallets:", error);
  }

  return wallets;
};
